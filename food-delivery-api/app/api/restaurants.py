"""
API для управления ресторанами и меню
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.restaurant import Restaurant, RestaurantCreate, RestaurantUpdate, MenuItem, MenuItemCreate, MenuItemUpdate
from app.services.restaurant_service import RestaurantService

router = APIRouter()


@router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получение списка ресторанов"""
    restaurant_service = RestaurantService(db)
    return await restaurant_service.get_restaurants(skip=skip, limit=limit)


@router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    """Получение информации о ресторане"""
    restaurant_service = RestaurantService(db)
    restaurant = await restaurant_service.get_restaurant(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    return restaurant


@router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(restaurant: RestaurantCreate, db: Session = Depends(get_db)):
    """Создание нового ресторана"""
    restaurant_service = RestaurantService(db)
    return await restaurant_service.create_restaurant(restaurant)


@router.put("/restaurants/{restaurant_id}", response_model=Restaurant)
async def update_restaurant(
    restaurant_id: int,
    restaurant_update: RestaurantUpdate,
    db: Session = Depends(get_db)
):
    """Обновление информации о ресторане"""
    restaurant_service = RestaurantService(db)
    restaurant = await restaurant_service.update_restaurant(restaurant_id, restaurant_update)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    return restaurant


@router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItem])
async def get_restaurant_menu(restaurant_id: int, db: Session = Depends(get_db)):
    """Получение меню ресторана"""
    restaurant_service = RestaurantService(db)
    return await restaurant_service.get_restaurant_menu(restaurant_id)


@router.post("/restaurants/{restaurant_id}/menu", response_model=MenuItem)
async def create_menu_item(
    restaurant_id: int,
    menu_item: MenuItemCreate,
    db: Session = Depends(get_db)
):
    """Добавление блюда в меню ресторана"""
    restaurant_service = RestaurantService(db)
    return await restaurant_service.create_menu_item(restaurant_id, menu_item)


@router.put("/menu/{menu_item_id}", response_model=MenuItem)
async def update_menu_item(
    menu_item_id: int,
    menu_item_update: MenuItemUpdate,
    db: Session = Depends(get_db)
):
    """Обновление информации о блюде"""
    restaurant_service = RestaurantService(db)
    menu_item = await restaurant_service.update_menu_item(menu_item_id, menu_item_update)
    if not menu_item:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    return menu_item
