from src.database import SessionLocal
from src.models.notification import NotificationTemplate, NotificationChannel

def seed():
    db = SessionLocal()
    try:
        exists = db.query(NotificationTemplate).filter_by(codigo_interno="lembrete_24h", tenant_id=None).first()
        if not exists:
            t1 = NotificationTemplate(
                codigo_interno="lembrete_24h",
                nome="Lembrete de Agendamento (24h)",
                canal=NotificationChannel.EMAIL,
                assunto="Lembrete: Seu serviço está chegando!",
                conteudo="Olá {{cliente_nome}},\n\nLembrando que você tem um horário agendado conosco no dia {{data_hora}}.\n\nAté breve!\n{{empresa_nome}}"
            )
            t2 = NotificationTemplate(
                codigo_interno="boas_vindas",
                nome="Boas-vindas (Novo Cliente)",
                canal=NotificationChannel.EMAIL,
                assunto="Bem-vindo(a) à {{empresa_nome}}!",
                conteudo="Olá {{cliente_nome}},\n\nEstamos muito felizes em ter você conosco.\n\nQualquer dúvida, estamos à disposição!\n\nAtenciosamente,\nEquipe {{empresa_nome}}"
            )
            db.add(t1)
            db.add(t2)
            db.commit()
            print("✅ Templates semeados com sucesso!")
        else:
            print("⚠️ Templates já existem no banco!")
    except Exception as e:
        print(f"❌ Erro ao semear: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
