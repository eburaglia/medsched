from sqlalchemy.orm import Session
from uuid import UUID
from src.models.holiday import Holiday
from src.schemas.holiday import HolidayCreate, HolidayUpdate

def create_holiday(db: Session, obj_in: HolidayCreate) -> Holiday:
    db_obj = Holiday(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_holidays_by_tenant(db: Session, tenant_id: UUID):
    return db.query(Holiday).filter(Holiday.tenant_id == tenant_id).order_by(Holiday.data.asc()).all()

def get_holiday_by_id(db: Session, holiday_id: UUID, tenant_id: UUID) -> Holiday:
    return db.query(Holiday).filter(Holiday.id == holiday_id, Holiday.tenant_id == tenant_id).first()

def update_holiday(db: Session, db_obj: Holiday, obj_in: HolidayUpdate) -> Holiday:
    update_data = obj_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_holiday(db: Session, db_obj: Holiday):
    db.delete(db_obj)
    db.commit()
