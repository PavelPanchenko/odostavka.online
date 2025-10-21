import { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { supportAPI } from '@/lib/api';
import LegalDocumentHeader from '@/components/LegalDocumentHeader';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение - О.Доставка',
  description: 'Условия использования сервиса О.Доставка',
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

export default async function TermsPage() {
  const contactData = await getContactData();

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <LegalDocumentHeader 
        title="Пользовательское соглашение"
        icon={<FileText className="h-5 w-5 text-green-600" />}
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
                Настоящее Пользовательское соглашение (далее — «Соглашение») определяет условия 
                использования сервиса «О.Доставка» (далее — «Сервис») и является публичной офертой 
                в соответствии со статьей 437 Гражданского кодекса РФ.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Используя Сервис, вы подтверждаете, что ознакомились с условиями Соглашения 
                и принимаете их в полном объеме. Если вы не согласны с условиями, 
                прекратите использование Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                2. Определения
              </h2>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li><strong>Сервис</strong> — мобильное приложение и веб-сайт О.Доставка</li>
                <li><strong>Пользователь</strong> — физическое лицо, использующее Сервис</li>
                <li><strong>Заказ</strong> — запрос на доставку товаров через Сервис</li>
                <li><strong>Товар</strong> — продукты питания и товары повседневного спроса</li>
                <li><strong>Доставка</strong> — услуга по транспортировке товаров</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                3. Регистрация и учетная запись
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Для использования Сервиса необходимо:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Создать учетную запись с достоверными данными</li>
                <li>Подтвердить номер телефона</li>
                <li>Указать актуальный адрес электронной почты</li>
                <li>Согласиться с условиями Соглашения</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Пользователь несет ответственность за сохранность данных для входа 
                и за все действия, совершенные под его учетной записью.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                4. Оформление и выполнение заказов
              </h2>
              
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                4.1. Оформление заказа:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Выберите товары из каталога</li>
                <li>Укажите количество и параметры товаров</li>
                <li>Выберите способ оплаты и доставки</li>
                <li>Подтвердите адрес и контактные данные</li>
                <li>Подтвердите заказ</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2">
                4.2. Обязанности Пользователя:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Предоставлять достоверную информацию</li>
                <li>Быть доступным для связи в указанное время</li>
                <li>Принимать заказ в согласованное время</li>
                <li>Проверять качество и комплектность товаров</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                5. Оплата и ценообразование
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Стоимость заказа включает:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Стоимость товаров по ценам, указанным в каталоге</li>
                <li>Стоимость доставки (при заказе менее 1000 руб.)</li>
                <li>Дополнительные услуги (при наличии)</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Оплата производится наличными при получении или банковской картой 
                через защищенный платежный шлюз. Цены могут изменяться без предварительного уведомления.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                6. Доставка
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Условия доставки:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Стандартная доставка: 30-60 минут</li>
                <li>Экспресс доставка: 15-30 минут (доплата 200 руб.)</li>
                <li>Доставка в отдаленные районы: до 90 минут</li>
                <li>Минимальная сумма заказа: 300 рублей</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Сроки доставки являются ориентировочными и могут изменяться 
                в зависимости от загруженности и погодных условий.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                7. Отмена и изменение заказов
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Пользователь может отменить заказ:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>До подтверждения заказа — без ограничений</li>
                <li>После подтверждения — в течение 5 минут</li>
                <li>После начала сборки — только по согласованию</li>
                <li>После передачи курьеру — только в исключительных случаях</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Изменение заказа возможно только до начала его обработки.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                8. Возврат товаров
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Возврат товаров возможен в следующих случаях:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Получение товара ненадлежащего качества</li>
                <li>Получение товара, не соответствующего заказу</li>
                <li>Повреждение товара при транспортировке</li>
                <li>Истечение срока годности товара</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Заявка на возврат подается в течение 24 часов с момента получения заказа. 
                Возврат денежных средств осуществляется в течение 3-5 рабочих дней.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                9. Интеллектуальная собственность
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Все материалы Сервиса (тексты, изображения, дизайн, программное обеспечение) 
                являются объектами интеллектуальной собственности и защищены авторским правом. 
                Использование материалов без письменного разрешения запрещено.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                10. Ответственность сторон
              </h2>
              
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                10.1. Сервис не несет ответственности за:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Задержки доставки по причинам, не зависящим от Сервиса</li>
                <li>Качество товаров, предоставляемых поставщиками</li>
                <li>Действия третьих лиц</li>
                <li>Технические сбои и перебои в работе</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2">
                10.2. Пользователь несет ответственность за:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Достоверность предоставленной информации</li>
                <li>Соблюдение условий Соглашения</li>
                <li>Своевременную оплату заказов</li>
                <li>Принятие заказов в согласованное время</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                11. Запрещенные действия
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                При использовании Сервиса запрещается:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Предоставлять ложную информацию</li>
                <li>Использовать Сервис в противоправных целях</li>
                <li>Нарушать работу Сервиса техническими средствами</li>
                <li>Создавать множественные аккаунты</li>
                <li>Передавать данные для входа третьим лицам</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                12. Изменение условий
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Сервис вправе изменять условия Соглашения в одностороннем порядке. 
                Изменения вступают в силу с момента их публикации в Сервисе. 
                Продолжение использования Сервиса означает согласие с новыми условиями.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                13. Разрешение споров
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Все споры решаются путем переговоров. При невозможности достижения соглашения 
                споры подлежат рассмотрению в суде по месту нахождения Сервиса 
                в соответствии с законодательством РФ.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                14. Контактная информация
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                По всем вопросам обращайтесь:<br/>
                {contactData.support_email && `Email: ${contactData.support_email}`}<br/>
                {contactData.support_phone && `Телефон: ${contactData.support_phone}`}<br/>
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

