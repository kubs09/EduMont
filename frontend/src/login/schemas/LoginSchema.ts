import { z } from 'zod';
import { texts } from '../../texts';

export const createLoginSchema = (language: 'en' | 'cs') => {
  return z.object({
    email: z
      .string()
      .min(1, { message: texts.auth.signIn.emailRequired[language] })
      .email({ message: texts.auth.signIn.invalidEmail[language] }),
    password: z.string().min(1, { message: texts.auth.signIn.passwordRequired[language] }),
  });
};

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
