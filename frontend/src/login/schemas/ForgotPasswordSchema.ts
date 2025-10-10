import { z } from 'zod';
import { texts } from '@frontend/texts';

export const createForgotPasswordSchema = (language: 'en' | 'cs') =>
  z.object({
    email: z
      .string()
      .min(1, texts.profile.validation.emailRequired[language])
      .email(texts.profile.validation.emailInvalid[language]),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
