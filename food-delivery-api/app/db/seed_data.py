"""
Заполнение базы данных тестовыми данными
"""
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.models.restaurant import Restaurant, Category, MenuItem
from app.models.product import Product, ProductCategory
from app.services.auth_service import AuthService


async def create_test_data():
    """Создание тестовых данных"""
    db = SessionLocal()
    auth_service = AuthService(db)
    
    try:
        # Создание тестового пользователя
        test_user = db.query(User).filter(User.username == "testuser").first()
        if not test_user:
            # Создаем пользователя с правильным хешем
            hashed_password = auth_service.get_password_hash("123")
            test_user = User(
                email="test@example.com",
                username="testuser",
                hashed_password=hashed_password,
                full_name="Тестовый Пользователь",
                phone="+7-999-123-45-67"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Создан пользователь: {test_user.username}")
        
        # Создание тестового ресторана
        test_restaurant = db.query(Restaurant).filter(Restaurant.name == "Пиццерия Мама Миа").first()
        if not test_restaurant:
            test_restaurant = Restaurant(
                name="Пиццерия Мама Миа",
                description="Лучшая пицца в городе! Готовим из свежих ингредиентов.",
                address="ул. Пушкина, д. 1",
                phone="+7-495-123-45-67",
                email="info@mamamia.ru",
                latitude=55.7558,
                longitude=37.6176,
                delivery_fee=150.0,
                minimum_order=500.0,
                owner_id=test_user.id
            )
            db.add(test_restaurant)
            db.commit()
            db.refresh(test_restaurant)
            print(f"Создан ресторан: {test_restaurant.name}")
        
        # Создание категорий
        categories_data = [
            {"name": "Пицца", "description": "Классическая итальянская пицца"},
            {"name": "Паста", "description": "Макаронные изделия с различными соусами"},
            {"name": "Салаты", "description": "Свежие овощные салаты"},
            {"name": "Напитки", "description": "Безалкогольные напитки"}
        ]
        
        for cat_data in categories_data:
            category = db.query(Category).filter(
                Category.name == cat_data["name"],
                Category.restaurant_id == test_restaurant.id
            ).first()
            
            if not category:
                category = Category(
                    name=cat_data["name"],
                    description=cat_data["description"],
                    restaurant_id=test_restaurant.id
                )
                db.add(category)
                db.commit()
                db.refresh(category)
                print(f"Создана категория: {category.name}")
        
        # Создание блюд
        menu_items_data = [
            # Пицца
            {"name": "Маргарита", "description": "Томаты, моцарелла, базилик", "price": 450.0, "category": "Пицца"},
            {"name": "Пепперони", "description": "Пикантная колбаса, моцарелла, томаты", "price": 550.0, "category": "Пицца"},
            {"name": "Четыре сыра", "description": "Моцарелла, горгонзола, пармезан, рикотта", "price": 600.0, "category": "Пицца"},
            
            # Паста
            {"name": "Карбонара", "description": "Спагетти с беконом и сливочным соусом", "price": 380.0, "category": "Паста"},
            {"name": "Болоньезе", "description": "Спагетти с мясным соусом", "price": 420.0, "category": "Паста"},
            
            # Салаты
            {"name": "Цезарь", "description": "Салат с курицей, сыром и сухариками", "price": 320.0, "category": "Салаты"},
            {"name": "Греческий", "description": "Свежие овощи с фетой и оливками", "price": 280.0, "category": "Салаты"},
            
            # Напитки
            {"name": "Кока-Кола", "description": "Газированный напиток 0.5л", "price": 120.0, "category": "Напитки"},
            {"name": "Сок апельсиновый", "description": "Свежевыжатый сок 0.3л", "price": 150.0, "category": "Напитки"},
        ]
        
        for item_data in menu_items_data:
            # Находим категорию
            category = db.query(Category).filter(
                Category.name == item_data["category"],
                Category.restaurant_id == test_restaurant.id
            ).first()
            
            if category:
                menu_item = db.query(MenuItem).filter(
                    MenuItem.name == item_data["name"],
                    MenuItem.restaurant_id == test_restaurant.id
                ).first()
                
                if not menu_item:
                    menu_item = MenuItem(
                        name=item_data["name"],
                        description=item_data["description"],
                        price=item_data["price"],
                        restaurant_id=test_restaurant.id,
                        category_id=category.id,
                        preparation_time=15
                    )
                    db.add(menu_item)
                    db.commit()
                    print(f"Создано блюдо: {menu_item.name}")
        
        # Создание категорий продуктов
        product_categories_data = [
            {"name": "Молочные продукты", "description": "Молоко, сыр, йогурт"},
            {"name": "Хлеб и выпечка", "description": "Хлеб, булочки, печенье"},
            {"name": "Мясо и птица", "description": "Говядина, свинина, курица"},
            {"name": "Овощи и фрукты", "description": "Свежие овощи и фрукты"},
            {"name": "Напитки", "description": "Соки, вода, газировка"},
            {"name": "Консервы", "description": "Консервированные продукты"}
        ]
        
        for cat_data in product_categories_data:
            category = db.query(ProductCategory).filter(
                ProductCategory.name == cat_data["name"]
            ).first()
            
            if not category:
                category = ProductCategory(
                    name=cat_data["name"],
                    description=cat_data["description"]
                )
                db.add(category)
                db.commit()
                db.refresh(category)
                print(f"Создана категория продуктов: {category.name}")
        
        # Создание продуктов
        products_data = [
            # Молочные продукты
            {"name": "Молоко 3.2% 1л", "price": 89.0, "weight": "1л", "brand": "Простоквашино", "category": "Молочные продукты"},
            {"name": "Сыр Российский 200г", "price": 180.0, "weight": "200г", "brand": "Вкуснотеево", "category": "Молочные продукты"},
            {"name": "Йогурт натуральный 500г", "price": 120.0, "weight": "500г", "brand": "Активия", "category": "Молочные продукты"},
            
            # Хлеб и выпечка
            {"name": "Хлеб Бородинский", "price": 45.0, "weight": "400г", "brand": "Хлебный дом", "category": "Хлеб и выпечка"},
            {"name": "Булочки с маком 4шт", "price": 85.0, "weight": "200г", "brand": "Пекарня №1", "category": "Хлеб и выпечка"},
            
            # Мясо и птица
            {"name": "Курица целая 1.5кг", "price": 320.0, "weight": "1.5кг", "brand": "Петелинка", "category": "Мясо и птица"},
            {"name": "Говядина вырезка 1кг", "price": 650.0, "weight": "1кг", "brand": "Мираторг", "category": "Мясо и птица"},
            
            # Овощи и фрукты
            {"name": "Картофель 2кг", "price": 120.0, "weight": "2кг", "brand": "Фермер", "category": "Овощи и фрукты"},
            {"name": "Яблоки красные 1кг", "price": 180.0, "weight": "1кг", "brand": "Семейные сады", "category": "Овощи и фрукты"},
            {"name": "Бананы 1кг", "price": 150.0, "weight": "1кг", "brand": "Эквадор", "category": "Овощи и фрукты"},
            
            # Напитки
            {"name": "Вода минеральная 1.5л", "price": 45.0, "weight": "1.5л", "brand": "Боржоми", "category": "Напитки"},
            {"name": "Сок апельсиновый 1л", "price": 120.0, "weight": "1л", "brand": "Добрый", "category": "Напитки"},
            
            # Консервы
            {"name": "Тушенка говяжья 325г", "price": 180.0, "weight": "325г", "brand": "Гродфуд", "category": "Консервы"},
            {"name": "Горошек зеленый 400г", "price": 65.0, "weight": "400г", "brand": "Бондюэль", "category": "Консервы"},
        ]
        
        for product_data in products_data:
            # Находим категорию
            category = db.query(ProductCategory).filter(
                ProductCategory.name == product_data["category"]
            ).first()
            
            if category:
                product = db.query(Product).filter(
                    Product.name == product_data["name"]
                ).first()
                
                if not product:
                    product = Product(
                        name=product_data["name"],
                        price=product_data["price"],
                        weight=product_data["weight"],
                        brand=product_data["brand"],
                        category_id=category.id,
                        stock_quantity=100
                    )
                    db.add(product)
                    db.commit()
                    print(f"Создан продукт: {product.name}")
        
        print("Тестовые данные созданы успешно!")
        
    except Exception as e:
        print(f"Ошибка при создании тестовых данных: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_test_data()
