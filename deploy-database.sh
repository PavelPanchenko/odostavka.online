#!/bin/bash

# Скрипт для развертывания базы данных на сервере 212.192.217.128

echo "🚀 Развертывание базы данных на сервере 212.192.217.128..."

# Копируем файлы на сервер
echo "📁 Копирование файлов..."
scp docker-compose-database.yml root@212.192.217.128:/root/
scp env.database root@212.192.217.128:/root/.env

# Подключаемся к серверу и запускаем
echo "🔧 Настройка на сервере..."
ssh root@212.192.217.128 << 'EOF'
    # Останавливаем существующие контейнеры
    docker-compose -f docker-compose-database.yml down
    
    # Запускаем новые контейнеры
    docker-compose -f docker-compose-database.yml up -d
    
    # Проверяем статус
    docker-compose -f docker-compose-database.yml ps
    
    echo "✅ База данных развернута на портах 5432 и 6379"
EOF

echo "🎉 Развертывание базы данных завершено!"
