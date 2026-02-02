import { z } from 'zod';
import { texts } from '@frontend/texts';

export const createMessageSchema = (language: 'en' | 'cs') => {
  return z.object({
    to_user_ids: z
      .array(z.number())
      .min(1, { message: texts.messages.validation.toUserIds[language] }),
    subject: z
      .string()
      .min(1, { message: texts.messages.validation.subject[language] })
      .max(255, { message: texts.messages.validation.subjectMaxLength[language] }),
    content: z
      .string()
      .min(1, { message: texts.messages.validation.content[language] })
      .max(5000, { message: texts.messages.validation.contentMaxLength[language] }),
  });
};

export type MessageFormData = z.infer<ReturnType<typeof createMessageSchema>>;
