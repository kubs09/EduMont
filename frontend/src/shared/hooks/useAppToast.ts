import { toaster } from '@frontend/shared/ui/toaster';

interface AppToastOptions {
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  isClosable?: boolean;
}

export const useAppToast = () => {
  return (options: AppToastOptions) => {
    toaster.create({
      title: options.title,
      description: options.description,
      type: options.status,
      duration: options.duration,
      closable: options.isClosable,
    });
  };
};
