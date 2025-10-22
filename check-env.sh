#!/bin/bash

# Скрипт для проверки и создания .env файла

echo "🔍 Проверка файла окружения..."

# Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Создаем из env.local..."
    cp env.local .env
    echo "✅ Файл .env создан"
else
    echo "✅ Файл .env найден"
fi

# Проверяем основные переменные
echo ""
echo "🔍 Проверяем переменные окружения..."

# Проверяем PostgreSQL переменные
if grep -q "POSTGRES_DB=" .env; then
    POSTGRES_DB=$(grep "POSTGRES_DB=" .env | cut -d'=' -f2)
    echo "✅ POSTGRES_DB: $POSTGRES_DB"
else
    echo "❌ POSTGRES_DB не найден"
fi

if grep -q "POSTGRES_USER=" .env; then
    POSTGRES_USER=$(grep "POSTGRES_USER=" .env | cut -d'=' -f2)
    echo "✅ POSTGRES_USER: $POSTGRES_USER"
else
    echo "❌ POSTGRES_USER не найден"
fi

if grep -q "POSTGRES_PASSWORD=" .env; then
    POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD=" .env | cut -d'=' -f2)
    echo "✅ POSTGRES_PASSWORD: [скрыт]"
else
    echo "❌ POSTGRES_PASSWORD не найден"
fi

echo ""
echo "📝 Если нужно изменить настройки, отредактируйте файл .env"
echo "   nano .env"
echo ""
