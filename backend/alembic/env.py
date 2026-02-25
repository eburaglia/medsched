import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# 1. Adiciona a pasta backend ao caminho do Python para ele encontrar nossos arquivos
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# 2. Importa as nossas configurações e a Base com todas as tabelas
from src.database import SQLALCHEMY_DATABASE_URL
from src.models import Base

# Configuração padrão do Alembic
config = context.config

# 3. Injeta a nossa URL de conexão (protegida pelo .env) no Alembic
config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)

# Configuração de logs
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 4. Aponta o alvo das migrações para as nossas tabelas mapeadas
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Executa migrações em modo 'offline' (gera apenas o SQL de texto)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Executa migrações em modo 'online' (conecta no Postgres e cria as tabelas)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
