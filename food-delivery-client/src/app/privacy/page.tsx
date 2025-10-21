import { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { supportAPI } from '@/lib/api';
import LegalDocumentHeader from '@/components/LegalDocumentHeader';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности - О.Доставка',
  description: 'Политика конфиденциальности и обработки персональных данных',
};

async function getContactData() {
  try {
    const contactData = await supportAPI.getSettings();
    return contactData;
  } catch (error) {
    // Fallback значения при ошибке
    return {
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
  }
}

export default async function PrivacyPage() {
  const contactData = await getContactData();

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <LegalDocumentHeader 
        title="Политика конфиденциальности"
        icon={<Shield className="h-5 w-5 text-green-600" />}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                1. Общие положения
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок 
                обработки и защиты персональных данных пользователей сервиса «О.Доставка» 
                (далее — «Сервис»).
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Оператор персональных данных: {contactData.company_name || 'ООО «О.Доставка»'} (далее — «Оператор»).<br/>
                Используя Сервис, вы соглашаетесь с условиями настоящей Политики.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                2. Категории обрабатываемых данных
              </h2>
              
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                2.1. Персональные данные:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Фамилия, имя, отчество</li>
                <li>Адрес электронной почты</li>
                <li>Номер телефона</li>
                <li>Адрес доставки</li>
                <li>Дата рождения (при регистрации)</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2">
                2.2. Данные о заказах:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>История заказов</li>
                <li>Предпочтения в товарах</li>
                <li>Способы оплаты</li>
                <li>Время и место доставки</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2">
                2.3. Технические данные:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>IP-адрес</li>
                <li>Информация о браузере и устройстве</li>
                <li>Данные о местоположении (с согласия)</li>
                <li>Cookies и аналогичные технологии</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                3. Цели и правовые основания обработки
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Персональные данные обрабатываются в следующих целях:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Оказание услуг по доставке продуктов</li>
                <li>Обработка и выполнение заказов</li>
                <li>Связь с клиентами и поддержка</li>
                <li>Улучшение качества сервиса</li>
                <li>Маркетинговые коммуникации (с согласия)</li>
                <li>Соблюдение правовых обязательств</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Правовыми основаниями обработки являются: согласие субъекта данных, 
                исполнение договора, соблюдение правовых обязательств.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                4. Способы обработки данных
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Оператор обрабатывает персональные данные следующими способами:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Сбор, запись, систематизация</li>
                <li>Накопление, хранение</li>
                <li>Уточнение, обновление, изменение</li>
                <li>Извлечение, использование, передача</li>
                <li>Обезличивание, блокирование, удаление</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                5. Передача данных третьим лицам
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Оператор может передавать персональные данные третьим лицам в следующих случаях:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Курьерским службам для доставки заказов</li>
                <li>Платежным системам для обработки платежей</li>
                <li>Поставщикам товаров для выполнения заказов</li>
                <li>По требованию уполномоченных органов</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                При передаче данных третьим лицам Оператор обеспечивает их защиту 
                и использование только в указанных целях.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                6. Сроки хранения данных
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Персональные данные хранятся в течение следующих сроков:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Данные активных пользователей: до удаления аккаунта</li>
                <li>Данные о заказах: 5 лет с момента заказа</li>
                <li>Данные для маркетинга: до отзыва согласия</li>
                <li>Технические данные: до 1 года</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                7. Меры защиты данных
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Оператор применяет следующие меры защиты:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Шифрование данных при передаче и хранении</li>
                <li>Контроль доступа к персональным данным</li>
                <li>Регулярное обновление систем безопасности</li>
                <li>Обучение сотрудников вопросам защиты данных</li>
                <li>Мониторинг и аудит систем</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Несмотря на принимаемые меры, Оператор не может гарантировать 
                абсолютную безопасность данных в сети Интернет.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                8. Права субъектов персональных данных
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Вы имеете следующие права в отношении ваших персональных данных:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Право на доступ к персональным данным</li>
                <li>Право на исправление неточных данных</li>
                <li>Право на удаление персональных данных</li>
                <li>Право на ограничение обработки</li>
                <li>Право на портируемость данных</li>
                <li>Право на возражение против обработки</li>
                <li>Право на отзыв согласия</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Для реализации ваших прав обращайтесь к Оператору по контактным данным, 
                указанным в разделе 11.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                9. Cookies и аналогичные технологии
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Сервис использует следующие типы cookies:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Необходимые cookies (функциональные)</li>
                <li>Аналитические cookies (статистика)</li>
                <li>Маркетинговые cookies (персонализация)</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Вы можете управлять cookies через настройки браузера. 
                Отключение некоторых cookies может ограничить функциональность Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                10. Обработка данных несовершеннолетних
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Сервис не предназначен для лиц младше 14 лет. Мы не собираем 
                намеренно персональные данные несовершеннолетних. Если вы являетесь 
                родителем или опекуном и знаете, что ваш ребенок предоставил нам 
                персональные данные, свяжитесь с нами для их удаления.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                11. Изменения в Политике
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Оператор может обновлять настоящую Политику. О существенных изменениях 
                пользователи будут уведомлены через Сервис или по электронной почте. 
                Продолжение использования Сервиса после внесения изменений означает 
                согласие с обновленной Политикой.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                12. Контактная информация
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                По вопросам обработки персональных данных обращайтесь:<br/>
                {contactData.privacy_email && `Email: ${contactData.privacy_email}`}<br/>
                {contactData.support_phone && `Телефон: ${contactData.support_phone}`}<br/>
                {contactData.company_address && `Почтовый адрес: ${contactData.company_address}`}<br/>
                {contactData.working_hours && `Время работы: ${contactData.working_hours}`}
              </p>
            </section>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

