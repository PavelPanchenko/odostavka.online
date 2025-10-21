#!/bin/bash

# Скрипт настройки сервера для автоматического деплоя

set -e

echo "🚀 Настройка сервера для автоматического деплоя..."

# Проверяем аргументы
if [ $# -lt 3 ]; then
    echo "❌ Использование: $0 <server_ip> <server_user> <server_path>"
    echo "   Пример: $0 192.168.1.100 root /opt/food-delivery"
    exit 1
fi

SERVER_IP=$1
SERVER_USER=$2
SERVER_PATH=$3

echo "📋 Настраиваем сервер:"
echo "   IP: $SERVER_IP"
echo "   User: $SERVER_USER"
echo "   Path: $SERVER_PATH"

# Проверяем подключение к серверу
echo "🔌 Проверяем подключение к серверу..."
ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo '✅ Подключение успешно'"

# Устанавливаем Docker на сервере
echo "🐳 Устанавливаем Docker на сервере..."
ssh $SERVER_USER@$SERVER_IP '
    # Обновляем систему
    apt-get update
    
    # Устанавливаем Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Устанавливаем Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Добавляем пользователя в группу docker
    usermod -aG docker $USER
    
    # Включаем автозапуск Docker
    systemctl enable docker
    systemctl start docker
'

# Создаем директорию проекта на сервере
echo "📁 Создаем директорию проекта..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"

# Клонируем репозиторий на сервер
echo "📥 Клонируем репозиторий на сервер..."
echo "⚠️  Если репозиторий приватный, настройте SSH ключи или используйте токен доступа"
ssh $SERVER_USER@$SERVER_IP "
    cd $SERVER_PATH
    if [ -d '.git' ]; then
        echo 'Репозиторий уже существует, обновляем...'
        git pull
    else
        echo 'Клонируем репозиторий...'
        # Замените на ваш GitHub репозиторий
        # Для приватных репозиториев используйте SSH: git@github.com:username/repo.git
        # Или настройте токен доступа: https://username:token@github.com/username/repo.git
        echo 'Пожалуйста, вручную склонируйте репозиторий на сервер:'
        echo '  ssh $SERVER_USER@$SERVER_IP'
        echo '  cd $SERVER_PATH'
        echo '  git clone https://github.com/PavelPanchenko/odostavka.online.git .'
        echo '  или для приватного репозитория:'
        echo '  git clone git@github.com:PavelPanchenko/odostavka.online.git .'
    fi
"

# Создаем .env файл на сервере
echo "⚙️ Создаем .env файл на сервере..."
ssh $SERVER_USER@$SERVER_IP "
    cd $SERVER_PATH
    if [ ! -f .env ]; then
        cp env.example .env
        echo '📝 Создан файл .env. Отредактируйте его с вашими настройками:'
        echo '   nano $SERVER_PATH/.env'
    fi
"

# Настраиваем SSH ключи для GitHub Actions
echo "🔑 Настраиваем SSH ключи для GitHub Actions..."

# Создаем SSH ключ если его нет
if [ ! -f ~/.ssh/github_actions ]; then
    echo "📋 Создаем SSH ключ для GitHub Actions..."
    ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com" -f ~/.ssh/github_actions -N ""
    echo "✅ SSH ключ создан"
else
    echo "✅ SSH ключ уже существует"
fi

# Добавляем публичный ключ на сервер
echo "📋 Добавляем публичный ключ на сервер..."
cat ~/.ssh/github_actions.pub | ssh $SERVER_USER@$SERVER_IP 'cat >> ~/.ssh/authorized_keys'

echo ""
echo "📋 Теперь добавьте приватный ключ в GitHub Secrets:"
echo "   Название: SERVER_SSH_KEY"
echo "   Значение:"
echo "   $(cat ~/.ssh/github_actions)"
echo ""
echo "📋 Также добавьте другие секреты:"
echo "   SERVER_USER: $SERVER_USER"
echo "   SERVER_HOST: $SERVER_IP"
echo "   SERVER_PATH: $SERVER_PATH"

# Настраиваем GitHub Secrets
echo "🔐 Настройте следующие GitHub Secrets в вашем репозитории:"
echo "   SERVER_SSH_KEY - приватный SSH ключ для подключения к серверу"
echo "   SERVER_USER - $SERVER_USER"
echo "   SERVER_HOST - $SERVER_IP"
echo "   SERVER_PATH - $SERVER_PATH"

echo ""
echo "✅ Настройка сервера завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте .env файл на сервере: ssh $SERVER_USER@$SERVER_IP 'nano $SERVER_PATH/.env'"
echo "2. Настройте DNS записи для ваших доменов"
echo "3. Запустите первый деплой: ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && ./deploy.sh'"
echo "4. Настройте GitHub Secrets в настройках репозитория"
echo "5. Сделайте push в main ветку для автоматического деплоя"
