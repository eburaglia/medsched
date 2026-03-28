from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from src.database import get_db
from src.schemas.notification import TemplateResponse, TemplateUpdate, TemplateCreate, NotificationLogResponse, NotificationHistoryResponse
from src.models.notification import NotificationTemplate, NotificationLog, NotificationChannel
from src.api.deps import get_current_user, RoleChecker
from src.models.user import User

router = APIRouter(prefix="/notifications", tags=["Mensageria e Notificações"])
require_config_access = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN", "GESTOR"])

# --- ROTAS DE TEMPLATES ---
@router.get("/templates", response_model=List[TemplateResponse])
def get_templates(db: Session = Depends(get_db), current_user: User = Depends(require_config_access)):
    templates_sistema = db.query(NotificationTemplate).filter(NotificationTemplate.tenant_id.is_(None)).all()
    templates_tenant = db.query(NotificationTemplate).filter(NotificationTemplate.tenant_id == current_user.tenant_id).all()
    codigos_customizados = {t.codigo_interno for t in templates_tenant}
    return templates_tenant + [t for t in templates_sistema if t.codigo_interno not in codigos_customizados]

@router.post("/templates", response_model=TemplateResponse)
def create_template(obj_in: TemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(require_config_access)):
    novo = NotificationTemplate(
        tenant_id=current_user.tenant_id, codigo_interno=obj_in.codigo_interno,
        nome=obj_in.nome, canal=obj_in.canal, assunto=obj_in.assunto,
        conteudo=obj_in.conteudo, ativo=obj_in.ativo
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@router.put("/templates/{template_id}", response_model=TemplateResponse)
def update_template(template_id: UUID, obj_in: TemplateUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_config_access)):
    template = db.query(NotificationTemplate).filter(NotificationTemplate.id == template_id).first()
    if not template: raise HTTPException(status_code=404, detail="Template não encontrado")
    papel_atual = current_user.papel.value if hasattr(current_user.papel, 'value') else current_user.papel

    if template.tenant_id is None and papel_atual not in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        clone = NotificationTemplate(
            tenant_id=current_user.tenant_id, codigo_interno=template.codigo_interno,
            nome=obj_in.nome or template.nome, canal=template.canal,
            assunto=obj_in.assunto if obj_in.assunto is not None else template.assunto,
            conteudo=obj_in.conteudo or template.conteudo,
            ativo=obj_in.ativo if obj_in.ativo is not None else template.ativo
        )
        db.add(clone)
        db.commit()
        db.refresh(clone)
        return clone

    for var, value in vars(obj_in).items():
        if value is not None: setattr(template, var, value)
    db.commit()
    db.refresh(template)
    return template

@router.post("/templates/seed", response_model=TemplateResponse)
def seed_template(obj_in: TemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN"]))):
    novo = NotificationTemplate(**obj_in.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

# --- ROTAS IN-APP E HISTÓRICO ---
@router.get("/in-app", response_model=List[NotificationLogResponse])
def get_in_app_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(NotificationLog).filter(
        NotificationLog.destinatario_id == current_user.id,
        NotificationLog.canal == NotificationChannel.IN_APP
    ).order_by(NotificationLog.criado_em.desc()).limit(30).all()

@router.put("/in-app/{log_id}/read")
def mark_as_read(log_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(NotificationLog).filter(NotificationLog.id == log_id, NotificationLog.destinatario_id == current_user.id).first()
    if not log: raise HTTPException(status_code=404, detail="Notificação não encontrada")
    log.lida = True
    log.lido_em = datetime.utcnow()
    db.commit()
    return {"status": "ok"}

# 👇 DRCODE: ROTA PARA BUSCAR O HISTÓRICO DO CLIENTE
@router.get("/history/customer/{customer_id}", response_model=List[NotificationHistoryResponse])
def get_customer_history(customer_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retorna todo o histórico de comunicação (Logs) de um cliente específico."""
    return db.query(NotificationLog).filter(
        NotificationLog.customer_id == customer_id,
        NotificationLog.tenant_id == current_user.tenant_id
    ).order_by(NotificationLog.criado_em.desc()).limit(50).all()
