## O.Dostavka — монорепозиторий

В репозитории три приложения:

- `food-delivery-api` — FastAPI backend
- `food-delivery-client` — Next.js клиент
- `food-delivery-admin` — Next.js админка

### Требования

- Node.js 18+ и npm/pnpm/yarn
- Python 3.12+

### Быстрый старт (локально)

1) Backend (FastAPI)

```bash
cd food-delivery-api
pip install uv
uv sync
cp .env.example .env  # создайте и заполните при необходимости
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2) Клиент

```bash
cd food-delivery-client
npm install
cp .env.example .env.local  # создайте и заполните при необходимости
npm run dev
```

3) Админка

```bash
cd food-delivery-admin
npm install
cp .env.example .env.local  # создайте и заполните при необходимости
npm run dev
```

### Переменные окружения

Backend (`food-delivery-api/app/core/config.py` подхватывает `.env`):

- `DATABASE_URL` — строка подключения к БД (по умолчанию SQLite `sqlite:///./food_delivery.db`)
- `REDIS_URL` — URL Redis (по умолчанию `redis://localhost:6379`)
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- Robokassa: `ROBOKASSA_MERCHANT_LOGIN`, `ROBOKASSA_PASSWORD1`, `ROBOKASSA_PASSWORD2`, `ROBOKASSA_TEST_MODE`, `ROBOKASSA_RESULT_URL`, `ROBOKASSA_SUCCESS_URL`, `ROBOKASSA_FAIL_URL`
- CORS: `ALLOWED_ORIGINS` (список)
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_USE_TLS`, `SMTP_USE_SSL`
- Telegram (опционально): `TELEGRAM_CLIENT_BOT_TOKEN`, `TELEGRAM_COURIER_BOT_TOKEN`, `TELEGRAM_ADMIN_BOT_TOKEN`

Client (`food-delivery-client`):

- `NEXT_PUBLIC_API_URL` — базовый URL API (например `http://localhost:8000`)
- `NEXT_PUBLIC_APP_URL` — внешний URL приложения (для sitemap)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_YM_ID` (аналитика — опционально)
- `AUTH_SECRET` (используется NextAuth)

Admin (`food-delivery-admin`):

- `NEXT_PUBLIC_API_URL` — базовый URL API

### Полезно

- Документация API доступна на `/docs` (например `http://localhost:8000/docs`).
- Старые миграции вынесены во внешние скрипты в корне `food-delivery-api`.

### PostgreSQL (переход с SQLite)

1) Установите PostgreSQL локально и создайте БД:

```bash
createdb odostavka
```

2) Сконфигурируйте `.env` для API:

```bash
cd food-delivery-api
cp .env.example .env
# при необходимости поменяйте DATABASE_URL, логин/пароль/хост/порт
```

3) Установите зависимости и запустите API:

```bash
pip install uv
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4) Создайте таблицы и тестовые данные (скрипт `init_db.py`):

```bash
uv run python app/db/init_db.py
```

### Лицензия

Private.


# Test commit
