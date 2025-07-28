import { BaseRepository } from './BaseRepository';
import { dbConnection } from '../database/connection';

// Mock the dbConnection
jest.mock('../database/connection', () => ({
  dbConnection: {
    query: jest.fn(),
  },
}));

interface TestEntity {
  id: string;
  name: string;
}

class TestRepository extends BaseRepository<TestEntity> {
  protected tableName = 'test_table';

  protected mapToModel(row: any): TestEntity {
    return {
      id: row.id,
      name: row.name,
    };
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
    (dbConnection.query as jest.Mock).mockClear();
  });

  it('should create an entity', async () => {
    const entity = { name: 'Test' };
    const result = await repository.create(entity);
    expect(result.name).toBe('Test');
    expect(dbConnection.query).toHaveBeenCalledWith(
      'INSERT INTO test_table (id, name) VALUES (?, ?);',
      [result.id, 'Test']
    );
  });

  it('should find an entity by id', async () => {
    const entity = { id: '1', name: 'Test' };
    (dbConnection.query as jest.Mock).mockResolvedValue([entity]);
    const result = await repository.findById('1');
    expect(result).toEqual(entity);
    expect(dbConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM test_table WHERE id = ?;',
      ['1']
    );
  });

  it('should return null if entity not found', async () => {
    (dbConnection.query as jest.Mock).mockResolvedValue([]);
    const result = await repository.findById('1');
    expect(result).toBeNull();
  });

  it('should find all entities', async () => {
    const entities = [
      { id: '1', name: 'Test 1' },
      { id: '2', name: 'Test 2' },
    ];
    (dbConnection.query as jest.Mock).mockResolvedValue(entities);
    const result = await repository.findAll();
    expect(result).toEqual(entities);
    expect(dbConnection.query).toHaveBeenCalledWith('SELECT * FROM test_table;');
  });

  it('should update an entity', async () => {
    const entity = { id: '1', name: 'Updated Test' };
    (dbConnection.query as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce([entity]);
    const result = await repository.update('1', { name: 'Updated Test' });
    expect(result).toEqual(entity);
    expect(dbConnection.query).toHaveBeenCalledWith(
      'UPDATE test_table SET name = ? WHERE id = ?;',
      ['Updated Test', '1']
    );
  });

  it('should throw an error if entity not found after update', async () => {
    (dbConnection.query as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce([]);
    await expect(repository.update('1', { name: 'Updated Test' })).rejects.toThrow(
      'Failed to find the entity after update.'
    );
  });

  it('should delete an entity', async () => {
    await repository.delete('1');
    expect(dbConnection.query).toHaveBeenCalledWith(
      'DELETE FROM test_table WHERE id = ?;',
      ['1']
    );
  });
});
