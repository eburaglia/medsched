from src.database import SessionLocal
from src.models.tenant import Tenant
from src.models.user import User
from src.models.customer import Customer
from src.models.service import Service

db = SessionLocal()

try:
    # Hash bcrypt universal para a senha "senha123"
    hash_senha = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq"

    # 1. Cria a Clínica
    t = Tenant(nome="Clinica da Maria")
    db.add(t)
    db.commit()

    # 2. Cria a Maria
    u = User(email="maria@clinica.com", hashed_password=hash_senha, tenant_id=t.id)
    if hasattr(u, 'nome'): u.nome = "Dra. Maria"
    db.add(u)

    # 3. Cria o Paciente
    c = Customer(nome="Joao Paciente", tenant_id=t.id)
    db.add(c)

    # 4. Cria o Serviço
    s = Service(nome="Fisioterapia", preco=150.0, duracao_minutos=60, tenant_id=t.id)
    db.add(s)

    db.commit()

    print("\n" + "🚀 "*15)
    print("DADOS INJETADOS COM SUCESSO!")
    print("Vá no Swagger, clique em 'Authorize' (Cadeado) e faça o Login:")
    print("Email: maria@clinica.com")
    print("Senha: senha123")
    print("🚀 "*15)
    print("\n📋 COPIE ESTE JSON PARA O POST /appointments/:\n")
    print(f"""{{
  "customer_id": "{c.id}",
  "professional_id": "{u.id}",
  "servico_id": "{s.id}",
  "recurso_id": null,
  "data_hora_inicio": "2026-03-10T14:00:00.000Z",
  "data_hora_fim": "2026-03-10T15:00:00.000Z",
  "status": "agendado",
  "observacoes": "Sessões de Fisioterapia Semanais",
  "tenant_id": "{t.id}",
  "tipo_recorrencia": "semanal",
  "quantidade_recorrencia": 5
}}""")
    print("\n" + "="*45)

except Exception as e:
    print(f"Erro: {e}")
finally:
    db.close()
