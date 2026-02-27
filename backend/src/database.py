import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv


# Carrega as senhas e variáveis do arquivo .env (que está na raiz do projeto)
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")

# Monta a URL de conexão nativa para o Docker
SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@db:5432/{POSTGRES_DB}"

# Cria o "motor" de comunicação com o PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cria a fábrica de sessões (cada vez que um cliente acessar a API, abrimos uma sessão isolada)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# A classe base da qual todas as nossas tabelas vão herdar para existir no banco
Base = declarative_base()

# Função auxiliar (Dependência) para injetar o banco de dados nas rotas da nossa API de forma segura
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
