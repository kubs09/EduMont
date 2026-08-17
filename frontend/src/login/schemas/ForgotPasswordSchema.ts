import { z } from 'zod';
import { texts } from '@frontend/texts';

export const createForgotPasswordSchema = (language: 'en' | 'cs') =>
  z.object({
    email: z
      .string()
      .min(1, texts.login.validation.emailRequired[language])
      .email(texts.login.validation.invalidEmail[language]),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
