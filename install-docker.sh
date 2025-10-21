#!/bin/bash

# Скрипт для установки Docker на Ubuntu сервере

echo "🐳 Установка Docker на сервере..."

# Обновляем систему
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
echo "🔧 Установка зависимостей..."
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавляем официальный GPG ключ Docker
echo "🔑 Добавление GPG ключа Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавляем репозиторий Docker
echo "📋 Добавление репозитория Docker..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновляем список пакетов
echo "🔄 Обновление списка пакетов..."
apt update

# Устанавливаем Docker
echo "📦 Установка Docker..."
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запускаем и включаем Docker
echo "🚀 Запуск Docker..."
systemctl start docker
systemctl enable docker

# Добавляем пользователя в группу docker
echo "👤 Настройка пользователя..."
usermod -aG docker $USER

# Проверяем установку
echo "✅ Проверка установки..."
docker --version
docker compose version

echo "🎉 Docker успешно установлен!"
echo "⚠️  Перезайдите в систему или выполните 'newgrp docker' для применения изменений группы"
