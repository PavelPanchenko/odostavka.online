#!/bin/bash

# Скрипт быстрого деплоя на сервер

set -e

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📋 Скопируйте env.example в .env и заполните необходимые переменные:"
    echo "   cp env.example .env"
    exit 1
fi

# Загружаем переменные окружения
source .env

# Проверяем обязательные переменные для деплоя
if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_PATH" ]; then
    echo "❌ Не все переменные для деплоя заполнены!"
    echo "📋 Добавьте в .env файл:"
    echo "   SERVER_HOST=your_server_ip"
    echo "   SERVER_USER=your_server_user"
    echo "   SERVER_PATH=/path/to/project"
    exit 1
fi

echo "🚀 Начинаем деплой на сервер..."
echo "   Сервер: $SERVER_USER@$SERVER_HOST"
echo "   Путь: $SERVER_PATH"

# Проверяем подключение к серверу
echo "🔌 Проверяем подключение к серверу..."
ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo '✅ Подключение успешно'"

# Копируем файлы на сервер
echo "📤 Копируем файлы на сервер..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='*.pyc' . $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Выполняем деплой на сервере
echo "🚀 Выполняем деплой на сервере..."
ssh $SERVER_USER@$SERVER_HOST "
    cd $SERVER_PATH
    
    echo '🛑 Останавливаем сервисы...'
    docker-compose down || true
    
    echo '🔨 Собираем образы...'
    docker-compose build
    
    echo '🚀 Запускаем сервисы...'
    docker-compose up -d
    
    echo '🧹 Очищаем неиспользуемые образы...'
    docker system prune -f
    
    echo '📊 Статус сервисов:'
    docker-compose ps
"

echo "✅ Деплой завершен!"
echo ""
echo "🌍 Проверьте доступность сервисов:"
echo "   - https://odostavka.online"
echo "   - https://admin.odostavka.online"
echo "   - https://api.odostavka.online"
