import { z } from 'zod';
import { texts } from '@frontend/texts';

type ChildSchemaOptions = {
  requireParentIds?: boolean;
  requireClassId?: boolean;
};

const buildBaseChildSchema = (language: 'en' | 'cs') => ({
  firstname: z
    .string()
    .min(2, texts.children.validation.firstNameLength[language])
    .max(100, texts.children.validation.firstNameMaxLength[language]),
  surname: z
    .string()
    .min(2, texts.children.validation.surnameLength[language])
    .max(100, texts.children.validation.surnameMaxLength[language]),
  notes: z.string().max(1000, texts.children.validation.notesMaxLength[language]).optional(),
});

const buildParentIdsSchema = (language: 'en' | 'cs', required?: boolean) =>
  required
    ? z.array(z.number()).min(1, texts.children.validation.parentRequired[language])
    : z.array(z.number()).optional();

const buildClassIdSchema = (language: 'en' | 'cs', required?: boolean) =>
  required
    ? z
        .number()
        .nullable()
        .refine((value) => value !== null, {
          message: texts.children.validation.classRequired[language],
        })
    : z.number().nullable().optional();

export const createChildSchema = (language: 'en' | 'cs', options: ChildSchemaOptions = {}) =>
  z.object({
    ...buildBaseChildSchema(language),
    date_of_birth: z
      .string()
      .regex(/^(\d{4})-(\d{2})-(\d{2})$/, texts.children.validation.dateFormat[language]),
    parent_ids: buildParentIdsSchema(language, options.requireParentIds),
    class_id: buildClassIdSchema(language, options.requireClassId),
  });

export const editChildSchema = (language: 'en' | 'cs', options: ChildSchemaOptions = {}) =>
  z.object({
    ...buildBaseChildSchema(language),
    parent_ids: buildParentIdsSchema(language, options.requireParentIds),
    class_id: buildClassIdSchema(language, false),
  });
