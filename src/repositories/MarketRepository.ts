import type { Db } from '../database';
import type { DayKey } from '../lib/dates';
import type { ListingKind, ListingStatus, MarketListing } from '../models';

interface ListingRow {
  id: string;
  family_id: string;
  kind: string;
  status: string;
  assignment_id: string | null;
  from_user_id: string;
  to_user_id: string | null;
  offer_id: string | null;
  price: number;
  deadline: string | null;
  period_start: string;
  created_at: string;
  resolved_at: string | null;
}

const toModel = (r: ListingRow): MarketListing => ({
  id: r.id,
  familyId: r.family_id,
  kind: r.kind as ListingKind,
  status: r.status as ListingStatus,
  assignmentId: r.assignment_id,
  fromUserId: r.from_user_id,
  toUserId: r.to_user_id,
  offerId: r.offer_id,
  price: r.price,
  deadline: r.deadline,
  periodStart: r.period_start,
  createdAt: r.created_at,
  resolvedAt: r.resolved_at,
});

export class MarketRepository {
  constructor(private db: Db) {}

  async insert(l: MarketListing): Promise<void> {
    await this.db.run(
      `INSERT INTO market_listings (id, family_id, kind, status, assignment_id, from_user_id, to_user_id, offer_id,
         price, deadline, period_start, created_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, l.familyId, l.kind, l.status, l.assignmentId, l.fromUserId, l.toUserId, l.offerId, l.price, l.deadline,
        l.periodStart, l.createdAt, l.resolvedAt],
    );
  }

  async findById(id: string): Promise<MarketListing | null> {
    const row = await this.db.get<ListingRow>('SELECT * FROM market_listings WHERE id = ?', [id]);
    return row ? toModel(row) : null;
  }

  async update(id: string, status: ListingStatus, fields: { toUserId?: string | null; resolvedAt?: string | null } = {}): Promise<void> {
    const sets = ['status = ?'];
    const params: (string | null)[] = [status];
    if (fields.toUserId !== undefined) {
      sets.push('to_user_id = ?');
      params.push(fields.toUserId);
    }
    if (fields.resolvedAt !== undefined) {
      sets.push('resolved_at = ?');
      params.push(fields.resolvedAt);
    }
    await this.db.run(`UPDATE market_listings SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }

  async withStatus(familyId: string, statuses: ListingStatus[]): Promise<MarketListing[]> {
    const rows = await this.db.all<ListingRow>(
      `SELECT * FROM market_listings WHERE family_id = ? AND status IN (${statuses.map(() => '?').join(', ')})
       ORDER BY created_at, rowid`,
      [familyId, ...statuses],
    );
    return rows.map(toModel);
  }

  /** Something is already riding on this chore (for sale, sent, pushed, or sold and not settled). */
  async isActiveForAssignment(assignmentId: string): Promise<boolean> {
    const row = await this.db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM market_listings WHERE assignment_id = ? AND status IN ('open', 'accepted', 'paid')`,
      [assignmentId],
    );
    return (row?.n ?? 0) > 0;
  }

  async countInPeriod(kind: ListingKind, field: 'from_user_id' | 'to_user_id', userId: string, periodStart: DayKey): Promise<number> {
    const row = await this.db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM market_listings WHERE kind = ? AND ${field} = ? AND period_start = ?`,
      [kind, userId, periodStart],
    );
    return row?.n ?? 0;
  }
}
