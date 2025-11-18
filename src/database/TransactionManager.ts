import { dbConnection } from './connection';
import { SQLiteTransaction } from 'expo-sqlite';

export class TransactionManager {
  async runInTransaction<T>(
    callback: (tx: SQLiteTransaction) => Promise<T>
  ): Promise<T> {
    return dbConnection.transaction(callback);
  }
}
