import { uuid } from '../lib/crypto';
import { addDays, formatDay, periodEndFor, periodStartFor, type DayKey } from '../lib/dates';
import type {
  AppNotification,
  Chore,
  ChoreAssignment,
  CoinTransactionType,
  Family,
  ListingKind,
  ListingStatus,
  MarketListing,
  NotificationKind,
  TimeOfDay,
  User,
} from '../models';
import { UserFacingError, type Deps } from './deps';

/** Every market action, as sent from any device. Validated here, so it's safe to take from the network. */
export type MarketOp =
  | { op: 'sell'; assignmentId: string; price: number }
  | { op: 'cancelSale'; listingId: string }
  | { op: 'buy'; listingId: string }
  | { op: 'offer'; price: number }
  | { op: 'withdrawOffer'; listingId: string }
  | { op: 'send'; assignmentId: string; offerId: string }
  | { op: 'answerHandoff'; listingId: string; accept: boolean }
  | { op: 'cancelHandoff'; listingId: string }
  | { op: 'push'; assignmentId: string; targetId: string }
  | { op: 'answerPush'; listingId: string; reject: boolean };

export interface MarketOverview {
  /** Every open listing in the family. */
  open: MarketListing[];
  /** The chores those listings are about, by assignment id. */
  assignments: Record<string, ChoreAssignment>;
}

const MAX_PRICE = 1000;

/** When each part of the day starts. Market moves on a chore close at that moment. */
const SLOT_START_HOUR: Record<TimeOfDay, number> = { any: 0, morning: 0, afternoon: 12, evening: 17 };

export function marketDeadline(dueDate: DayKey, timeOfDay: TimeOfDay): string {
  return `${dueDate}T${String(SLOT_START_HOUR[timeOfDay]).padStart(2, '0')}:00:00`;
}

export function pushRejectCost(pushCost: number): number {
  return Math.ceil(pushCost / 2);
}

/**
 * The family marketplace: sell a chore, post a buy offer, send a chore to an offer, or push
 * a chore onto someone. Coins for sales and handoffs are held until the chore is done, then
 * paid to whoever did it; if it isn't done they go back. All of that settling happens in
 * `sweep`, which is safe to run any number of times.
 */
export class MarketService {
  constructor(private deps: Deps) {}

  async overview(familyId: string): Promise<MarketOverview> {
    const open = await this.deps.repos.market.withStatus(familyId, ['open']);
    const assignments: Record<string, ChoreAssignment> = {};
    for (const l of open) {
      if (!l.assignmentId || assignments[l.assignmentId]) continue;
      const a = await this.deps.repos.assignments.findById(l.assignmentId);
      if (a) assignments[a.id] = a;
    }
    return { open, assignments };
  }

  /** This person's chores that can still go on the market (not started, not already riding on something). */
  async tradeable(familyId: string, userId: string): Promise<ChoreAssignment[]> {
    const { repos } = this.deps;
    const family = await repos.families.findById(familyId);
    if (!family) return [];
    const now = this.deps.timestamp();
    const periodStart = periodStartFor(this.deps.today(), family.settings.rotationDay);
    const chores = new Map((await repos.chores.findActive(familyId)).map((c) => [c.id, c]));
    const out: ChoreAssignment[] = [];
    for (const a of await repos.assignments.findByPeriod(familyId, periodStart)) {
      const chore = chores.get(a.choreId);
      if (a.userId !== userId || a.status !== 'pending' || !chore) continue;
      if (marketDeadline(a.dueDate, chore.timeOfDay) <= now) continue;
      if (await repos.market.isActiveForAssignment(a.id)) continue;
      out.push(a);
    }
    return out;
  }

  /** How many sales and pushes this person has left this week. */
  async allowance(familyId: string, userId: string): Promise<{ sales: number; pushesToSend: number; pushesToReceive: number }> {
    const family = await this.family(familyId);
    const period = this.period(family);
    const { market } = this.deps.repos;
    const s = family.settings;
    return {
      sales: Math.max(0, s.maxSalesPerWeek - (await market.countInPeriod('sale', 'from_user_id', userId, period))),
      pushesToSend: Math.max(0, s.maxPushesPerWeek - (await market.countInPeriod('push', 'from_user_id', userId, period))),
      pushesToReceive: Math.max(0, s.maxPushesPerWeek - (await market.countInPeriod('push', 'to_user_id', userId, period))),
    };
  }

