// Service singleton instances
import { AdminAuthService } from './AdminAuthService';
import { AdminOverrideService } from './AdminOverrideService';
import { ChoreService } from './ChoreService';
import { FamilyService } from './FamilyService';
import { UserService } from './UserService';
import { PointsService } from './PointsService';
import { BuyoutService } from './BuyoutService';
import { AchievementService } from './AchievementService';
import { BadgeService } from './BadgeService';
import { LeaderboardService } from './LeaderboardService';
import { ValidationService } from './ValidationService';

// Repository imports
import { FamilyRepository } from '../repositories/FamilyRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ChoreRepository } from '../repositories/ChoreRepository';
import { AssignmentRepository } from '../repositories/AssignmentRepository';
import { PointsRepository } from '../repositories/PointsRepository';
import { AchievementRepository } from '../repositories/AchievementRepository';
import { BadgeRepository } from '../repositories/BadgeRepository';
import { UserBadgeRepository } from '../repositories/UserBadgeRepository';
import { LeaderboardRepository } from '../repositories/LeaderboardRepository';
import { AdminSessionRepository } from '../repositories/AdminSessionRepository';
import { VacationSettingsRepository } from '../repositories/VacationSettingsRepository';

// Transaction Manager
import { TransactionManager } from '../database/TransactionManager';

// Repository instances
const familyRepository = new FamilyRepository();
const userRepository = new UserRepository();
const choreRepository = new ChoreRepository();
const assignmentRepository = new AssignmentRepository();
const pointsRepository = new PointsRepository();
const achievementRepository = new AchievementRepository();
const badgeRepository = new BadgeRepository();
const userBadgeRepository = new UserBadgeRepository();
const leaderboardRepository = new LeaderboardRepository();
const adminSessionRepository = new AdminSessionRepository();
const vacationSettingsRepository = new VacationSettingsRepository();
const transactionManager = new TransactionManager();

// Service instances with dependency injection
export const validationService = new ValidationService();
export const pointsService = new PointsService(pointsRepository);
export const choreService = new ChoreService(
  choreRepository,
  assignmentRepository,
  pointsService,
  vacationSettingsRepository
);
export const familyService = new FamilyService(
  familyRepository,
  userRepository,
  validationService
);
export const userService = new UserService(userRepository);
export const adminAuthService = new AdminAuthService(
  familyRepository,
  adminSessionRepository
);
export const badgeService = new BadgeService(
  badgeRepository,
  userBadgeRepository,
  assignmentRepository,
  pointsRepository
);
export const adminOverrideService = new AdminOverrideService(
  pointsService,
  assignmentRepository,
  vacationSettingsRepository
);
export const buyoutService = new BuyoutService(
  pointsService,
  assignmentRepository,
  userRepository,
  familyRepository,
  transactionManager
);
export const achievementService = new AchievementService(
  achievementRepository,
  badgeRepository,
  assignmentRepository,
  pointsRepository,
  badgeService
);
export const leaderboardService = new LeaderboardService(leaderboardRepository);

// Export service classes for testing
export {
  AdminAuthService,
  AdminOverrideService,
  ChoreService,
  FamilyService,
  UserService,
  PointsService,
  BuyoutService,
  AchievementService,
  BadgeService,
  LeaderboardService,
  ValidationService,
};
