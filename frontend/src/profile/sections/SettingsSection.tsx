import { useState } from 'react';
import { Button, Input, Stack, Switch, VStack, Field } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Section } from '@frontend/shared/components';
import { changePassword } from '@frontend/services/api';
import {
  createPasswordChangeSchema,
  PasswordChangeSchema,
} from '@frontend/shared/validation/passwordSchema';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

interface SettingsSectionProps {
  messageNotifications: boolean;
  onToggleNotifications: () => void;
}

const SettingsSection = ({ messageNotifications, onToggleNotifications }: SettingsSectionProps) => {
  const { language } = useLanguage();
  const toast = useAppToast();
  const userId = Number(localStorage.getItem('userId'));
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState<PasswordChangeSchema>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const schema = createPasswordChangeSchema(language);
      schema.parse(formData);
      setErrors({});
      setIsSubmitting(true);
      await changePassword(userId, formData.currentPassword, formData.newPassword);
      toast({
        title: texts.profile.success.passwordChanged[language],
        status: 'success',
      });
      resetForm();
      setShowPasswordForm(false);
    } catch (error) {
      if (error.errors) {
        const validationErrors: Record<string, string> = {};
        interface ZodError {
          path: string[];
          message: string;
        }
        (error.errors as ZodError[]).forEach((err: ZodError) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
        return;
      }
      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          setErrors((prev) => ({
            ...prev,
            currentPassword: texts.profile.errors.incorrectCurrentPassword[language],
          }));
          return;
        } else {
          toast({
            title: texts.profile.errors.passwordChangeFailed[language],
            status: 'error',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap={6}>
      <Section title={texts.profile.notifications.title[language]}>
        <Field.Root display="flex" alignItems="center">
          <Field.Label htmlFor="message-notifications" mb="0">
            {texts.profile.notifications.messages[language]}
          </Field.Label>
          <Switch.Root
            id="message-notifications"
            checked={messageNotifications}
            onCheckedChange={() => onToggleNotifications()}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Field.Root>
      </Section>
      <Section title={texts.profile.password[language]}>
        {!showPasswordForm ? (
          <Button variant="brand" onClick={() => setShowPasswordForm(true)}>
            {texts.profile.changePassword[language]}
          </Button>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Field.Root invalid={!!errors.currentPassword}>
                <Field.Label>{texts.profile.currentPassword[language]}</Field.Label>
                <Input
                  type="password"
                  name="currentPassword"
                  variant="subtle"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                <Field.ErrorText>{errors.currentPassword}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.newPassword}>
                <Field.Label>{texts.profile.newPassword[language]}</Field.Label>
                <Input
                  type="password"
                  name="newPassword"
                  variant="subtle"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <Field.ErrorText>{errors.newPassword}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.confirmPassword}>
                <Field.Label>{texts.profile.confirmNewPassword[language]}</Field.Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  variant="subtle"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
              </Field.Root>
              <Button type="submit" variant="brand" loading={isSubmitting}>
                {texts.profile.save[language]}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetForm();
                  setShowPasswordForm(false);
                }}
              >
                {texts.common.cancel[language]}
              </Button>
            </VStack>
          </form>
        )}
      </Section>
    </Stack>
  );
};

export default SettingsSection;
