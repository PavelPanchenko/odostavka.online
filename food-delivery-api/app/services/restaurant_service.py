"""
Сервис для работы с ресторанами
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.restaurant import Restaurant, MenuItem, Category
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, MenuItemCreate, MenuItemUpdate


class RestaurantService:
    def __init__(self, db: Session):
        self.db = db

    async def get_restaurants(self, skip: int = 0, limit: int = 100) -> List[Restaurant]:
        """Получение списка ресторанов"""
        return self.db.query(Restaurant).filter(Restaurant.is_active == True).offset(skip).limit(limit).all()

    async def get_restaurant(self, restaurant_id: int) -> Optional[Restaurant]:
        """Получение ресторана по ID"""
        return self.db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()

    async def create_restaurant(self, restaurant: RestaurantCreate) -> Restaurant:
        """Создание нового ресторана"""
        db_restaurant = Restaurant(**restaurant.dict())
        self.db.add(db_restaurant)
        self.db.commit()
        self.db.refresh(db_restaurant)
        return db_restaurant

    async def update_restaurant(self, restaurant_id: int, restaurant_update: RestaurantUpdate) -> Optional[Restaurant]:
        """Обновление ресторана"""
        restaurant = self.db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
        if not restaurant:
            return None
        
        update_data = restaurant_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(restaurant, field, value)
        
        self.db.commit()
        self.db.refresh(restaurant)
        return restaurant

    async def get_restaurant_menu(self, restaurant_id: int) -> List[MenuItem]:
        """Получение меню ресторана"""
        return self.db.query(MenuItem).filter(
            MenuItem.restaurant_id == restaurant_id,
            MenuItem.is_available == True
        ).all()

    async def create_menu_item(self, restaurant_id: int, menu_item: MenuItemCreate) -> MenuItem:
        """Создание нового блюда в меню"""
        menu_item_data = menu_item.dict()
        menu_item_data["restaurant_id"] = restaurant_id
        db_menu_item = MenuItem(**menu_item_data)
        self.db.add(db_menu_item)
        self.db.commit()
        self.db.refresh(db_menu_item)
        return db_menu_item

    async def update_menu_item(self, menu_item_id: int, menu_item_update: MenuItemUpdate) -> Optional[MenuItem]:
        """Обновление блюда в меню"""
        menu_item = self.db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
        if not menu_item:
            return None
        
        update_data = menu_item_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(menu_item, field, value)
        
        self.db.commit()
        self.db.refresh(menu_item)
        return menu_item
