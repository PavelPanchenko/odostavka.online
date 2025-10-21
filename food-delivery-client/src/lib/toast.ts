/**
 * Toast утилита - обертка над react-hot-toast
 * Упрощает использование и добавляет кастомные стили
 */
import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message);
  },

  error: (message: string) => {
    toast.error(message);
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  custom: (message: string, options?: any) => {
    toast(message, options);
  },
};

export default showToast;

