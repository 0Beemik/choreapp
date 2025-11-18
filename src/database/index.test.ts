import { initializeDatabase } from './index';
import * as SQLite from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(),
  openDatabaseAsync: jest.fn(async () => ({
    transaction: jest.fn(async (callback) => {
      const tx = {
        executeSql: jest.fn(),
      };
      await callback(tx);
    }),
    getAllAsync: jest.fn(async () => []),
    execAsync: jest.fn(async () => []),
  })),
}));

describe('Database Initialization', () => {
  it('should initialize the database and run migrations without throwing an error', async () => {
    await expect(initializeDatabase()).resolves.not.toThrow();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('family-chores.db');
  });
});