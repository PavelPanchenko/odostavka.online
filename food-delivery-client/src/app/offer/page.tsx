import { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { supportAPI } from '@/lib/api';
import LegalDocumentHeader from '@/components/LegalDocumentHeader';

export const metadata: Metadata = {
  title: 'Публичная оферта - О.Доставка',
  description: 'Публичная оферта на оказание услуг по доставке продуктов',
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

export default async function OfferPage() {
  const contactData = await getContactData();

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <LegalDocumentHeader 
        title="Публичная оферта"
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
                Настоящая публичная оферта (далее — «Оферта») определяет условия оказания услуг 
                по доставке продуктов питания и товаров повседневного спроса через сервис 
                «О.Доставка» (далее — «Сервис»).
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Исполнитель: {contactData.company_name || 'ООО «О.Доставка»'} (далее — «Исполнитель»).<br/>
                Заказчик: физическое лицо, использующее Сервис (далее — «Заказчик»).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                2. Предмет договора
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Исполнитель обязуется оказать Заказчику следующие услуги:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Прием и обработка заказов на доставку продуктов</li>
                <li>Доставка заказанных товаров по указанному адресу</li>
                <li>Информирование о статусе заказа</li>
                <li>Обработка возвратов и обменов</li>
                <li>Консультационная поддержка</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                3. Порядок заключения договора
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Договор считается заключенным с момента:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Регистрации Заказчика в Сервисе</li>
                <li>Оформления первого заказа</li>
                <li>Подтверждения заказа Исполнителем</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed mt-3">
                Акцептом настоящей Оферты является совершение Заказчиком действий, 
                направленных на использование Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                4. Права и обязанности сторон
              </h2>
              
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                4.1. Исполнитель обязуется:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Оказать услуги в соответствии с настоящей Офертой</li>
                <li>Обеспечить качественную доставку товаров</li>
                <li>Информировать о статусе заказа</li>
                <li>Соблюдать конфиденциальность персональных данных</li>
                <li>Обеспечить возможность возврата товаров</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-800 mb-2">
                4.2. Заказчик обязуется:
              </h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Предоставлять достоверную информацию</li>
                <li>Оплачивать услуги в установленные сроки</li>
                <li>Быть доступным для связи в указанное время</li>
                <li>Принимать заказ в согласованное время</li>
                <li>Соблюдать правила использования Сервиса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                5. Стоимость услуг и порядок расчетов
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Стоимость услуг включает:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Стоимость заказанных товаров</li>
                <li>Стоимость доставки (при заказе менее 1000 руб.)</li>
                <li>Комиссию за обработку заказа</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Оплата производится наличными при получении заказа или банковской картой 
                через защищенный платежный шлюз.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                6. Сроки и условия доставки
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Сроки доставки:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Стандартная доставка: 30-60 минут</li>
                <li>Экспресс доставка: 15-30 минут (доплата 200 руб.)</li>
                <li>Доставка в отдаленные районы: до 90 минут</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Доставка осуществляется в пределах зоны покрытия Сервиса. 
                Точные сроки могут варьироваться в зависимости от загруженности и погодных условий.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                7. Возврат и обмен товаров
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
                Заявка на возврат должна быть подана в течение 24 часов с момента получения заказа. 
                Возврат денежных средств осуществляется в течение 3-5 рабочих дней.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                8. Ответственность сторон
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Исполнитель несет ответственность за:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mb-3">
                <li>Качество доставляемых товаров</li>
                <li>Соблюдение сроков доставки</li>
                <li>Сохранность товаров при транспортировке</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed">
                Исполнитель не несет ответственности за задержки, вызванные обстоятельствами 
                непреодолимой силы, действиями третьих лиц или техническими сбоями.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                9. Изменение условий оферты
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Исполнитель вправе в одностороннем порядке изменять условия настоящей Оферты. 
                Изменения вступают в силу с момента их публикации в Сервисе. 
                Продолжение использования Сервиса после внесения изменений означает 
                согласие с новыми условиями.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                10. Разрешение споров
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Все споры и разногласия решаются путем переговоров. 
                В случае невозможности достижения соглашения споры подлежат рассмотрению 
                в суде по месту нахождения Исполнителя в соответствии с действующим законодательством РФ.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                11. Контактная информация
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                По всем вопросам, связанным с оказанием услуг, обращайтесь:<br/>
                {contactData.support_email && `Email: ${contactData.support_email}`}<br/>
                {contactData.support_phone && `Телефон: ${contactData.support_phone}`}<br/>
                {contactData.working_hours && `Время работы: ${contactData.working_hours}`}
                {contactData.company_address && (
                  <>
                    <br/>Адрес: {contactData.company_address}
                  </>
                )}
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
