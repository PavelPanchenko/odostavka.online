# 🚀 Развертывание Food Delivery приложения

Этот документ описывает процесс развертывания приложения доставки еды с использованием Docker и Docker Compose.

## 📋 Требования

- Docker и Docker Compose
- Домен с настроенными DNS записями:
  - `odostavka.online` → IP сервера
  - `admin.odostavka.online` → IP сервера  
  - `api.odostavka.online` → IP сервера
- Email для Let's Encrypt сертификатов

## 🔧 Настройка

### 1. Клонирование и подготовка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd O.Dostavka

# Скопируйте файл конфигурации
cp env.example .env
```

### 2. Настройка переменных окружения

Отредактируйте файл `.env` в корне проекта:

```bash
nano .env
```

**Обязательные переменные:**
- `POSTGRES_PASSWORD` - пароль для PostgreSQL
- `SECRET_KEY` - секретный ключ для JWT токенов
- `CERTBOT_EMAIL` - email для Let's Encrypt

**Переменные базы данных (с значениями по умолчанию):**
- `POSTGRES_DB` - имя базы данных (по умолчанию: food_delivery)
- `POSTGRES_USER` - пользователь БД (по умолчанию: food_delivery_user)

**Дополнительные переменные:**
- `SMTP_*` - настройки почты (опционально)
- `TELEGRAM_*_BOT_TOKEN` - токены Telegram ботов (опционально)
- `ROBOKASSA_*` - настройки платежей

**Примечание:** API также может использовать свой собственный .env файл в папке `food-delivery-api/`. Если он существует, переменные из него будут иметь приоритет над переменными из корневого .env файла.

### 3. Настройка DNS

Убедитесь, что DNS записи указывают на ваш сервер:
```
A    odostavka.online        → YOUR_SERVER_IP
A    admin.odostavka.online  → YOUR_SERVER_IP
A    api.odostavka.online   → YOUR_SERVER_IP
```

## 🚀 Развертывание

### 🎯 Автоматическое развертывание через GitHub Actions

1. **Настройте сервер** (один раз):
   ```bash
   chmod +x setup-server.sh
   ./setup-server.sh <server_ip> <server_user> <server_path>
   ```

2. **Настройте GitHub Secrets** в настройках репозитория:
   - `SERVER_SSH_KEY` - приватный SSH ключ (см. GITHUB-SECRETS.md)
   - `SERVER_USER` - пользователь сервера
   - `SERVER_HOST` - IP адрес сервера
   - `SERVER_PATH` - путь к проекту на сервере
   - `DOMAIN` - ваш домен (опционально)
   
   📋 **Подробные инструкции:** см. файл `GITHUB-SECRETS.md`

3. **Деплой происходит автоматически** при push в main ветку!

### 🚀 Локальное развертывание

```bash
# Сделайте скрипты исполняемыми
chmod +x deploy.sh deploy-now.sh

# Автоматическое развертывание
./deploy.sh

# Или быстрое развертывание (если настроен .env)
./deploy-now.sh
```

### Ручное развертывание

```bash
# 1. Соберите образы
docker-compose build

# 2. Запустите базу данных и Redis
docker-compose up -d postgres redis

# 3. Дождитесь готовности БД (10-15 секунд)
sleep 15

# 4. Запустите API
docker-compose up -d api

# 5. Запустите веб-приложения
docker-compose up -d admin client

# 6. Получите SSL сертификаты
docker-compose run --rm certbot

# 7. Запустите Nginx
docker-compose up -d nginx
```

## 🔄 Обновление

### Обновление кода

```bash
# Остановите сервисы
docker-compose down

# Обновите код
git pull

# Пересоберите образы
docker-compose build

# Запустите заново
./deploy.sh
```

### Обновление сертификатов

```bash
# Автоматическое обновление
chmod +x update-certificates.sh
./update-certificates.sh

# Или вручную
docker-compose run --rm certbot renew
docker-compose restart nginx
```

## 📊 Мониторинг

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f api
docker-compose logs -f nginx
```

### Статус сервисов

```bash
docker-compose ps
```

### Перезапуск сервисов

```bash
# Все сервисы
docker-compose restart

# Конкретный сервис
docker-compose restart api
```

## 🔧 Настройка автоматического обновления сертификатов

Добавьте в crontab:

```bash
# Откройте crontab
crontab -e

# Добавьте строку для ежедневной проверки в 12:00
0 12 * * * /path/to/O.Dostavka/update-certificates.sh
```

## 🛠️ Устранение неполадок

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

# Выполните миграции (если нужно)
docker-compose exec api alembic upgrade head
```

### Проблемы с Nginx

```bash
# Проверьте конфигурацию
docker-compose exec nginx nginx -t

# Перезагрузите конфигурацию
docker-compose exec nginx nginx -s reload
```

## 📁 Структура файлов

```
O.Dostavka/
├── docker-compose.yml          # Основной файл Docker Compose
├── env.example                 # Пример переменных окружения
├── deploy.sh                   # Скрипт развертывания
├── update-certificates.sh      # Скрипт обновления сертификатов
├── nginx/
│   ├── nginx.conf              # Основная конфигурация Nginx
│   └── conf.d/
│       └── default.conf        # Конфигурация виртуальных хостов
├── food-delivery-api/
│   └── Dockerfile              # Dockerfile для API
├── food-delivery-admin/
│   └── Dockerfile              # Dockerfile для админки
└── food-delivery-client/
    └── Dockerfile              # Dockerfile для клиента
```

## 🌐 Доступные адреса

После успешного развертывания приложение будет доступно по адресам:

- **Клиент**: https://odostavka.online
- **Админка**: https://admin.odostavka.online  
- **API**: https://api.odostavka.online

## 🔒 Безопасность

- Все соединения защищены SSL/TLS сертификатами
- Настроены заголовки безопасности
- Ограничена скорость запросов (rate limiting)
- Используются не-root пользователи в контейнерах
