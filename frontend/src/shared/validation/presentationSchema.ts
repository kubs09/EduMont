import { z } from 'zod';
import texts from '@frontend/texts';

export const presentationSchema = (language: 'en' | 'cs') =>
  z.object({
    category: z
      .string({
        invalid_type_error: texts.schedule.validation.presentationCategoryValid[language],
      })
      .min(1, { message: texts.schedule.validation.presentationCategoryRequired[language] }),

    name: z
      .string()
      .min(1, { message: texts.schedule.validation.presentationNameRequired[language] })
      .min(2, { message: texts.schedule.validation.presentationNameMin[language] })
      .max(100, { message: texts.schedule.validation.presentationNameMax[language] }),

    age_group: z
      .string({
        invalid_type_error: texts.schedule.validation.presentationAgeGroupValid[language],
      })
      .min(1, { message: texts.schedule.validation.presentationAgeGroupRequired[language] }),

    display_order: z
      .number({
        invalid_type_error: texts.schedule.validation.presentationOrderValid[language],
      })
      .int({ message: texts.schedule.validation.presentationOrderValid[language] })
      .positive({ message: texts.schedule.validation.presentationOrderValid[language] }),

    notes: z
      .string()
      .max(500, { message: texts.schedule.validation.presentationNotesMax[language] })
      .optional(),
  });

export const createPresentationSchema = (language: 'en' | 'cs') => presentationSchema(language);

export const updatePresentationSchema = (language: 'en' | 'cs') =>
  presentationSchema(language).partial();
