import { z } from 'zod';
import { texts } from '@frontend/texts';

type ChildSchemaOptions = {
  requireParentIds?: boolean;
  requireClassId?: boolean;
};

const buildBaseChildSchema = (language: 'en' | 'cs') => ({
  firstname: z
    .string()
    .min(2, texts.profile.children.validation.firstNameLength[language])
    .max(100, texts.profile.children.validation.firstNameMaxLength[language]),
  surname: z
    .string()
    .min(2, texts.profile.children.validation.surnameLength[language])
    .max(100, texts.profile.children.validation.surnameMaxLength[language]),
  notes: z
    .string()
    .max(1000, texts.profile.children.validation.notesMaxLength[language])
    .optional(),
});

const buildParentIdsSchema = (language: 'en' | 'cs', required?: boolean) =>
  required
    ? z.array(z.number()).min(1, texts.profile.children.validation.parentRequired[language])
    : z.array(z.number()).optional();

const buildClassIdSchema = (required?: boolean) =>
  required
    ? z
        .number()
        .nullable()
        .refine((value) => value !== null, { message: 'Please select a class' })
    : z.number().nullable().optional();

export const createChildSchema = (language: 'en' | 'cs', options: ChildSchemaOptions = {}) =>
  z.object({
    ...buildBaseChildSchema(language),
    date_of_birth: z
      .string()
      .regex(/^(\d{4})-(\d{2})-(\d{2})$/, texts.profile.children.validation.dateFormat[language]),
    parent_ids: buildParentIdsSchema(language, options.requireParentIds),
    class_id: buildClassIdSchema(options.requireClassId),
  });

export const editChildSchema = (language: 'en' | 'cs', options: ChildSchemaOptions = {}) =>
  z.object({
    ...buildBaseChildSchema(language),
    parent_ids: buildParentIdsSchema(language, options.requireParentIds),
    class_id: buildClassIdSchema(false),
  });
