# 📁 Инструкция по запуску контейнеров на сервере

## 🎯 **Правильная папка для запуска:**

**Папка проекта `odostavka.online`** - там, где находятся все необходимые файлы:

```
/opt/odostavka.online/          # Рекомендуемый путь
# или
/home/user/odostavka.online/     # Альтернативный путь
# или
/root/odostavka.online/         # Если работаете под root
```

## 📂 **Обязательная структура папок:**

```
/opt/odostavka.online/
├── docker-compose-db-api.yml    # Конфигурация БД + API
├── docker-compose-all.yml       # Конфигурация всех сервисов
├── env.example                  # Шаблон переменных окружения
├── .env                         # Ваши настройки (создается автоматически)
├── food-delivery-api/           # Папка с API
│   ├── Dockerfile
│   ├── main.py
│   └── ...
├── food-delivery-client/        # Папка с клиентом
│   ├── Dockerfile
│   ├── package.json
│   └── ...
├── nginx/                       # Конфигурация Nginx
│   ├── nginx.conf
│   └── conf.d/
└── setup-server.sh              # Скрипт настройки сервера
```

## 🚀 **Команды для настройки и запуска:**

### **1. Подготовка сервера:**
```bash
# Создать папку проекта
mkdir -p /opt/odostavka.online
cd /opt/odostavka.online

# Клонировать репозиторий
git clone https://github.com/your-username/O.Dostavka.git .

# Или скопировать файлы вручную
# scp -r /path/to/local/odostavka.online/* root@your-server:/opt/odostavka.online/
```

### **2. Настройка сервера:**
```bash
cd /opt/odostavka.online
./setup-server.sh
```

### **3. Запуск контейнеров:**

**Только БД + API:**
```bash
cd /opt/odostavka.online
./start-db-api.sh
```

**Все сервисы (БД + API + Клиент + Nginx):**
```bash
cd /opt/odostavka.online
./start-all.sh
```

## ⚠️ **Важные моменты:**

1. **Всегда запускайте команды из папки `odostavka.online`** - там, где находится `docker-compose-*.yml`

2. **Проверьте структуру папок:**
```bash
ls -la
# Должны быть видны:
# - docker-compose-db-api.yml
# - food-delivery-api/
# - food-delivery-client/
# - nginx/
```

3. **Настройте файл .env:**
```bash
nano .env
# Обязательно измените:
# - POSTGRES_PASSWORD
# - SECRET_KEY
# - CLIENT_API_URL
# - CLIENT_API_DOMAIN
```

## 🔍 **Проверка правильности папки:**

```bash
# Проверить, что мы в правильной папке
pwd
# Должно показать: /opt/odostavka.online

# Проверить наличие файлов
ls docker-compose-*.yml
# Должны быть: docker-compose-db-api.yml, docker-compose-all.yml

# Проверить папки сервисов
ls -d food-delivery-*/
# Должны быть: food-delivery-api/, food-delivery-client/
```

## 📋 **Итоговая последовательность:**

```bash
# 1. Подключиться к серверу
ssh root@your-server-ip

# 2. Создать папку и перейти в неё
mkdir -p /opt/odostavka.online
cd /opt/odostavka.online

# 3. Скопировать файлы проекта (любым способом)
# git clone, scp, rsync и т.д.

# 4. Настроить сервер
./setup-server.sh

# 5. Запустить контейнеры
./start-all.sh
```

## 🌐 **Доступные сервисы после запуска:**

- **Веб-приложение:** http://your-server-ip
- **API:** http://your-server-ip/api
- **PostgreSQL:** your-server-ip:5432
- **Redis:** your-server-ip:6379

**Главное правило:** Всегда запускайте Docker команды из папки `odostavka.online`, где находятся `docker-compose-*.yml` файлы!
