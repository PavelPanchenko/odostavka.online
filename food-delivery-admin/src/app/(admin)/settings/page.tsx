'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Database,
  Shield,
  Bell,
  Phone,
  Mail,
  Clock,
  Building
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { supportSettingsAPI, SupportSettings } from '@/lib/api';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

interface SettingsFormData {
  app_name: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  currency: string;
  timezone: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  support_email: string;
  support_phone: string;
  working_hours: string;
  company_name: string;
  company_address: string;
  privacy_email: string;
  telegram_username: string;
  telegram_link: string;
}

export default function SettingsPage() {
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>({
    defaultValues: {
      app_name: 'О.Доставка',
      maintenance_mode: false,
      registration_enabled: true,
      currency: 'RUB',
      timezone: 'Europe/Moscow',
      email_notifications: true,
      sms_notifications: false,
      support_email: 'support@odostavka.ru',
      support_phone: '+7 (800) 123-45-67',
      working_hours: 'ежедневно с 8:00 до 23:00',
      company_name: 'ООО «О.Доставка»',
      company_address: '123456, г. Москва, ул. Примерная, д. 1',
      privacy_email: 'privacy@odostavka.ru',
      telegram_username: 'your_support_bot',
      telegram_link: 'https://t.me/your_support_bot',
    }
  });
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const s = await supportSettingsAPI.getActive();
      // Маппинг в форму
      reset({
        app_name: 'О.Доставка',
        maintenance_mode: false,
        registration_enabled: true,
        currency: 'RUB',
        timezone: 'Europe/Moscow',
        email_notifications: true,
        sms_notifications: false,
        support_email: s.support_email || '',
        support_phone: s.support_phone || '',
        working_hours: s.working_hours || '',
        company_name: s.company_name || '',
        company_address: s.company_address || '',
        privacy_email: s.privacy_email || '',
        telegram_username: s.telegram_username || '',
        telegram_link: s.telegram_link || '',
      });
      setCurrentSupport(s);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const [currentSupport, setCurrentSupport] = useState<SupportSettings | null>(null);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaving(true);
      const payload = {
        telegram_username: data.telegram_username,
        telegram_link: data.telegram_link,
        support_email: data.support_email,
        support_phone: data.support_phone,
        working_hours: data.working_hours,
        company_name: data.company_name,
        company_address: data.company_address,
        privacy_email: data.privacy_email,
      };
      if (currentSupport) {
        await supportSettingsAPI.update(currentSupport.id, payload);
      } else {
        const created = await supportSettingsAPI.create(payload);
        setCurrentSupport(created);
      }
      showToast('Настройки сохранены', 'success');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      showToast('Ошибка сохранения настроек', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Сбросить настройки?',
      message: 'Вы уверены, что хотите сбросить все изменения?\n\nВсе несохраненные изменения будут потеряны.',
      type: 'warning',
      onConfirm: () => {
        setConfirmDialog(null);
        fetchSettings();
      }
    });
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
            <p className="text-gray-600">Управление настройками системы</p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Сбросить
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Основные настройки */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <SettingsIcon className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Основные настройки</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название приложения
                </label>
                <input
                  type="text"
                  {...register('app_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Валюта
                </label>
                <select
                  {...register('currency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="RUB">Рубль (₽)</option>
                  <option value="USD">Доллар ($)</option>
                  <option value="EUR">Евро (€)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Часовой пояс
                </label>
                <select
                  {...register('timezone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Europe/Moscow">Москва (UTC+3)</option>
                  <option value="Europe/Kiev">Киев (UTC+2)</option>
                  <option value="Asia/Almaty">Алматы (UTC+6)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Настройки системы */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Система</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Режим обслуживания</label>
                  <p className="text-xs text-gray-500">Временно отключить доступ для пользователей</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('maintenance_mode')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Регистрация пользователей</label>
                  <p className="text-xs text-gray-500">Разрешить новым пользователям регистрироваться</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('registration_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Настройки уведомлений */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email уведомления</label>
                  <p className="text-xs text-gray-500">Отправлять уведомления по email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('email_notifications')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">SMS уведомления</label>
                  <p className="text-xs text-gray-500">Отправлять уведомления по SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('sms_notifications')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Контактная информация</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email поддержки
                </label>
                <input
                  type="email"
                  {...register('support_email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="support@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон поддержки
                </label>
                <input
                  type="tel"
                  {...register('support_phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="+7 (800) 123-45-67"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Время работы (общее)
                </label>
                <input
                  type="text"
                  {...register('working_hours')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="ежедневно с 8:00 до 23:00"
                />
              </div>
            </div>
          </div>

          {/* Информация о компании */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Building className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Информация о компании</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название компании
                </label>
                <input
                  type="text"
                  {...register('company_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="ООО «Название компании»"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес компании
                </label>
                <textarea
                  {...register('company_address')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="123456, г. Москва, ул. Примерная, д. 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email для вопросов по персональным данным
                </label>
                <input
                  type="email"
                  {...register('privacy_email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="privacy@example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Диалог подтверждения */}
        {confirmDialog && (
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            type={confirmDialog.type}
            confirmText="Сбросить"
            cancelText="Отмена"
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
          />
        )}
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}