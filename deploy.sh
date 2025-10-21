#!/bin/bash

# Скрипт развертывания Food Delivery приложения

set -e

echo "🚀 Начинаем развертывание Food Delivery приложения..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📋 Скопируйте env.example в .env и заполните необходимые переменные:"
    echo "   cp env.example .env"
    echo "   nano .env"
    exit 1
fi

# Загружаем переменные окружения
source .env

# Проверяем обязательные переменные
if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$SECRET_KEY" ] || [ -z "$CERTBOT_EMAIL" ]; then
    echo "❌ Не все обязательные переменные окружения заполнены!"
    echo "📋 Проверьте файл .env и заполните:"
    echo "   - POSTGRES_PASSWORD"
    echo "   - SECRET_KEY"
    echo "   - CERTBOT_EMAIL"
    exit 1
fi

echo "📦 Собираем Docker образы..."
docker-compose build

echo "🔄 Останавливаем существующие контейнеры..."
docker-compose down

echo "🗄️ Создаем тома для данных..."
docker volume create food-delivery_postgres_data 2>/dev/null || true
docker volume create food-delivery_redis_data 2>/dev/null || true
docker volume create food-delivery_certbot_certs 2>/dev/null || true
docker volume create food-delivery_certbot_www 2>/dev/null || true

echo "🚀 Запускаем сервисы..."
docker-compose up -d postgres redis

echo "⏳ Ждем готовности базы данных..."
sleep 10

echo "🔧 Запускаем API..."
docker-compose up -d api

echo "🌐 Запускаем веб-приложения..."
docker-compose up -d admin client

echo "🔒 Настраиваем SSL сертификаты..."
echo "📧 Получаем Let's Encrypt сертификаты для доменов:"
echo "   - odostavka.online"
echo "   - admin.odostavka.online" 
echo "   - api.odostavka.online"

# Запускаем certbot для получения сертификатов
docker-compose run --rm certbot

echo "🌐 Запускаем Nginx..."
docker-compose up -d nginx

echo "✅ Развертывание завершено!"
echo ""
echo "🌍 Ваши приложения доступны по адресам:"
echo "   👥 Клиент: https://odostavka.online"
echo "   🔧 Админка: https://admin.odostavka.online"
echo "   🔌 API: https://api.odostavka.online"
echo ""
echo "📊 Для мониторинга используйте:"
echo "   docker-compose logs -f"
echo "   docker-compose ps"
