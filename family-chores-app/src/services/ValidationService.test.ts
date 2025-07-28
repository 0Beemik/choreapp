import { ValidationService } from './ValidationService';
import { z } from 'zod';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z.number().min(0, 'Age must be a positive number'),
  });

  describe('validate', () => {
    it('should return valid for correct data', () => {
      const data = { name: 'Test', age: 10 };
      const result = validationService.validate(testSchema, data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid for incorrect data', () => {
      const data = { name: '', age: -1 };
      const result = validationService.validate(testSchema, data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([
        { field: 'name', message: 'Name is required' },
        { field: 'age', message: 'Age must be a positive number' },
      ]);
    });

    it('should handle unexpected errors', () => {
      const schemaWithCustomError = z.object({
        name: z.string().refine(() => {
          throw new Error('Unexpected error');
        }),
      });
      const data = { name: 'test' };
      const result = validationService.validate(schemaWithCustomError, data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([
        { field: 'unknown', message: 'An unexpected validation error occurred.' },
      ]);
    });
  });
});
