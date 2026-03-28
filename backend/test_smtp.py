from src.database import SessionLocal
from src.models.notification import NotificationLog, NotificationChannel, NotificationStatus
from src.models.user import User
import uuid

def inject():
    db = SessionLocal()
    
    # O ID fixo que você informou
    USER_ID_FIXO = "91100bf9-2634-48e9-8b3c-ef6951073c9f"
    
    # Busca o usuário específico pelo ID
    user = db.query(User).filter(User.id == USER_ID_FIXO).first()
    
    if not user:
        print(f"❌ Erro: Usuário com ID {USER_ID_FIXO} não foi encontrado no banco.")
        db.close()
        return
        
    print(f"✅ Usuário encontrado: {user.nome} ({user.email})")
    
    email_destino = "eburaglia@gmail.com"
        
    nova_notif = NotificationLog(
        tenant_id=user.tenant_id,
        destinatario_id=user.id,  # Vincula ao seu ID fixo
        canal=NotificationChannel.EMAIL,
        status=NotificationStatus.NA_FILA,
        assunto="🚀 Teste com ID Fixo e Porta 2525",
        conteudo=(
            f"Olá {user.nome}!\n\n"
            f"Este teste está sendo enviado utilizando o seu ID real do banco: {user.id}.\n"
            f"Destino: {email_destino}.\n\n"
            "Se o Worker processar isso, a integração está 100% operacional!"
        )
    )
    
    try:
        db.add(nova_notif)
        db.commit()
        print(f"✅ Notificação enfileirada com sucesso para o ID: {USER_ID_FIXO}")
    except Exception as e:
        print(f"❌ Erro ao inserir no banco: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    inject()
