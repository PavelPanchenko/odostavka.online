from sqlalchemy.orm import Session
from app.models.delivery_settings import DeliverySettings
from app.schemas.delivery_settings import DeliveryCostCalculation
from typing import Optional
import json
from datetime import datetime, time

class DeliveryService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_delivery_settings(self) -> Optional[DeliverySettings]:
        """Получить текущие настройки доставки"""
        return self.db.query(DeliverySettings).order_by(DeliverySettings.created_at.desc()).first()
    
    def calculate_delivery_cost(self, order_amount: float, delivery_zone: Optional[str] = None) -> DeliveryCostCalculation:
        """Рассчитать стоимость доставки для заказа"""
        settings = self.get_delivery_settings()
        
        if not settings or not settings.is_delivery_available:
            return DeliveryCostCalculation(
                order_amount=order_amount,
                delivery_zone=delivery_zone,
                delivery_cost=0,
                is_free_delivery=True,
                delivery_time="Доставка недоступна"
            )
        
        # Определяем порог для бесплатной доставки
        free_delivery_threshold = settings.free_delivery_threshold
        
        # Если есть зоны доставки, проверяем индивидуальный порог зоны
        if delivery_zone and settings.delivery_zones:
            try:
                zones = json.loads(settings.delivery_zones)
                if delivery_zone in zones:
                    zone_data = zones[delivery_zone]
                    # Если у зоны есть свой порог бесплатной доставки, используем его
                    if 'free_delivery_threshold' in zone_data and zone_data['free_delivery_threshold'] is not None:
                        free_delivery_threshold = zone_data['free_delivery_threshold']
            except (json.JSONDecodeError, KeyError):
                pass  # Используем глобальный порог
        
        # Проверяем бесплатную доставку
        # Если free_delivery_threshold равен 0, то бесплатная доставка отключена
        is_free_delivery = free_delivery_threshold > 0 and order_amount >= free_delivery_threshold
        
        if is_free_delivery:
            delivery_cost = 0
        else:
            # Базовая стоимость доставки
            delivery_cost = settings.base_delivery_cost
            
            # Если есть зоны доставки, применяем стоимость зоны
            if delivery_zone and settings.delivery_zones:
                try:
                    zones = json.loads(settings.delivery_zones)
                    if delivery_zone in zones:
                        zone_cost = zones[delivery_zone].get('cost', settings.base_delivery_cost)
                        delivery_cost = zone_cost
                except (json.JSONDecodeError, KeyError):
                    pass  # Используем базовую стоимость
        
        # Формируем время доставки
        delivery_time = f"{settings.delivery_time_min}-{settings.delivery_time_max} мин"
        
        return DeliveryCostCalculation(
            order_amount=order_amount,
            delivery_zone=delivery_zone,
            delivery_cost=delivery_cost,
            is_free_delivery=is_free_delivery,
            delivery_time=delivery_time,
            free_delivery_threshold=free_delivery_threshold if free_delivery_threshold > 0 else None
        )
    
    def is_delivery_available_now(self) -> bool:
        """Проверить, доступна ли доставка сейчас"""
        settings = self.get_delivery_settings()
        
        if not settings or not settings.is_delivery_available:
            return False
        
        # Проверяем рабочие часы
        if settings.delivery_working_hours:
            try:
                working_hours_data = json.loads(settings.delivery_working_hours)
                
                # Если режим 24/7, доставка всегда доступна
                if working_hours_data.get('is24_7', False):
                    return True
                
                # Получаем текущий день недели
                current_day = datetime.now().strftime('%A').lower()
                day_mapping = {
                    'monday': 'monday',
                    'tuesday': 'tuesday', 
                    'wednesday': 'wednesday',
                    'thursday': 'thursday',
                    'friday': 'friday',
                    'saturday': 'saturday',
                    'sunday': 'sunday'
                }
                
                current_day_en = day_mapping.get(current_day, 'monday')
                days = working_hours_data.get('days', {})
                
                if current_day_en in days:
                    day_config = days[current_day_en]
                    
                    # Если день отключен
                    if not day_config.get('enabled', True):
                        return False
                    
                    # Проверяем время
                    start_time = day_config.get('start', '09:00')
                    end_time = day_config.get('end', '22:00')
                    current_time = datetime.now().time()
                    
                    start = datetime.strptime(start_time, "%H:%M").time()
                    end = datetime.strptime(end_time, "%H:%M").time()
                    
                    return start <= current_time <= end
                        
            except (json.JSONDecodeError, ValueError, KeyError):
                pass  # Если ошибка парсинга, считаем что доставка доступна
        
        return True
    
    def get_delivery_zones(self) -> dict:
        """Получить доступные зоны доставки"""
        settings = self.get_delivery_settings()
        
        if not settings or not settings.delivery_zones:
            return {}
        
        try:
            zones = json.loads(settings.delivery_zones)
            # Проверяем, что это словарь, а не список или строка
            if isinstance(zones, dict):
                return zones
            return {}
        except (json.JSONDecodeError, TypeError, ValueError):
            return {}
    
    def update_delivery_settings(self, settings_data: dict, admin_id: int) -> DeliverySettings:
        """Обновить настройки доставки"""
        existing_settings = self.get_delivery_settings()
        
        # Обрабатываем JSON поля
        processed_data = {}
        for key, value in settings_data.items():
            if key in ['delivery_zones', 'delivery_working_hours'] and value is not None:
                # Преобразуем dict в JSON строку
                processed_data[key] = json.dumps(value, ensure_ascii=False)
            else:
                processed_data[key] = value
        
        if existing_settings:
            # Обновляем существующие настройки
            for key, value in processed_data.items():
                if not hasattr(existing_settings, key):
                    continue
                # Не затираем delivery_zones пустыми значениями
                if key == 'delivery_zones' and (value is None or value == '' or value == '{}'):
                    continue
                if value is not None:
                    setattr(existing_settings, key, value)
            existing_settings.created_by = admin_id
            self.db.commit()
            self.db.refresh(existing_settings)
            return existing_settings
        else:
            # Создаем новые настройки
            new_settings = DeliverySettings(
                **processed_data,
                created_by=admin_id
            )
            self.db.add(new_settings)
            self.db.commit()
            self.db.refresh(new_settings)
            return new_settings
    
    def create_delivery_zone(self, zone_data: dict) -> dict:
        """Создать новую зону доставки"""
        settings = self.get_delivery_settings()
        if not settings:
            raise ValueError("Настройки доставки не найдены")
        
        # Получаем существующие зоны
        zones_dict = self.get_delivery_zones()
        
        # Генерируем ID для новой зоны
        zone_id = f"zone_{len(zones_dict) + 1}"
        
        # Добавляем новую зону
        zones_dict[zone_id] = {
            "name": zone_data.get("name", ""),
            "cost": zone_data.get("cost", 0),
            "min_order_amount": zone_data.get("min_order_amount", 0),
            "free_delivery_threshold": zone_data.get("free_delivery_threshold", 0),
            "delivery_time": zone_data.get("delivery_time", "30-60 мин"),
            "radius": zone_data.get("radius", 5)
        }
        
        # Сохраняем
        settings.delivery_zones = json.dumps(zones_dict, ensure_ascii=False)
        self.db.commit()
        
        return {
            "id": zone_id,
            **zones_dict[zone_id]
        }
    
    def update_delivery_zone(self, zone_id: str, zone_data: dict) -> dict:
        """Обновить зону доставки"""
        settings = self.get_delivery_settings()
        if not settings:
            raise ValueError("Настройки доставки не найдены")
        
        zones_dict = self.get_delivery_zones()
        
        if zone_id not in zones_dict:
            return None
        
        # Обновляем зону
        zones_dict[zone_id].update({
            "name": zone_data.get("name", zones_dict[zone_id].get("name", "")),
            "cost": zone_data.get("cost", zones_dict[zone_id].get("cost", 0)),
            "min_order_amount": zone_data.get("min_order_amount", zones_dict[zone_id].get("min_order_amount", 0)),
            "free_delivery_threshold": zone_data.get("free_delivery_threshold", zones_dict[zone_id].get("free_delivery_threshold", 0)),
            "delivery_time": zone_data.get("delivery_time", zones_dict[zone_id].get("delivery_time", "30-60 мин")),
            "radius": zone_data.get("radius", zones_dict[zone_id].get("radius", 5))
        })
        
        # Сохраняем
        settings.delivery_zones = json.dumps(zones_dict, ensure_ascii=False)
        self.db.commit()
        
        return {
            "id": zone_id,
            **zones_dict[zone_id]
        }
    
    def delete_delivery_zone(self, zone_id: str) -> bool:
        """Удалить зону доставки"""
        settings = self.get_delivery_settings()
        if not settings:
            return False
        
        zones_dict = self.get_delivery_zones()
        
        if zone_id not in zones_dict:
            return False
        
        # Удаляем зону
        del zones_dict[zone_id]
        
        # Сохраняем
        settings.delivery_zones = json.dumps(zones_dict, ensure_ascii=False)
        self.db.commit()
        
        return True
    
    def create_delivery_settings(self, settings_data: dict) -> DeliverySettings:
        """Создать настройки доставки"""
        # Используем тот же метод update_delivery_settings
        return self.update_delivery_settings(settings_data, admin_id=1)