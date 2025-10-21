#!/bin/bash

# Скрипт обновления SSL сертификатов Let's Encrypt

set -e

echo "🔒 Обновляем SSL сертификаты..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    exit 1
fi

# Загружаем переменные окружения
source .env

# Обновляем сертификаты
echo "🔄 Обновляем сертификаты для доменов:"
echo "   - odostavka.online"
echo "   - admin.odostavka.online"
echo "   - api.odostavka.online"

docker-compose run --rm certbot renew

echo "🔄 Перезапускаем Nginx для применения новых сертификатов..."
docker-compose restart nginx

echo "✅ Сертификаты обновлены!"
echo ""
echo "💡 Рекомендуется добавить этот скрипт в cron для автоматического обновления:"
echo "   0 12 * * * /path/to/update-certificates.sh"
