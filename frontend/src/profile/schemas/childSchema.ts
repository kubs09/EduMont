import { z } from 'zod';
import { texts } from '../../texts';

export type ChildFormData = {
  firstname: string;
  surname: string;
  date_of_birth: string;
  contact: string;
  notes?: string;
};

export const createChildSchema = (language: 'cs' | 'en') => {
  return z.object({
    firstname: z
      .string()
      .min(2, texts.profile.children.validation.firstNameLength[language])
      .max(100, texts.profile.children.validation.firstNameMaxLength[language]),
    surname: z
      .string()
      .min(2, texts.profile.children.validation.surnameLength[language])
      .max(100, texts.profile.children.validation.surnameMaxLength[language]),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, texts.profile.children.validation.dateFormat[language])
      .refine(
        (date) => {
          const birthDate = new Date(date);
          const now = new Date();
          const age = now.getFullYear() - birthDate.getFullYear();
          return age >= 0 && age <= 18;
        },
        { message: texts.profile.children.validation.ageRange[language] }
      ),
    contact: z
      .string()
      .min(5, texts.profile.children.validation.contactRequired[language])
      .max(50, texts.profile.children.validation.contactMaxLength[language]),
    notes: z
      .string()
      .max(1000, texts.profile.children.validation.notesMaxLength[language])
      .optional(),
  });
};
