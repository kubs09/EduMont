import 'axios';

declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any -- D echoes axios's own generic default here; not actually unused, just unread by our added property
  interface AxiosRequestConfig<D = any> {
    redirectOn404?: boolean;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any -- same reasoning as above, for InternalAxiosRequestConfig
  interface InternalAxiosRequestConfig<D = any> {
    redirectOn404?: boolean;
  }
}
