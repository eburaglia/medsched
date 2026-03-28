import time
import requests
from datetime import datetime
from src.database import SessionLocal
from src.models.notification import NotificationLog, NotificationChannel, NotificationStatus
from src.models.integration import IntegrationConfig, IntegrationProvider
from src.models.customer import Customer

# ==========================================
# FUNÇÕES DE ENVIO: WHATSAPP
# ==========================================
def send_whatsapp(config_data, to_phone, message):
    base_url = config_data.get("api_url").rstrip('/')
    api_key = config_data.get("api_key")
    instance = config_data.get("instance_name")

    # Limpa o telefone (deixa só números)
    phone = "".join(filter(str.isdigit, to_phone))
    if not phone.startswith("55"): phone = "55" + phone

    url = f"{base_url}/message/sendText/{instance}"
    headers = { "apikey": api_key, "Content-Type": "application/json" }
    
    # Na v2 da Evolution, o texto vai na raiz do payload
    payload = {
        "number": phone,
        "text": message
    }

    print(f"   -> Enviando Zap para {phone} via {instance}...")
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    
    if response.status_code not in [200, 201]:
        raise Exception(f"Erro na Evolution API: {response.text}")
    
    print("   -> Mensagem enviada com sucesso!")

# ==========================================
# FUNÇÕES DE ENVIO: TELEGRAM (NOVO)
# ==========================================
def send_telegram(config_data, chat_id, message):
    # O Token do bot fica armazenado no JSON do banco de dados
    bot_token = config_data.get("bot_token")
    
    if not bot_token:
        raise Exception("Token do Telegram Bot não configurado.")

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown" # Permite usar negrito, itálico, etc.
    }

    print(f"   -> Enviando Telegram para ID {chat_id}...")
    response = requests.post(url, json=payload, timeout=15)
    
    if response.status_code != 200:
        raise Exception(f"Erro na API do Telegram: {response.text}")
    
    print("   -> Telegram enviado com sucesso!")

# ==========================================
# PROCESSAMENTO DA FILA (ORQUESTRADOR)
# ==========================================
def process_notification_queue():
    db = SessionLocal()
    try:
        # Puxa as próximas 10 mensagens que estão na fila, seja WhatsApp ou Telegram
        logs = db.query(NotificationLog).filter(
            NotificationLog.status == NotificationStatus.NA_FILA,
            NotificationLog.canal.in_([NotificationChannel.WHATSAPP, NotificationChannel.TELEGRAM])
        ).limit(10).all()

        if not logs: return 0

        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Fila: Encontradas {len(logs)} mensagens.")

        for log in logs:
            log.status = NotificationStatus.PROCESSANDO
            db.commit()

            try:
                # 1. Busca os dados do cliente
                cliente = db.query(Customer).filter(Customer.id == log.customer_id).first()
                if not cliente:
                    raise Exception("Cliente não encontrado.")

                # 2. Direciona para o canal correto
                if log.canal == NotificationChannel.WHATSAPP:
                    if not cliente.telefone:
                        raise Exception("Cliente sem telefone cadastrado.")
                    
                    config = db.query(IntegrationConfig).filter(
                        IntegrationConfig.tenant_id == log.tenant_id,
                        IntegrationConfig.provider == IntegrationProvider.WHATSAPP,
                        IntegrationConfig.ativo == True
                    ).first()
                    
                    if not config: raise Exception("WhatsApp não configurado para este Tenant.")
                    send_whatsapp(config.config_data, cliente.telefone, log.conteudo)

                elif log.canal == NotificationChannel.TELEGRAM:
                    # NOTA: Você precisará garantir que a tabela Customer tenha um campo para o Telegram ID (ex: cliente.telegram_chat_id)
                    # Caso ainda não tenha, use um ID fixo para testes ou pegue do telefone se o seu banco usar o mesmo campo.
                    # Exemplo abaixo usando um campo fictício (ajuste conforme seu banco):
                    chat_id = getattr(cliente, 'telegram_chat_id', None) 
                    
                    if not chat_id:
                        raise Exception("Cliente sem ID do Telegram (chat_id) cadastrado.")

                    config = db.query(IntegrationConfig).filter(
                        IntegrationConfig.tenant_id == log.tenant_id,
                        IntegrationConfig.provider == IntegrationProvider.TELEGRAM,
                        IntegrationConfig.ativo == True
                    ).first()

                    if not config: raise Exception("Telegram não configurado para este Tenant.")
                    send_telegram(config.config_data, chat_id, log.conteudo)

                # Se tudo deu certo, marca como enviada
                log.status = NotificationStatus.PROCESSADA
                log.processado_em = datetime.utcnow()
                
            except Exception as e:
                # Se falhou, salva o erro no banco para auditoria
                log.status = NotificationStatus.FALHA
                log.erro_log = str(e)
                print(f" ❌ Erro ao enviar log {log.id}: {e}")

            db.commit()
        return len(logs)
    finally:
        db.close()

if __name__ == "__main__":
    print("🟢 Worker de Notificações (WhatsApp & Telegram) Iniciado!")
    while True:
        if process_notification_queue() == 0:
            time.sleep(5) # Dorme 5s se a fila estiver vazia
        else:
            time.sleep(1) # Processa mais rápido se houver fila acumulada
