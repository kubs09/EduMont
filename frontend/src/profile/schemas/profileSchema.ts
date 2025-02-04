import { z } from 'zod';
import { texts } from '../../texts';

export const createProfileSchema = (language: 'cs' | 'en') =>
  z.object({
    firstname: z
      .string()
      .min(1, texts.profile.validation.firstNameRequired[language])
      .min(2, texts.profile.validation.firstNameLength[language]),
    surname: z
      .string()
      .min(1, texts.profile.validation.lastNameRequired[language])
      .min(2, texts.profile.validation.lastNameLength[language]),
    email: z
      .string()
      .min(1, texts.profile.validation.emailRequired[language])
      .email(texts.profile.validation.emailInvalid[language]),
  });

export type ProfileSchema = z.infer<ReturnType<typeof createProfileSchema>>;
