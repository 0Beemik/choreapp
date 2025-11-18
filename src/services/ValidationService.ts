// src/services/ValidationService.ts

import { z, ZodError } from 'zod';
import { ValidationResult } from '../types';

export interface IValidationService {
  validate<T>(schema: z.ZodSchema<T>, data: T): ValidationResult;
}

export class ValidationService implements IValidationService {
  validate<T>(schema: z.ZodSchema<T>, data: T): ValidationResult {
    try {
      schema.parse(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return { isValid: false, errors };
      }
      // Handle unexpected errors
      return {
        isValid: false,
        errors: [{ field: 'unknown', message: 'An unexpected validation error occurred.' }],
      };
    }
  }
}

export const validationService = new ValidationService();