  /** Runs one action for `actorId`. Throws UserFacingError with a kid-friendly reason when it can't. */
  async perform(familyId: string, actorId: string, op: MarketOp): Promise<void> {
    if (!op || typeof op !== 'object') throw new UserFacingError('Unknown market action.');
    const actor = await this.member(familyId, actorId);
    switch (op.op) {
      case 'sell':
        return this.sell(actor, str(op.assignmentId), int(op.price));
      case 'cancelSale':
        return this.cancelSale(actor, str(op.listingId));
      case 'buy':
        return this.buy(actor, str(op.listingId));
      case 'offer':
        return this.offer(actor, int(op.price));
      case 'withdrawOffer':
        return this.withdrawOffer(actor, str(op.listingId));
      case 'send':
        return this.send(actor, str(op.assignmentId), str(op.offerId));
      case 'answerHandoff':
        return this.answerHandoff(actor, str(op.listingId), op.accept === true);
      case 'cancelHandoff':
        return this.cancelHandoff(actor, str(op.listingId));
      case 'push':
        return this.push(actor, str(op.assignmentId), str(op.targetId));
      case 'answerPush':
        return this.answerPush(actor, str(op.listingId), op.reject === true);
      default:
        throw new UserFacingError('Unknown market action.');
    }
  }

  // ── Selling ──────────────────────────────────────────────────────────────────────────

  private async sell(actor: User, assignmentId: string, price: number): Promise<void> {
    const family = await this.family(actor.familyId);
    if (price < family.settings.minSellPrice || price > MAX_PRICE) {
      throw new UserFacingError(`Pick a price from ${family.settings.minSellPrice} to ${MAX_PRICE} coins.`);
    }
    await this.deps.db.transaction(async () => {
      const { assignment, chore } = await this.ownedChore(actor, assignmentId);
      const left = (await this.allowance(family.id, actor.id)).sales;
      if (left === 0) throw new UserFacingError(`You’ve used all ${family.settings.maxSalesPerWeek} sales this week.`);
      const listing = await this.createListing(family, 'sale', actor.id, null, price, assignment, chore);
      await this.pay(actor, -price, 'market_hold', `Selling: ${chore.name}`, listing.id, assignment.id);
      await this.notifyEveryoneBut(family.id, actor.id, 'sale_posted', listing.id,
        `🏷️ ${actor.name} is selling “${chore.name}” (${when(assignment, chore)}) for ${price} 🪙`);
    });
  }

  private async cancelSale(actor: User, listingId: string): Promise<void> {
    await this.deps.db.transaction(async () => {
      const listing = await this.openListing(listingId, 'sale');
      if (listing.fromUserId !== actor.id) throw new UserFacingError('That isn’t your sale.');
      // Taking a chore off the market costs the same as it not selling: the chore's coins.
      const chore = await this.choreFor(listing);
      await this.closeUnsold(listing, 'cancelled', chore);
    });
  }

  private async buy(actor: User, listingId: string): Promise<void> {
    await this.deps.db.transaction(async () => {
      const listing = await this.openListing(listingId, 'sale');
      if (listing.fromUserId === actor.id) throw new UserFacingError('You can’t buy your own chore.');
      const { assignment, chore } = await this.stillTradeable(listing);
      await this.mustBeFree(actor, assignment);
      await this.deps.repos.assignments.reassign(assignment.id, actor.id);
      await this.deps.repos.market.update(listing.id, 'accepted', { toUserId: actor.id });
      await this.notify(listing.familyId, listing.fromUserId, 'sale_bought', listing.id,
        `⭐✓ ${actor.name} bought your “${chore.name}” (${when(assignment, chore)}). They get your ${listing.price} 🪙 once it’s done.`);
    });
  }

  // ── Buy offers and handoffs ──────────────────────────────────────────────────────────

