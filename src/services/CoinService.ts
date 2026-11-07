import type { CoinTransaction } from '../models';
import { UserFacingError, type Deps } from './deps';

/** Coins are the family currency. All spending will go through here (marketplace, later the shop). */
export class CoinService {
  constructor(private deps: Deps) {}

  balances(familyId: string): Promise<Record<string, number>> {
    return this.deps.repos.coins.balances(familyId);
  }

  balance(userId: string): Promise<number> {
    return this.deps.repos.coins.balance(userId);
  }

  history(userId: string): Promise<CoinTransaction[]> {
    return this.deps.repos.coins.history(userId);
  }

  /** Parent gives or takes coins by hand. */
  async adjust(familyId: string, userId: string, amount: number, reason: string): Promise<void> {
    if (!Number.isInteger(amount) || amount === 0) throw new UserFacingError('Enter a whole number of coins.');
    const text = reason.trim() || (amount > 0 ? 'Bonus from parent' : 'Adjustment by parent');
    await this.deps.addCoins(familyId, userId, amount > 0 ? 'bonus' : 'adjustment', amount, text);
  }
}
