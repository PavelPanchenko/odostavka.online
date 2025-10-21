import { useQuery } from '@tanstack/react-query';
import { supportAPI, SupportSettings } from '@/lib/api';

/**
 * Хук для загрузки контактной информации и настроек поддержки
 */
export function useContactInfo() {
  return useQuery<SupportSettings>({
    queryKey: ['contactInfo'],
    queryFn: supportAPI.getSettings,
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Хук для получения контактных данных с fallback значениями
 */
export function useContactData() {
  const { data: contactInfo, isLoading, error } = useContactInfo();

  // Fallback значения для случаев, когда данные не загружены или произошла ошибка
  const fallbackData: SupportSettings = {
    id: 0,
    telegram_username: 'your_support_bot',
    telegram_link: 'https://t.me/your_support_bot',
    support_email: 'support@odostavka.ru',
    support_phone: '+7 (800) 123-45-67',
    working_hours: 'ежедневно с 8:00 до 23:00',
    company_name: 'ООО «О.Доставка»',
    company_address: '123456, г. Москва, ул. Примерная, д. 1',
    privacy_email: 'privacy@odostavka.ru',
    is_active: true,
    description: 'Default settings',
  };

  return {
    contactData: contactInfo || fallbackData,
    isLoading,
    error,
    isFallback: !contactInfo,
  };
}
