import { z } from 'zod';

export const classTeachersSchema = z.array(z.number()).min(1, {
  message: 'At least one teacher must be selected',
});

export const classSchema = z
  .object({
    name: z.string().min(2, 'Class name must be at least 2 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    minAge: z
      .number({
        required_error: 'Minimum age is required',
      })
      .min(0, 'Minimum age cannot be negative')
      .max(18, 'Maximum age is 18'),
    maxAge: z
      .number({
        required_error: 'Maximum age is required',
      })
      .min(0, 'Minimum age cannot be negative')
      .max(18, 'Maximum age is 18'),
  })
  .refine((data) => data.maxAge >= data.minAge, {
    message: 'Maximum age must be greater than or equal to minimum age',
    path: ['maxAge'],
  });

// Remove teachers from management schema since it's handled separately
export const classManagementSchema = z.object({});
