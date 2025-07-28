import { MigrationManager } from './MigrationManager';
import { SQLiteConnection } from '../connection';

jest.mock('../connection', () => ({
  SQLiteConnection: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    execAsync: jest.fn(),
    transaction: jest.fn(async (callback) => await callback()),
  })),
}));

describe('MigrationManager', () => {
  it('should apply all migrations', async () => {
    const connection = new SQLiteConnection();
    const migrations = [
      { version: 1, up: jest.fn().mockResolvedValue(undefined), down: jest.fn() },
      { version: 2, up: jest.fn().mockResolvedValue(undefined), down: jest.fn() },
      { version: 3, up: jest.fn().mockResolvedValue(undefined), down: jest.fn() },
      { version: 4, up: jest.fn().mockResolvedValue(undefined), down: jest.fn() },
    ];
    const manager = new MigrationManager(connection, migrations);

    (connection.query as jest.Mock).mockResolvedValue([{ version: 0 }]);

    await manager.migrate();

    expect(connection.query).toHaveBeenCalledWith('SELECT MAX(version) as version FROM schema_version;');
    expect(migrations[0].up).toHaveBeenCalled();
    expect(migrations[1].up).toHaveBeenCalled();
    expect(migrations[2].up).toHaveBeenCalled();
    expect(migrations[3].up).toHaveBeenCalled();
  });
});