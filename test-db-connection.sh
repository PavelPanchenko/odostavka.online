#!/bin/bash

echo "🔍 Проверка подключения к базе данных на сервере 212.192.217.128..."

# Проверяем подключение к PostgreSQL
echo "📊 Проверка PostgreSQL..."
if command -v psql &> /dev/null; then
    if psql -h 212.192.217.128 -U food_delivery_user -d food_delivery -c "SELECT version();" 2>/dev/null; then
        echo "✅ PostgreSQL подключение успешно"
    else
        echo "❌ Не удалось подключиться к PostgreSQL"
        echo "💡 Установите postgresql-client: apt install postgresql-client"
    fi
else
    echo "⚠️  psql не установлен. Установите: apt install postgresql-client"
fi

# Проверяем подключение к Redis
echo "📊 Проверка Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli -h 212.192.217.128 ping 2>/dev/null | grep -q "PONG"; then
        echo "✅ Redis подключение успешно"
    else
        echo "❌ Не удалось подключиться к Redis"
        echo "💡 Установите redis-tools: apt install redis-tools"
    fi
else
    echo "⚠️  redis-cli не установлен. Установите: apt install redis-tools"
fi

# Проверяем сетевую доступность
echo "🌐 Проверка сетевой доступности..."
if ping -c 1 212.192.217.128 > /dev/null 2>&1; then
    echo "✅ Сервер 212.192.217.128 доступен"
else
    echo "❌ Сервер 212.192.217.128 недоступен"
fi

# Проверяем порты
echo "🔌 Проверка портов..."
if nc -z 212.192.217.128 5432 2>/dev/null; then
    echo "✅ Порт 5432 (PostgreSQL) открыт"
else
    echo "❌ Порт 5432 (PostgreSQL) закрыт"
fi

if nc -z 212.192.217.128 6379 2>/dev/null; then
    echo "✅ Порт 6379 (Redis) открыт"
else
    echo "❌ Порт 6379 (Redis) закрыт"
fi
