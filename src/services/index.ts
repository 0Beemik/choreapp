import { migrate, type Db } from '../database';
import { BadgeService } from './BadgeService';
import { ChoreService } from './ChoreService';
import { Deps } from './deps';
import { FamilyService } from './FamilyService';
import { BoardService, PointsService, VacationService } from './PointsService';
import { RotationService } from './RotationService';

export { UserFacingError } from './deps';
export type { ChoreInput, CompletionResult, BuyoutQuote } from './ChoreService';
export type { SetupInput, MemberInput } from './FamilyService';
export type { Board, LeaderboardRange, AllowanceSummary } from './PointsService';

export interface Services {
  deps: Deps;
  family: FamilyService;
  chores: ChoreService;
  rotation: RotationService;
  badges: BadgeService;
  points: PointsService;
  board: BoardService;
  vacations: VacationService;
}

export async function createServices(db: Db, clock?: () => Date): Promise<Services> {
  await migrate(db);
  const deps = new Deps(db, clock);
  const badges = new BadgeService(deps);
  const rotation = new RotationService(deps, badges);
  const chores = new ChoreService(deps, rotation, badges);
  return {
    deps,
    badges,
    rotation,
    chores,
    family: new FamilyService(deps, rotation, chores),
    points: new PointsService(deps),
    board: new BoardService(deps),
    vacations: new VacationService(deps),
  };
}
