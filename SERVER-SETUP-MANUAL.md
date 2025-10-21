# 🛠️ Ручная настройка сервера для деплоя

Поскольку автоматическая настройка через SSH не удалась, вот пошаговая инструкция для ручной настройки сервера.

## 📋 Шаг 1: Подключение к серверу

```bash
ssh root@83.217.223.185
```

## 📋 Шаг 2: Установка Docker (если еще не установлен)

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверяем установку
docker --version
docker-compose --version
```

## 📋 Шаг 3: Клонирование репозитория

```bash
# Создаем директорию
mkdir -p /opt/food-delivery
cd /opt/food-delivery

# Клонируем репозиторий
git clone https://github.com/PavelPanchenko/odostavka.online.git .

# Или если репозиторий приватный, используйте SSH:
# git clone git@github.com:PavelPanchenko/odostavka.online.git .
```

## 📋 Шаг 4: Настройка переменных окружения

```bash
# Копируем пример конфигурации
cp env.example .env

# Редактируем конфигурацию
nano .env
```

**Обязательные переменные для .env:**
```bash
# Database Configuration
POSTGRES_DB=food_delivery
POSTGRES_USER=food_delivery_user
POSTGRES_PASSWORD=your_secure_password_here

# API Configuration
SECRET_KEY=your_secret_key_here

# Let's Encrypt
CERTBOT_EMAIL=your_email@example.com

# CORS Origins
ALLOWED_ORIGINS=https://odostavka.online,https://admin.odostavka.online,https://api.odostavka.online
```

## 📋 Шаг 5: Настройка SSH ключей для GitHub Actions

```bash
# Создаем SSH ключ для GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions@odostavka.online" -f ~/.ssh/github_actions -N ""

# Добавляем публичный ключ в authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Показываем приватный ключ для GitHub Secrets
echo "=== ПРИВАТНЫЙ КЛЮЧ ДЛЯ GITHUB SECRETS ==="
cat ~/.ssh/github_actions
echo "=== КОНЕЦ ПРИВАТНОГО КЛЮЧА ==="
```

## 📋 Шаг 6: Настройка GitHub Secrets

1. **Перейдите в настройки репозитория:** https://github.com/PavelPanchenko/odostavka.online/settings/secrets/actions

2. **Добавьте следующие секреты:**
   - `SERVER_SSH_KEY` - приватный ключ из шага 5
   - `SERVER_USER` - `root`
   - `SERVER_HOST` - `83.217.223.185`
   - `SERVER_PATH` - `/opt/food-delivery`
   - `DOMAIN` - `odostavka.online`

## 📋 Шаг 7: Настройка DNS

Настройте DNS записи для ваших доменов:
```
A    odostavka.online        → 83.217.223.185
A    admin.odostavka.online  → 83.217.223.185
A    api.odostavka.online   → 83.217.223.185
```

## 📋 Шаг 8: Первый деплой

```bash
# Запускаем первый деплой
cd /opt/food-delivery
./deploy.sh
```

## 📋 Шаг 9: Проверка деплоя

После успешного деплоя проверьте:
- https://odostavka.online
- https://admin.odostavka.online
- https://api.odostavka.online

## 🔄 Автоматический деплой

После настройки GitHub Secrets, каждый push в main ветку будет автоматически развертывать изменения:

```bash
# С локальной машины
./manual-deploy.sh
```

## 🚨 Устранение неполадок

### Проблемы с SSL сертификатами
```bash
# Проверьте статус certbot
docker-compose logs certbot

# Принудительно получите сертификаты
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email your@email.com --agree-tos --no-eff-email -d odostavka.online -d admin.odostavka.online -d api.odostavka.online
```

### Проблемы с базой данных
```bash
# Проверьте подключение к БД
docker-compose exec postgres psql -U food_delivery_user -d food_delivery

# Выполните миграции
docker-compose exec api alembic upgrade head
```

### Проблемы с Nginx
```bash
# Проверьте конфигурацию
docker-compose exec nginx nginx -t

# Перезагрузите конфигурацию
docker-compose exec nginx nginx -s reload
```
