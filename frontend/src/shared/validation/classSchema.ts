import { z } from 'zod';
import texts from '@frontend/texts';

export const classTeachersSchema = (language: 'en' | 'cs') =>
  z
    .object({
      teacherId: z
        .number({
          invalid_type_error: texts.classes.validation.teacherValid[language],
        })
        .int({ message: texts.classes.validation.teacherValid[language] })
        .nullable()
        .refine((val) => val !== null, {
          message: texts.classes.validation.teacherRequired[language],
        }),

      assistantId: z
        .number({
          invalid_type_error: texts.classes.validation.assistantValid[language],
        })
        .int({ message: texts.classes.validation.assistantValid[language] })
        .nullable()
        .refine((val) => val !== null, {
          message: texts.classes.validation.assistantRequired[language],
        }),
    })
    .refine((data) => data.assistantId === null || data.assistantId !== data.teacherId, {
      message: texts.classes.validation.teacherAlreadyAssigned[language],
      path: ['assistantId'],
    });

export const classInfoSchema = (language: 'en' | 'cs') =>
  z.object({
    name: z
      .string()
      .min(1, { message: texts.classes.validation.classNameRequired[language] })
      .min(2, { message: texts.classes.validation.classNameMin[language] })
      .max(100, { message: texts.classes.validation.classNameMax[language] }),
    description: z
      .string()
      .min(1, { message: texts.classes.validation.classDescriptionRequired[language] })
      .min(5, { message: texts.classes.validation.classDescriptionMin[language] })
      .max(500, { message: texts.classes.validation.classDescriptionMax[language] }),
    minAge: z.number(),
    maxAge: z.number(),
  });

export const classSchema = classInfoSchema;

export const createClassSchema = (language: 'en' | 'cs') =>
  classInfoSchema(language).and(classTeachersSchema(language));

export const classManagementSchema = z.object({});
