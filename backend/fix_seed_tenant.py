from src.database import SessionLocal
from src.models.tenant import Tenant

db = SessionLocal()
# Busca a clínica seed pelo código visual que vimos no seu Raio-X
seed = db.query(Tenant).filter(Tenant.codigo_visual == 10002).first()

if seed:
    if not seed.segmento_atuacao: seed.segmento_atuacao = "Saúde"
    if not seed.fuso_horario: seed.fuso_horario = "America/Sao_Paulo"
    if not seed.endereco_logradouro: seed.endereco_logradouro = "Rua Principal, 100"
    if not seed.endereco_cidade: seed.endereco_cidade = "São Paulo"
    if not seed.endereco_estado: seed.endereco_estado = "SP"
    if not seed.endereco_regiao: seed.endereco_regiao = "Sudeste"
    if not seed.site_url: seed.site_url = "https://clinicamaster.com"
    if not seed.email_contato: seed.email_contato = "admin@clinicamaster.com"
    if not seed.telefone_contato: seed.telefone_contato = "11999999999"
    if not seed.dominio_interno: seed.dominio_interno = "clinica-master"
    if not seed.url_externa: seed.url_externa = "https://agendamento.clinicamaster.com"
    if not seed.logotipo_url: seed.logotipo_url = "https://logo.com/master.png"
    
    db.commit()
    print("Sucesso! Os dados da Clínica Master foram completados. Ela já deve aparecer no painel.")
else:
    print("Clínica não encontrada.")
