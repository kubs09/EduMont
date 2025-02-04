import { z } from 'zod';
import { texts } from '../texts';

export const createSignupSchema = (language: 'cs' | 'en') =>
  z
    .object({
      firstName: z.string().min(2, texts.auth.signUp.validation.firstNameRequired[language]),
      lastName: z.string().min(2, texts.auth.signUp.validation.lastNameRequired[language]),
      password: z.string().min(8, texts.auth.signUp.validation.passwordLength[language]),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: texts.auth.signUp.validation.passwordsMatch[language],
      path: ['confirmPassword'],
    });

export type SignupSchema = z.infer<ReturnType<typeof createSignupSchema>>;
