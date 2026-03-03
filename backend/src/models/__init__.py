# Este arquivo transforma a pasta 'models' em um pacote Python e centraliza as importações.
from src.database import Base

# Importa as nossas 5 tabelas (nesta ordem para manter a hierarquia lógica)
from src.models.tenant import Tenant
from src.models.user import User
from src.models.service import Service
from src.models.resource import Resource
from src.models.appointment import Appointment

from src.models.customer import Customer

# A Tabela de Backoffice (Isolada do ecossistema de Tenants)
from src.models.super_admin import SuperAdmin

# 👇 O nosso motor de ETL e Staging Area!
from src.models.import_staging import ImportBatch, ImportRow
