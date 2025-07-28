import * as crypto from 'expo-crypto';
import { dbConnection } from '../database/connection';
import { SQLiteTransaction } from 'expo-sqlite';

// Custom Error for the Repository Layer
export class RepositoryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export interface IBaseRepository<T extends { id: string }> {
  create(entity: Omit<T, 'id'>, tx?: SQLiteTransaction): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, updates: Partial<Omit<T, 'id'>>, tx?: SQLiteTransaction): Promise<T>;
  delete(id: string, tx?: SQLiteTransaction): Promise<void>;
}

export abstract class BaseRepository<T extends { id: string }> implements IBaseRepository<T> {
  protected abstract tableName: string;

  protected abstract mapToModel(row: unknown): T;

  async create(entity: Omit<T, 'id'>, tx?: SQLiteTransaction): Promise<T> {
    try {
      const id = this.generateId();
      const newEntity = { id, ...entity };

      const columns = Object.keys(newEntity).join(', ');
      const placeholders = Object.keys(newEntity).map(() => '?').join(', ');
      const values = Object.values(newEntity);

      const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders});`;

      if (tx) {
        await dbConnection.queryInTransaction(tx, sql, values);
      } else {
        await dbConnection.query(sql, values);
      }
      return newEntity as T;
    } catch (error) {
      throw new RepositoryError(`Failed to create entity in ${this.tableName}`, error as Error);
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?;`;
      const result = await dbConnection.query<T>(sql, [id]);

      if (result.length === 0) {
        return null;
      }
      return this.mapToModel(result[0]);
    } catch (error) {
      throw new RepositoryError(`Failed to find entity by id ${id} in ${this.tableName}`, error as Error);
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName};`;
      const results = await dbConnection.query<T>(sql);
      return results.map(row => this.mapToModel(row));
    } catch (error) {
      throw new RepositoryError(`Failed to find all entities in ${this.tableName}`, error as Error);
    }
  }

  async update(id: string, updates: Partial<Omit<T, 'id'>>, tx?: SQLiteTransaction): Promise<T> {
    if (Object.keys(updates).length === 0) {
      const currentEntity = await this.findById(id);
      if (!currentEntity) {
        throw new RepositoryError(`Entity with id ${id} not found in ${this.tableName}.`);
      }
      return currentEntity;
    }
    
    try {
      const columns = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), id];

      const sql = `UPDATE ${this.tableName} SET ${columns} WHERE id = ?;`;

      if (tx) {
        await dbConnection.queryInTransaction(tx, sql, values);
      } else {
        await dbConnection.query(sql, values);
      }

      const updatedEntity = await this.findById(id);
      if (!updatedEntity) {
        throw new Error('Failed to find the entity after update.');
      }
      return updatedEntity;
    } catch (error) {
      throw new RepositoryError(`Failed to update entity with id ${id} in ${this.tableName}`, error as Error);
    }
  }

  async delete(id: string, tx?: SQLiteTransaction): Promise<void> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?;`;
      if (tx) {
        await dbConnection.queryInTransaction(tx, sql, [id]);
      } else {
        await dbConnection.query(sql, [id]);
      }
    } catch (error) {
      throw new RepositoryError(`Failed to delete entity with id ${id} in ${this.tableName}`, error as Error);
    }
  }

  protected generateId(): string {
    return crypto.randomUUID();
  }
}
