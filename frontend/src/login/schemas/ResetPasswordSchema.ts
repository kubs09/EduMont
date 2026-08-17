import { z } from 'zod';
import { texts } from '@frontend/texts';

export const createResetPasswordSchema = (language: 'en' | 'cs') =>
  z
    .object({
      password: z
        .string()
        .min(8, texts.login.validation.newPasswordLength[language])
        .regex(/[A-Z]/, texts.login.validation.passwordUppercase[language])
        .regex(/[0-9]/, texts.login.validation.passwordNumber[language]),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: texts.login.validation.passwordMatch[language],
      path: ['confirmPassword'],
    });

export type ResetPasswordSchema = z.infer<ReturnType<typeof createResetPasswordSchema>>;