  private async offer(actor: User, price: number): Promise<void> {
    if (price < 1 || price > MAX_PRICE) throw new UserFacingError(`Pick a price from 1 to ${MAX_PRICE} coins.`);
    const family = await this.family(actor.familyId);
    await this.deps.db.transaction(async () => {
      // One standing offer per person: posting again replaces it.
      for (const old of await this.deps.repos.market.withStatus(family.id, ['open'])) {
        if (old.kind === 'offer' && old.fromUserId === actor.id) {
          await this.deps.repos.market.update(old.id, 'cancelled', { resolvedAt: this.deps.timestamp() });
        }
      }
      const listing: MarketListing = {
        id: uuid(),
        familyId: family.id,
        kind: 'offer',
        status: 'open',
        assignmentId: null,
        fromUserId: actor.id,
        toUserId: null,
        offerId: null,
        price,
        // Offers last until the chore week ends.
        deadline: `${addDays(periodEndFor(this.period(family)), 1)}T00:00:00`,
        periodStart: this.period(family),
        createdAt: this.deps.timestamp(),
        resolvedAt: null,
      };
      await this.deps.repos.market.insert(listing);
      await this.notifyEveryoneBut(family.id, actor.id, 'offer_posted', listing.id,
        `🙋 ${actor.name} will do a chore for ${price} 🪙. Send them one from the marketplace.`);
    });
  }

  private async withdrawOffer(actor: User, listingId: string): Promise<void> {
    const listing = await this.openListing(listingId, 'offer');
    if (listing.fromUserId !== actor.id) throw new UserFacingError('That isn’t your offer.');
    await this.deps.repos.market.update(listing.id, 'cancelled', { resolvedAt: this.deps.timestamp() });
  }

  private async send(actor: User, assignmentId: string, offerId: string): Promise<void> {
    const family = await this.family(actor.familyId);
    await this.deps.db.transaction(async () => {
      const offer = await this.openListing(offerId, 'offer');
      if (offer.fromUserId === actor.id) throw new UserFacingError('That’s your own offer.');
      const helper = await this.member(family.id, offer.fromUserId);
      const { assignment, chore } = await this.ownedChore(actor, assignmentId);
      await this.mustBeFree(helper, assignment);
      const listing = await this.createListing(family, 'handoff', actor.id, helper.id, offer.price, assignment, chore, offer.id);
      await this.pay(actor, -offer.price, 'market_hold', `Sent to ${helper.name}: ${chore.name}`, listing.id, assignment.id);
      await this.notify(family.id, helper.id, 'handoff_request', listing.id,
        `🤝 ${actor.name} wants you to do “${chore.name}” (${when(assignment, chore)}) for ${offer.price} 🪙. Accept or decline in the marketplace.`);
    });
  }

  private async answerHandoff(actor: User, listingId: string, accept: boolean): Promise<void> {
    await this.deps.db.transaction(async () => {
      const listing = await this.openListing(listingId, 'handoff');
      if (listing.toUserId !== actor.id) throw new UserFacingError('That request was for someone else.');
      const { assignment, chore } = await this.stillTradeable(listing);
      if (!accept) {
        await this.refund(listing, listing.price, 'declined');
        await this.notify(listing.familyId, listing.fromUserId, 'handoff_closed', listing.id,
          `🙅 ${actor.name} said no to “${chore.name}”. Your ${listing.price} 🪙 came back.`);
        return;
      }
      await this.mustBeFree(actor, assignment);
      await this.deps.repos.assignments.reassign(assignment.id, actor.id);
      await this.deps.repos.market.update(listing.id, 'accepted');
      await this.notify(listing.familyId, listing.fromUserId, 'handoff_accepted', listing.id,
        `✅ ${actor.name} took “${chore.name}” (${when(assignment, chore)}). They get your ${listing.price} 🪙 once it’s done.`);
    });
  }

  private async cancelHandoff(actor: User, listingId: string): Promise<void> {
    await this.deps.db.transaction(async () => {
      const listing = await this.openListing(listingId, 'handoff');
      if (listing.fromUserId !== actor.id) throw new UserFacingError('That isn’t your request.');
      // A handoff that doesn't happen leaves everyone as they were.
      await this.refund(listing, listing.price, 'cancelled');
    });
  }

  // ── Pushes ───────────────────────────────────────────────────────────────────────────

