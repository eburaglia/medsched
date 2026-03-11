from src.database import engine, Base
from src.models.financial_category import FinancialCategory
from src.models.payment_method import PaymentMethod
from src.models.transaction import Transaction
from src.models.professional_service import ProfessionalService

print("Sincronizando modelos financeiros com o banco de dados...")
Base.metadata.create_all(bind=engine)
print("Tabelas criadas com sucesso!")
