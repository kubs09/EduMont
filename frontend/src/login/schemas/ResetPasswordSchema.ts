import { z } from 'zod';
import { texts } from '../../texts';

export const createResetPasswordSchema = (language: 'en' | 'cs') =>
  z
    .object({
      password: z
        .string()
        .min(8, texts.profile.validation.newPasswordLength[language])
        .regex(/[A-Z]/, texts.profile.validation.passwordUppercase[language])
        .regex(/[0-9]/, texts.profile.validation.passwordNumber[language]),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: texts.profile.validation.passwordMatch[language],
      path: ['confirmPassword'],
    });

export type ResetPasswordSchema = z.infer<ReturnType<typeof createResetPasswordSchema>>;
