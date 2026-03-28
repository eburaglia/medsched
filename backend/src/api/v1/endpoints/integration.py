from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.schemas.integration import IntegrationResponse, IntegrationCreate
from src.models.integration import IntegrationConfig, IntegrationProvider
from src.api.deps import get_current_user, RoleChecker
from src.models.user import User

router = APIRouter(prefix="/integrations", tags=["Integrações Externas"])
require_admin = RoleChecker(["SUPER_ADMIN", "SYSTEM_ADMIN", "TENANT_ADMIN"])

@router.get("/", response_model=List[IntegrationResponse])
def get_integrations(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Retorna todas as configurações de integração da clínica atual."""
    return db.query(IntegrationConfig).filter(IntegrationConfig.tenant_id == current_user.tenant_id).all()

@router.put("/{provider}", response_model=IntegrationResponse)
def upsert_integration(
    provider: IntegrationProvider, 
    obj_in: IntegrationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    """Cria ou atualiza a configuração de um provedor específico (SMTP, WPP, Telegram)."""
    if provider != obj_in.provider:
        raise HTTPException(status_code=400, detail="Provedor na URL difere do corpo da requisição")

    config = db.query(IntegrationConfig).filter(
        IntegrationConfig.tenant_id == current_user.tenant_id,
        IntegrationConfig.provider == provider
    ).first()

    if config:
        # Atualiza existente
        config.config_data = obj_in.config_data
        config.ativo = obj_in.ativo
    else:
        # Cria nova
        config = IntegrationConfig(
            tenant_id=current_user.tenant_id,
            provider=provider,
            config_data=obj_in.config_data,
            ativo=obj_in.ativo
        )
        db.add(config)
    
    db.commit()
    db.refresh(config)
    return config
