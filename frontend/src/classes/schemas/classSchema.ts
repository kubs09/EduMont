import { z } from 'zod';
import { classAgeRanges } from '../utils/ageRanges';

export const classTeachersSchema = z
  .object({
    teacherId: z.number({ required_error: 'Teacher is required' }),
    assistantId: z.number().nullable().optional(),
  })
  .refine((data) => data.assistantId === null || data.assistantId !== data.teacherId, {
    message: 'Assistant cannot be the same as the main teacher',
    path: ['assistantId'],
  });

const isAllowedAgeRange = (minAge: number, maxAge: number) =>
  classAgeRanges.some((range) => range.minAge === minAge && range.maxAge === maxAge);

export const classSchema = z
  .object({
    name: z.string().min(2, 'Class name must be at least 2 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    minAge: z
      .number({
        required_error: 'Minimum age is required',
      })
      .min(3, 'Minimum age must be at least 3')
      .max(9, 'Minimum age cannot exceed 9'),
    maxAge: z
      .number({
        required_error: 'Maximum age is required',
      })
      .min(6, 'Maximum age must be at least 6')
      .max(12, 'Maximum age cannot exceed 12'),
  })
  .refine((data) => data.maxAge >= data.minAge, {
    message: 'Maximum age must be greater than or equal to minimum age',
    path: ['maxAge'],
  })
  .refine((data) => isAllowedAgeRange(data.minAge, data.maxAge), {
    message: 'Age range must match one of the predefined class groups',
    path: ['minAge'],
  });

export const classManagementSchema = z.object({});
