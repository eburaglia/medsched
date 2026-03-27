# Este arquivo transforma a pasta 'models' em um pacote Python e centraliza as importações.
from src.database import Base

# Importa as nossas tabelas (nesta ordem para manter a hierarquia lógica)
from src.models.tenant import Tenant
from src.models.user import User
from src.models.service import Service
from src.models.resource import Resource
from src.models.customer import Customer

# 👇 CORREÇÃO DRCODE: Importando o módulo de faturamento (Billing) ANTES dos Agendamentos.
# Isso garante que a tabela 'agreements' seja carregada e o Alembic pare de dar erro.
from src.models.billing import PaymentFee, Agreement, ServiceAgreementPrice

# Agora sim, os agendamentos podem usar a tabela de agreements
from src.models.appointment import Appointment

# 👇 DRCODE NOVO: Importando a Fila de Espera logo após os Agendamentos
from src.models.waitlist import Waitlist

# A Tabela de Backoffice (Isolada do ecossistema de Tenants)
from src.models.super_admin import SuperAdmin

# 👇 O nosso motor de ETL e Staging Area!
from src.models.import_staging import ImportBatch, ImportRow
from src.models.service_record import ServiceRecord
from src.models.financial import FinancialTransaction
