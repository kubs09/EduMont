import { z } from 'zod';
import texts from '@frontend/texts';

export const presentationSchema = (language: 'en' | 'cs') =>
  z.object({
    category: z
      .string({
        invalid_type_error: texts.presentation.validation.presentationCategoryValid[language],
      })
      .min(1, { message: texts.presentation.validation.presentationCategoryRequired[language] }),

    name: z
      .string()
      .min(1, { message: texts.presentation.validation.presentationNameRequired[language] })
      .min(2, { message: texts.presentation.validation.presentationNameMin[language] })
      .max(100, { message: texts.presentation.validation.presentationNameMax[language] }),

    age_group: z
      .string({
        invalid_type_error: texts.presentation.validation.presentationAgeGroupValid[language],
      })
      .min(1, { message: texts.presentation.validation.presentationAgeGroupRequired[language] }),

    display_order: z
      .number({
        invalid_type_error: texts.presentation.validation.presentationOrderValid[language],
      })
      .int({ message: texts.presentation.validation.presentationOrderValid[language] })
      .positive({ message: texts.presentation.validation.presentationOrderValid[language] }),

    notes: z
      .string()
      .max(500, { message: texts.presentation.validation.presentationNotesMax[language] })
      .optional(),
  });

export const createPresentationSchema = (language: 'en' | 'cs') => presentationSchema(language);

export const updatePresentationSchema = (language: 'en' | 'cs') =>
  presentationSchema(language).partial();
