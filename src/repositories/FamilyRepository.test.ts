import { FamilyRepository } from './FamilyRepository';

describe('FamilyRepository', () => {
  let repository: FamilyRepository;

  beforeEach(() => {
    repository = new FamilyRepository();
  });

  it('should map a row to a model', () => {
    const row = {
      id: '1',
      name: 'Test Family',
      created_at: '2025-07-26T10:00:00.000Z',
      settings_points_per_chore: 10,
      settings_buyout_cost_percentage: 50,
      settings_max_buyouts_per_month: 2,
      settings_rotation_day: 'Monday',
      admin_pin: '1234',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      name: 'Test Family',
      createdAt: new Date('2025-07-26T10:00:00.000Z'),
      settings: {
        pointsPerChore: 10,
        buyoutCostPercentage: 50,
        maxBuyoutsPerMonth: 2,
        rotationDay: 'Monday',
        adminPin: '1234',
      },
    });
  });
});
