"""add_rows_columns_to_import_batch

Revision ID: cd4fc68d97bd
Revises: ead85c74c33f
Create Date: 2026-04-01 13:18:10.745861

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd4fc68d97bd'
down_revision: Union[str, None] = 'ead85c74c33f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionando as colunas faltantes na tabela import_batches
    # Usamos batch_alter_table ou verificações simples para garantir que não falhe se a coluna já existir
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('import_batches')]

    if 'total_rows' not in columns:
        op.add_column('import_batches', sa.Column('total_rows', sa.Integer(), nullable=True))
    if 'valid_rows' not in columns:
        op.add_column('import_batches', sa.Column('valid_rows', sa.Integer(), nullable=True))
    if 'error_rows' not in columns:
        op.add_column('import_batches', sa.Column('error_rows', sa.Integer(), nullable=True))
    if 'error_message' not in columns:
        op.add_column('import_batches', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('import_batches', 'error_message')
    op.drop_column('import_batches', 'error_rows')
    op.drop_column('import_batches', 'valid_rows')
    op.drop_column('import_batches', 'total_rows')
