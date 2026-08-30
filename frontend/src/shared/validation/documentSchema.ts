import { z } from 'zod';
import { texts } from '@frontend/texts';

const allowedDocumentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
const maxDocumentSizeBytes = 5 * 1024 * 1024;

const hasAllowedExtension = (fileName: string) =>
  allowedDocumentExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));

export const createDocumentSchema = (language: 'en' | 'cs') =>
  z
    .object({
      title: z
        .string()
        .max(200, { message: texts.children.validation.documentTitleMaxLength[language] })
        .optional(),
      description: z
        .string()
        .max(1000, { message: texts.children.validation.documentDescriptionMaxLength[language] })
        .optional(),
      file: z
        .instanceof(File)
        .refine((file) => file.size <= maxDocumentSizeBytes, {
          message: texts.children.validation.documentFileTooLarge[language],
        })
        .refine((file) => hasAllowedExtension(file.name), {
          message: texts.children.validation.documentInvalidFileType[language],
        })
        .optional(),
    })
    .refine((data) => data.file !== undefined, {
      message: texts.children.validation.documentFileRequired[language],
      path: ['file'],
    });

export type DocumentFormData = z.infer<ReturnType<typeof createDocumentSchema>>;
