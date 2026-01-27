import { z } from 'zod';
import { texts } from '@frontend/texts';

export const createLoginSchema = (language: 'en' | 'cs') => {
  return z.object({
    email: z
      .string()
      .min(1, { message: texts.auth.signIn.validation.emailRequired[language] })
      .email({ message: texts.auth.signIn.validation.invalidEmail[language] }),
    password: z
      .string()
      .min(1, { message: texts.auth.signIn.validation.passwordRequired[language] }),
  });
};

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
