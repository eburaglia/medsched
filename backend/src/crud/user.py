from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from src.core.security import get_password_hash
from src.models.user import User
from src.schemas.user import UserCreate, UserUpdate

# ---------------------------------------------------------
# 🛡️ IMPORTANTE: Módulo de Segurança
# Assumimos que você terá uma função para gerar o hash da senha.
# Caso ainda não tenha o arquivo security.py, usaremos um placeholder.
# from src.core.security import get_password_hash
# ---------------------------------------------------------
def mock_password_hash(password: str) -> str:
    """Função temporária até criarmos o módulo de segurança real"""
    return f"hashed_{password}_123xyz"


# ---------------------------------------------------------
# 🔍 LEITURA (READ) - Sempre isolado por Tenant!
# ---------------------------------------------------------
def get_user_by_id(db: Session, user_id: UUID, tenant_id: UUID) -> Optional[User]:
    """Busca um usuário garantindo que ele pertence ao Tenant atual"""
    return db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Busca por e-mail (Global). 
    Útil para o momento do Login, onde ainda não sabemos o tenant do usuário.
    """
    return db.query(User).filter(User.email == email).first()

def get_users_by_tenant(db: Session, tenant_id: UUID, skip: int = 0, limit: int = 100) -> List[User]:
    """Lista todos os usuários de uma clínica específica (Paginação básica)"""
    return db.query(User).filter(User.tenant_id == tenant_id).offset(skip).limit(limit).all()


# ---------------------------------------------------------
# ✍️ CRIAÇÃO (CREATE)
# ---------------------------------------------------------
def create_user(db: Session, obj_in: UserCreate) -> User:
    """Cria um novo usuário aplicando hash na senha"""
    # 1. Extraímos os dados validados pelo Pydantic, ignorando a senha em texto plano
    obj_data = obj_in.model_dump(exclude={"senha"})
    
    # 2. Geramos o hash de segurança (Substituir pela função real depois)
    #senha_criptografada = mock_password_hash(obj_in.senha) - linha descontinuada
    senha_criptografada = get_password_hash(obj_in.senha)
    obj_data["senha_hash"] = senha_criptografada
    
    # 3. Criamos a instância do modelo e salvamos no banco
    db_user = User(**obj_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


# ---------------------------------------------------------
# 🔄 ATUALIZAÇÃO (UPDATE)
# ---------------------------------------------------------
def update_user(db: Session, db_user: User, obj_in: UserUpdate) -> User:
    """Atualiza apenas os campos permitidos e fornecidos na requisição"""
    # Transformamos os dados que chegaram em um dicionário, excluindo campos nulos
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # Aplicamos as mudanças no objeto do banco de dados
    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


# ---------------------------------------------------------
# ❌ EXCLUSÃO (DELETE) / INATIVAÇÃO
# ---------------------------------------------------------
# Nota do Arquiteto: Geralmente, não deletamos usuários fisicamente (Soft Delete).
# Em vez disso, mudamos o status para INATIVO. Mas deixo a função de exclusão real aqui caso seja o requisito.
def delete_user(db: Session, user_id: UUID, tenant_id: UUID) -> bool:
    """Remove um usuário fisicamente, garantindo isolamento de tenant"""
    db_user = get_user_by_id(db=db, user_id=user_id, tenant_id=tenant_id)
    if not db_user:
        return False
        
    db.delete(db_user)
    db.commit()
    return True
