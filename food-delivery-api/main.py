"""
Главный файл приложения Food Delivery API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, restaurants, orders, users, products, favorites, payments, delivery, support, admin

# Создание приложения FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API для приложения доставки продуктов"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth.router, prefix=f"{settings.api_v1_prefix}/auth", tags=["auth"])
app.include_router(users.router, prefix=settings.api_v1_prefix, tags=["users"])
app.include_router(restaurants.router, prefix=settings.api_v1_prefix, tags=["restaurants"])
app.include_router(orders.router, prefix=f"{settings.api_v1_prefix}/orders", tags=["orders"])
app.include_router(products.router, prefix=f"{settings.api_v1_prefix}/products", tags=["products"])
app.include_router(favorites.router, prefix=f"{settings.api_v1_prefix}/favorites", tags=["favorites"])
app.include_router(payments.router, prefix=f"{settings.api_v1_prefix}/payments", tags=["payments"])
app.include_router(delivery.router, prefix=settings.api_v1_prefix, tags=["delivery"])
app.include_router(support.router, prefix=settings.api_v1_prefix, tags=["support"])
app.include_router(admin.router, prefix=f"{settings.api_v1_prefix}/admin", tags=["admin"])


@app.get("/")
async def root():
    """Корневой endpoint"""
    return {
        "message": "Добро пожаловать в Food Delivery API!",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/api/v1/")
async def api_root():
    """Корневой API endpoint"""
    return {
        "message": "Food Delivery API v1",
        "version": settings.app_version,
        "endpoints": {
            "auth": "/api/v1/auth",
            "users": "/api/v1/users", 
            "restaurants": "/api/v1/restaurants",
            "orders": "/api/v1/orders",
            "products": "/api/v1/products",
            "favorites": "/api/v1/favorites",
            "payments": "/api/v1/payments",
            "delivery": "/api/v1/delivery",
            "support": "/api/v1/support",
            "admin": "/api/v1/admin"
        }
    }
# Миграции убраны из кода. Используйте внешние скрипты/алембик перед запуском приложения.



@app.get("/api/v1/categories")
async def get_categories_legacy():
    """Legacy endpoint для категорий (перенаправление на products/categories)"""
    from fastapi import Request
    from fastapi.responses import RedirectResponse
    
    # Перенаправляем на правильный endpoint
    return RedirectResponse(url="/api/v1/products/categories", status_code=301)


@app.get("/health")
async def health_check():
    """Проверка здоровья приложения"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
