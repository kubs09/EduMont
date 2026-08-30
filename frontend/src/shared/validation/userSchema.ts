import { z } from 'zod';
import { texts } from '@frontend/texts';

export const createUserSchema = (language: 'en' | 'cs') =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: texts.userDashboard.validation.emailRequired[language] })
      .email({ message: texts.userDashboard.validation.invalidEmail[language] }),
    role: z.enum(['admin', 'teacher', 'parent'], {
      error: () => texts.userDashboard.validation.roleRequired[language],
    }),
  });

export type UserFormData = z.infer<ReturnType<typeof createUserSchema>>;
