import { useState } from 'react';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Switch,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Section } from '@frontend/shared/components';
import { changePassword } from '@frontend/services/api';
import {
  createPasswordChangeSchema,
  PasswordChangeSchema,
} from '../../shared/validation/passwordSchema';

interface SettingsSectionProps {
  messageNotifications: boolean;
  onToggleNotifications: () => void;
}

const SettingsSection = ({ messageNotifications, onToggleNotifications }: SettingsSectionProps) => {
  const { language } = useLanguage();
  const toast = useToast();
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
        title: texts.profile.passwordChanged[language],
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
            currentPassword: texts.profile.incorrectCurrentPassword[language],
          }));
          return;
        } else {
          toast({
            title: texts.profile.passwordError[language],
            status: 'error',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={6}>
      <Section title={texts.profile.notifications.title[language]}>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="message-notifications" mb="0">
            {texts.profile.notifications.messages[language]}
          </FormLabel>
          <Switch
            id="message-notifications"
            isChecked={messageNotifications}
            onChange={onToggleNotifications}
          />
        </FormControl>
      </Section>
      <Section title={texts.profile.password[language]}>
        {!showPasswordForm ? (
          <Button variant="brand" onClick={() => setShowPasswordForm(true)}>
            {texts.profile.changePassword[language]}
          </Button>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.currentPassword}>
                <FormLabel>{texts.profile.currentPassword[language]}</FormLabel>
                <Input
                  type="password"
                  name="currentPassword"
                  variant="filled"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.newPassword}>
                <FormLabel>{texts.profile.newPassword[language]}</FormLabel>
                <Input
                  type="password"
                  name="newPassword"
                  variant="filled"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>{texts.profile.confirmNewPassword[language]}</FormLabel>
                <Input
                  type="password"
                  name="confirmPassword"
                  variant="filled"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>
              <Button type="submit" variant="brand" isLoading={isSubmitting}>
                {texts.profile.save[language]}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetForm();
                  setShowPasswordForm(false);
                }}
              >
                {texts.profile.cancel[language]}
              </Button>
            </VStack>
          </form>
        )}
      </Section>
    </Stack>
  );
};

export default SettingsSection;
