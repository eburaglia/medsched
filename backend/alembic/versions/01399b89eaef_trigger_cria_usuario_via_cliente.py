"""trigger_cria_usuario_via_cliente

Revision ID: 01399b89eaef
Revises: 6361239390ec
Create Date: 2026-03-27 19:44:56.566311

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '01399b89eaef'
down_revision: Union[str, None] = '6361239390ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Cria a função da Trigger com validações e Casts explícitos para o PostgreSQL
    op.execute("""
    CREATE OR REPLACE FUNCTION trg_cria_usuario_cliente()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Só cria o usuário se o cliente tiver um e-mail preenchido e não existir na base de usuários
        IF NEW.email IS NOT NULL AND TRIM(NEW.email) <> '' THEN
            IF NOT EXISTS (SELECT 1 FROM users WHERE email = NEW.email) THEN
                INSERT INTO users (
                    id,
                    tenant_id,
                    status,
                    papel,
                    nome,
                    email,
                    cpf,
                    telefone,
                    senha_hash,
                    criado_em
                ) VALUES (
                    gen_random_uuid(),
                    NEW.tenant_id,
                    'ATIVO'::userstatus,
                    'CLIENTE'::userrole,
                    NEW.nome,
                    NEW.email,
                    NEW.cpf_cnpj,
                    NEW.telefone,
                    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQ68YhXI', -- Hash BCrypt da senha '123456'
                    CURRENT_TIMESTAMP
                );
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 2. Associa a função à tabela de clientes (Sempre disparada após um INSERT)
    op.execute("""
    DROP TRIGGER IF EXISTS trigger_apos_inserir_cliente ON customers;
    CREATE TRIGGER trigger_apos_inserir_cliente
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION trg_cria_usuario_cliente();
    """)


def downgrade() -> None:
    # Reverte as alterações caso você dê um "alembic downgrade"
    op.execute("DROP TRIGGER IF EXISTS trigger_apos_inserir_cliente ON customers;")
    op.execute("DROP FUNCTION IF EXISTS trg_cria_usuario_cliente();")