  private async push(actor: User, assignmentId: string, targetId: string): Promise<void> {
    const family = await this.family(actor.familyId);
    const target = await this.member(family.id, targetId);
    if (target.id === actor.id) throw new UserFacingError('Pick someone else to push it to.');
    await this.deps.db.transaction(async () => {
      const { assignment, chore } = await this.ownedChore(actor, assignmentId);
      if (assignment.dueDate <= this.deps.today()) throw new UserFacingError('Pushes need at least a day’s notice.');
      const limits = await this.allowance(family.id, actor.id);
      const max = family.settings.maxPushesPerWeek;
      if (limits.pushesToSend === 0) throw new UserFacingError(`You’ve used all ${max} pushes this week.`);
      if ((await this.allowance(family.id, target.id)).pushesToReceive === 0) {
        throw new UserFacingError(`${target.name} has already been pushed ${max} times this week.`);
      }
      await this.mustBeFree(target, assignment);
      const cost = family.settings.pushCost;
      const listing = await this.createListing(family, 'push', actor.id, target.id, cost, assignment, chore);
      await this.pay(actor, -cost, 'push_cost', `Pushed to ${target.name}: ${chore.name}`, listing.id, assignment.id);
      await this.deps.repos.assignments.reassign(assignment.id, target.id);
      await this.notify(family.id, target.id, 'push_received', listing.id,
        `📌 ${actor.name} pushed “${chore.name}” (${when(assignment, chore)}) to you. Do it, or pay ${pushRejectCost(cost)} 🪙 to send it back.`);
    });
  }

  private async answerPush(actor: User, listingId: string, reject: boolean): Promise<void> {
    await this.deps.db.transaction(async () => {
      const listing = await this.openListing(listingId, 'push');
      if (listing.toUserId !== actor.id) throw new UserFacingError('That push was for someone else.');
      const assignment = await this.deps.repos.assignments.findById(listing.assignmentId ?? '');
      const chore = await this.choreFor(listing);
      if (!assignment || assignment.status !== 'pending' || assignment.userId !== actor.id || !chore) {
        throw new UserFacingError('That chore can’t be sent back any more.');
      }
      if (this.deps.timestamp() >= marketDeadline(assignment.dueDate, chore.timeOfDay)) {
        throw new UserFacingError('Too late to send it back.');
      }
      if (!reject) {
        await this.deps.repos.market.update(listing.id, 'accepted', { resolvedAt: this.deps.timestamp() });
        return;
      }
      const cost = pushRejectCost(listing.price);
      await this.pay(actor, -cost, 'push_reject', `Sent back: ${chore.name}`, listing.id, assignment.id);
      await this.deps.repos.assignments.reassign(assignment.id, listing.fromUserId);
      await this.deps.repos.market.update(listing.id, 'rejected', { resolvedAt: this.deps.timestamp() });
      await this.notify(listing.familyId, listing.fromUserId, 'push_rejected', listing.id,
        `↩️ ${actor.name} paid ${cost} 🪙 to send “${chore.name}” back to you.`);
    });
  }

  // ── Settling ─────────────────────────────────────────────────────────────────────────

