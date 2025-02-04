import { z } from 'zod';
import { texts } from '../../texts';

export const createPasswordChangeSchema = (language: 'cs' | 'en') =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, texts.profile.validation.currentPasswordRequired[language]),
      newPassword: z.string().min(8, texts.profile.validation.newPasswordLength[language]),
      confirmPassword: z
        .string()
        .min(1, texts.profile.validation.confirmPasswordRequired[language]),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: texts.profile.validation.passwordsDoNotMatch[language],
      path: ['confirmPassword'],
    });

export type PasswordChangeSchema = z.infer<ReturnType<typeof createPasswordChangeSchema>>;
