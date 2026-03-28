import time
import requests
from datetime import datetime
from src.database import SessionLocal
from src.models.notification import NotificationLog, NotificationChannel, NotificationStatus
from src.models.integration import IntegrationConfig, IntegrationProvider
from src.models.customer import Customer

def send_whatsapp(config_data, to_phone, message):
    base_url = config_data.get("api_url").rstrip('/')
    api_key = config_data.get("api_key")
    instance = config_data.get("instance_name")

    # Limpa o telefone (deixa só números)
    phone = "".join(filter(str.isdigit, to_phone))
    if not phone.startswith("55"): phone = "55" + phone

    url = f"{base_url}/message/sendText/{instance}"
    headers = { "apikey": api_key, "Content-Type": "application/json" }
    payload = {
        "number": phone,
        "options": { "delay": 1200, "presence": "composing", "linkPreview": false },
        "textMessage": { "text": message }
    }

    print(f"   -> Enviando Zap para {phone} via {instance}...")
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    
    if response.status_code not in [200, 201]:
        raise Exception(f"Erro na Evolution API: {response.text}")
    
    print("   -> Mensagem enviada com sucesso!")

def process_whatsapp_queue():
    db = SessionLocal()
    try:
        logs = db.query(NotificationLog).filter(
            NotificationLog.status == NotificationStatus.NA_FILA,
            NotificationLog.canal == NotificationChannel.WHATSAPP
        ).limit(10).all()

        if not logs: return 0

        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Fila WhatsApp: {len(logs)} mensagens.")

        for log in logs:
            log.status = NotificationStatus.PROCESSANDO
            db.commit()

            try:
                # Busca o telefone do cliente
                cliente = db.query(Customer).filter(Customer.id == log.customer_id).first()
                if not cliente or not cliente.telefone:
                    raise Exception("Cliente sem telefone cadastrado.")

                # Busca config da Evolution API
                config = db.query(IntegrationConfig).filter(
                    IntegrationConfig.tenant_id == log.tenant_id,
                    IntegrationConfig.provider == IntegrationProvider.WHATSAPP,
                    IntegrationConfig.ativo == True
                ).first()

                if not config: raise Exception("WhatsApp não configurado para este Tenant.")

                send_whatsapp(config.config_data, cliente.telefone, log.conteudo)

                log.status = NotificationStatus.PROCESSADA
                log.processado_em = datetime.utcnow()
            except Exception as e:
                log.status = NotificationStatus.FALHA
                log.erro_log = str(e)
                print(f" ❌ Erro: {e}")

            db.commit()
        return len(logs)
    finally:
        db.close()

if __name__ == "__main__":
    print("🟢 Worker de WhatsApp (Evolution API) Iniciado!")
    while True:
        if process_whatsapp_queue() == 0:
            time.sleep(5)
        else:
            time.sleep(1)