  /**
   * Closes whatever ran out of time and settles held coins. Idempotent; runs whenever the
   * week is checked (app open, every sync) and after each market action.
   */
  async sweep(familyId: string): Promise<void> {
    const { repos } = this.deps;
    const now = this.deps.timestamp();
    for (const l of await repos.market.withStatus(familyId, ['open', 'accepted', 'paid'])) {
      const assignment = l.assignmentId ? await repos.assignments.findById(l.assignmentId) : null;
      const chore = await this.choreFor(l);

      if (l.status === 'open') {
        if (l.kind === 'offer') {
          if (l.deadline && now >= l.deadline) await repos.market.update(l.id, 'expired', { resolvedAt: now });
          continue;
        }
        const late = !!l.deadline && now >= l.deadline;
        const holder = l.kind === 'push' ? l.toUserId : l.fromUserId;
        const moved = !assignment || assignment.status !== 'pending' || assignment.userId !== holder;
        if (!late && !moved) continue;

        if (l.kind === 'push') {
          // Not sent back in time: it's theirs.
          await repos.market.update(l.id, 'accepted', { resolvedAt: now });
        } else if (l.kind === 'handoff') {
          await this.refund(l, l.price, 'expired');
          await this.notify(l.familyId, l.fromUserId, 'handoff_closed', l.id,
            `⌛ “${chore?.name ?? 'Your chore'}” wasn’t picked up in time. Your ${l.price} 🪙 came back.`);
        } else if (!assignment) {
          // The week was re-dealt under it; nobody's fault.
          await this.refund(l, l.price, 'cancelled');
        } else if (moved) {
          // The seller did it (or skipped it) themselves: same cost as taking it down.
          await this.closeUnsold(l, 'cancelled', chore);
        } else {
          await this.closeUnsold(l, 'expired', chore);
        }
        continue;
      }

      // Sales and handoffs that changed hands: the price is held until the chore is settled.
      if (l.status === 'accepted' && (l.kind === 'sale' || l.kind === 'handoff')) {
        if (assignment?.status === 'completed') {
          await this.deps.addCoins(l.familyId, assignment.userId, 'market_payout', l.price, `Did ${await this.nameOf(l.fromUserId)}’s ${chore?.name ?? 'chore'}`, {
            assignmentId: assignment.id,
            refId: l.id,
          });
          await repos.market.update(l.id, 'paid', { resolvedAt: now });
          await this.notify(l.familyId, assignment.userId, 'payout', l.id,
            `🪙 +${l.price} for doing ${await this.nameOf(l.fromUserId)}’s “${chore?.name ?? 'chore'}”.`);
        } else if (!assignment || assignment.status !== 'pending') {
          await this.refund(l, l.price, 'refunded');
          await this.notify(l.familyId, l.fromUserId, 'refund', l.id,
            `↩️ “${chore?.name ?? 'Your chore'}” didn’t get done, so your ${l.price} 🪙 came back.`);
        }
        continue;
      }

      // Paid, then the chore was undone: take the payout back and wait again.
      if (l.status === 'paid' && assignment && assignment.status !== 'completed') {
        for (const t of await repos.coins.findForAssignment(assignment.id)) {
          if (t.type === 'market_payout' && t.refId === l.id) await repos.coins.delete(t.id);
        }
        await repos.market.update(l.id, 'accepted', { resolvedAt: null });
      }
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────────────

  private async family(familyId: string): Promise<Family> {
    const family = await this.deps.repos.families.findById(familyId);
    if (!family) throw new UserFacingError('No family found.');
    return family;
  }

  private period(family: Family): DayKey {
    return periodStartFor(this.deps.today(), family.settings.rotationDay);
  }

  private async member(familyId: string, userId: string): Promise<User> {
    const user = await this.deps.repos.users.findById(userId);
    if (!user || user.familyId !== familyId) throw new UserFacingError('That person isn’t in this family.');
    return user;
  }

  private async nameOf(userId: string): Promise<string> {
    return (await this.deps.repos.users.findById(userId))?.name ?? 'someone';
  }

  private async choreFor(listing: MarketListing): Promise<Chore | null> {
    if (!listing.assignmentId) return null;
    const a = await this.deps.repos.assignments.findById(listing.assignmentId);
    const choreId = a?.choreId ?? listing.assignmentId.split(':')[0];
    return this.deps.repos.chores.findById(choreId);
  }

  /** A chore the actor holds right now that hasn't started and isn't already on the market. */
  private async ownedChore(actor: User, assignmentId: string): Promise<{ assignment: ChoreAssignment; chore: Chore }> {
    const { repos } = this.deps;
    const assignment = await repos.assignments.findById(assignmentId);
    if (!assignment || assignment.familyId !== actor.familyId) throw new UserFacingError('That chore no longer exists.');
    if (assignment.userId !== actor.id) throw new UserFacingError('That chore isn’t yours.');
    if (assignment.status !== 'pending') throw new UserFacingError('That chore is already taken care of.');
    const chore = await repos.chores.findById(assignment.choreId);
    if (!chore) throw new UserFacingError('That chore no longer exists.');
    if (this.deps.timestamp() >= marketDeadline(assignment.dueDate, chore.timeOfDay)) {
      throw new UserFacingError('Too late — that chore’s time has started.');
    }
    if (await repos.market.isActiveForAssignment(assignment.id)) {
      throw new UserFacingError('That chore is already on the market or was pushed.');
    }
    return { assignment, chore };
  }

  /** The chore behind an open sale/handoff is still with its owner, untouched and in time. */
  private async stillTradeable(listing: MarketListing): Promise<{ assignment: ChoreAssignment; chore: Chore }> {
    const assignment = await this.deps.repos.assignments.findById(listing.assignmentId ?? '');
    const chore = await this.choreFor(listing);
    const ok =
      assignment &&
      chore &&
      assignment.status === 'pending' &&
      assignment.userId === listing.fromUserId &&
      this.deps.timestamp() < marketDeadline(assignment.dueDate, chore.timeOfDay);
    if (!ok) throw new UserFacingError('That chore isn’t available any more.');
    return { assignment: assignment!, chore: chore! };
  }

  private async mustBeFree(user: User, assignment: ChoreAssignment): Promise<void> {
    if (await this.deps.repos.assignments.hasChoreOnDay(user.id, assignment.choreId, assignment.dueDate)) {
      throw new UserFacingError(`${user.name} already has that chore that day.`);
    }
  }

  private async openListing(id: string, kind: ListingKind): Promise<MarketListing> {
    const listing = await this.deps.repos.market.findById(id);
    if (!listing || listing.kind !== kind) throw new UserFacingError('That’s no longer on the market.');
    if (listing.status !== 'open') throw new UserFacingError('Too late — someone already dealt with that.');
    if (listing.deadline && this.deps.timestamp() >= listing.deadline) throw new UserFacingError('Too late — that has closed.');
    return listing;
  }

  private async createListing(
    family: Family,
    kind: ListingKind,
    fromUserId: string,
    toUserId: string | null,
    price: number,
    assignment: ChoreAssignment,
    chore: Chore,
    offerId: string | null = null,
  ): Promise<MarketListing> {
    const listing: MarketListing = {
      id: uuid(),
      familyId: family.id,
      kind,
      status: 'open',
      assignmentId: assignment.id,
      fromUserId,
      toUserId,
      offerId,
      price,
      deadline: marketDeadline(assignment.dueDate, chore.timeOfDay),
      periodStart: this.period(family),
      createdAt: this.deps.timestamp(),
      resolvedAt: null,
    };
    await this.deps.repos.market.insert(listing);
    return listing;
  }

  /** Spending checks the balance first; refunds and payouts never fail. */
  private async pay(
    user: User,
    amount: number,
    type: CoinTransactionType,
    reason: string,
    refId: string,
    assignmentId: string | null,
  ): Promise<void> {
    if (amount < 0) {
      const balance = await this.deps.repos.coins.balance(user.id);
      if (balance < -amount) throw new UserFacingError(`That costs ${-amount} 🪙 and ${user.name} has ${balance}.`);
    }
    await this.deps.addCoins(user.familyId, user.id, type, amount, reason, { assignmentId, refId });
  }

  private async refund(listing: MarketListing, amount: number, status: ListingStatus): Promise<void> {
    if (amount > 0) {
      const chore = await this.choreFor(listing);
      await this.deps.addCoins(listing.familyId, listing.fromUserId, 'market_refund', amount, `Refund: ${chore?.name ?? 'chore'}`, {
        refId: listing.id,
      });
    }
    await this.deps.repos.market.update(listing.id, status, { resolvedAt: this.deps.timestamp() });
  }

  /** Unsold (or taken down): the seller keeps the chore and loses its coin value from the price. */
  private async closeUnsold(listing: MarketListing, status: ListingStatus, chore: Chore | null): Promise<void> {
    const kept = Math.min(listing.price, chore?.coins ?? 0);
    const back = listing.price - kept;
    await this.refund(listing, back, status);
    if (status === 'expired') {
      await this.notify(listing.familyId, listing.fromUserId, 'sale_unsold', listing.id,
        `🏷️ Nobody bought “${chore?.name ?? 'your chore'}”. ${back} 🪙 back — trying cost you ${kept} 🪙, and it’s still yours to do.`);
    }
  }

  private async notify(familyId: string, userId: string, kind: NotificationKind, refId: string, text: string): Promise<void> {
    const n: AppNotification = { id: uuid(), familyId, userId, kind, text, refId, createdAt: this.deps.timestamp() };
    await this.deps.repos.notifications.insert(n);
  }

  private async notifyEveryoneBut(familyId: string, exceptId: string, kind: NotificationKind, refId: string, text: string): Promise<void> {
    for (const u of await this.deps.repos.users.findByFamily(familyId)) {
      if (u.id !== exceptId) await this.notify(familyId, u.id, kind, refId, text);
    }
  }
}

function when(a: ChoreAssignment, chore: Chore): string {
  const part = chore.timeOfDay === 'any' ? '' : ` ${chore.timeOfDay}`;
  return `${formatDay(a.dueDate)}${part}`;
}

function str(v: unknown): string {
  if (typeof v !== 'string' || !v) throw new UserFacingError('Something was missing from that request.');
  return v;
}

function int(v: unknown): number {
  if (typeof v !== 'number' || !Number.isInteger(v)) throw new UserFacingError('Enter a whole number of coins.');
  return v;
}
