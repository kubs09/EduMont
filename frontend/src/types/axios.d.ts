import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig<D = any> {
    redirectOn404?: boolean;
  }

  interface InternalAxiosRequestConfig<D = any> {
    redirectOn404?: boolean;
  }
}