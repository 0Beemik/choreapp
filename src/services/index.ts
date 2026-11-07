import { migrate, type Db } from '../database';
import { BadgeService } from './BadgeService';
import { ChoreService } from './ChoreService';
import { CoinService } from './CoinService';
import { Deps } from './deps';
import { FamilyService } from './FamilyService';
import { MarketService } from './MarketService';
import { NotificationService } from './NotificationService';
import { BoardService, PointsService, VacationService } from './PointsService';
import { RotationService } from './RotationService';

export { UserFacingError } from './deps';
export type { ChoreInput, CompletionResult, BuyoutQuote } from './ChoreService';
export type { SetupInput, MemberInput } from './FamilyService';
export type { Board, LeaderboardRange, AllowanceSummary } from './PointsService';
export type { MarketOp, MarketOverview } from './MarketService';

export interface Services {
  deps: Deps;
  family: FamilyService;
  chores: ChoreService;
  rotation: RotationService;
  badges: BadgeService;
  points: PointsService;
  coins: CoinService;
  market: MarketService;
  notifications: NotificationService;
  board: BoardService;
  vacations: VacationService;
}

export async function createServices(db: Db, clock?: () => Date): Promise<Services> {
  await migrate(db);
  const deps = new Deps(db, clock);
  const badges = new BadgeService(deps);
  const market = new MarketService(deps);
  const rotation = new RotationService(deps, badges, market);
  const chores = new ChoreService(deps, rotation, badges);
  return {
    deps,
    badges,
    rotation,
    chores,
    family: new FamilyService(deps, rotation, chores),
    points: new PointsService(deps),
    coins: new CoinService(deps),
    market,
    notifications: new NotificationService(deps),
    board: new BoardService(deps),
    vacations: new VacationService(deps),
  };
}
