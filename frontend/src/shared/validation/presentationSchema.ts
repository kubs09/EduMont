import { z } from 'zod';
import texts from '@frontend/texts';

export const presentationSchema = (language: 'en' | 'cs') =>
  z.object({
    category: z
      .string({
        invalid_type_error: texts.schedule.validation.categoryValid[language],
      })
      .min(1, { message: texts.schedule.validation.categoryRequired[language] }),

    name: z
      .string()
      .min(1, { message: texts.schedule.validation.nameRequired[language] })
      .min(2, { message: texts.schedule.validation.nameMinLength[language] })
      .max(100, { message: texts.schedule.validation.nameMaxLength[language] }),

    age_group: z
      .string({
        invalid_type_error: texts.schedule.validation.ageGroupValid[language],
      })
      .min(1, { message: texts.schedule.validation.ageGroupRequired[language] }),

    display_order: z
      .number({
        invalid_type_error: texts.schedule.validation.orderValid[language],
      })
      .int({ message: texts.schedule.validation.orderValid[language] })
      .positive({ message: texts.schedule.validation.orderValid[language] }),

    notes: z
      .string()
      .max(500, { message: texts.schedule.validation.notesMaxLength[language] })
      .optional(),
  });

export const createPresentationSchema = (language: 'en' | 'cs') => presentationSchema(language);

export const updatePresentationSchema = (language: 'en' | 'cs') =>
  presentationSchema(language).partial();
