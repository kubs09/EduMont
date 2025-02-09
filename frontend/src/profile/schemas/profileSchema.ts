import { z } from 'zod';
import { texts } from '../../texts';

export type ProfileSchema = {
  firstname: string;
  surname: string;
  email: string;
  phone?: string;
};

export const createProfileSchema = (language: 'cs' | 'en') => {
  return z.object({
    firstname: z
      .string()
      .min(2, texts.profile.validation.firstNameLength[language])
      .nonempty(texts.profile.validation.firstNameRequired[language]),
    surname: z
      .string()
      .min(2, texts.profile.validation.lastNameLength[language])
      .nonempty(texts.profile.validation.lastNameRequired[language]),
    email: z
      .string()
      .nonempty(texts.profile.validation.emailRequired[language])
      .email(texts.profile.validation.emailInvalid[language]),
    phone: z
      .string()
      .regex(
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        texts.profile.validation.invalidPhone[language]
      )
      .optional()
      .or(z.literal('')),
  });
};
