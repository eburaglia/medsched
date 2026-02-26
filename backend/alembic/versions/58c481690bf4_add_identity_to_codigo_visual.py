"""add_identity_to_codigo_visual

Revision ID: 58c481690bf4
Revises: 10c1f0e2b542
Create Date: 2026-02-26 10:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.schema import Identity


# revision identifiers, used by Alembic.
revision: str = '58c481690bf4'
down_revision: Union[str, None] = '10c1f0e2b542'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Remove a coluna antiga (que era um Integer simples quebrado)
    op.drop_column('tenants', 'codigo_visual')
    
    # 2. Adiciona a nova coluna, já com a Identity configurada perfeitamente
    op.add_column('tenants', sa.Column(
        'codigo_visual', 
        sa.Integer(), 
        Identity(start=10000, cycle=False), 
        nullable=False
    ))
    
    # 3. Recria o índice e a restrição de unicidade
    op.create_index(op.f('ix_tenants_codigo_visual'), 'tenants', ['codigo_visual'], unique=True)


def downgrade() -> None:
    # Em caso de rollback, desfazemos as operações na ordem inversa
    op.drop_index(op.f('ix_tenants_codigo_visual'), table_name='tenants')
    op.drop_column('tenants', 'codigo_visual')
    
    # Volta para a coluna antiga quebrada (sem identity)
    op.add_column('tenants', sa.Column('codigo_visual', sa.INTEGER(), autoincrement=False, nullable=False))
    op.create_index('ix_tenants_codigo_visual', 'tenants', ['codigo_visual'], unique=True)
