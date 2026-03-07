from sqlalchemy.orm import Session
from src.models.super_admin import SuperAdmin

def get_super_admin_by_email(db: Session, email: str):
    return db.query(SuperAdmin).filter(SuperAdmin.email == email).first()
