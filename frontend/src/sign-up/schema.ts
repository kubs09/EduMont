import { z } from 'zod';
import { texts } from '../texts';

export const createSignupSchema = (language: 'cs' | 'en') =>
  z
    .object({
      firstName: z.string().min(2, texts.signUp.validation.firstNameMinLength[language]),
      lastName: z.string().min(2, texts.signUp.validation.lastNameMinLength[language]),
      password: z.string().min(8, texts.signUp.validation.passwordLength[language]),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: texts.signUp.validation.passwordsMatch[language],
      path: ['confirmPassword'],
    });

export type SignupSchema = z.infer<ReturnType<typeof createSignupSchema>>;
