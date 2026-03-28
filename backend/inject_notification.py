from src.database import SessionLocal
from src.models.notification import NotificationLog, NotificationChannel, NotificationStatus
from src.models.user import User

def inject():
    db = SessionLocal()
    try:
        # Pega os usuários que pertencem a algum tenant para não dar erro de chave estrangeira
        users = db.query(User).filter(User.tenant_id.isnot(None)).all()
        count = 0
        
        for user in users:
            nova_notif = NotificationLog(
                tenant_id=user.tenant_id,
                destinatario_id=user.id,
                canal=NotificationChannel.IN_APP,
                assunto="🚀 Atualização do Sistema",
                conteudo="Olá! O novo módulo de notificações In-App foi ativado com sucesso. Clique no ícone de check ao lado para marcar esta mensagem como lida.",
                lida=False
            )
            db.add(nova_notif)
            count += 1
            
        db.commit()
        print(f"✅ {count} notificação(ões) injetada(s) com sucesso na fila In-App!")
    except Exception as e:
        print(f"❌ Erro ao injetar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inject()
