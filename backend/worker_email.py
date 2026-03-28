import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from src.database import SessionLocal
from src.models.notification import NotificationLog, NotificationChannel, NotificationStatus
from src.models.integration import IntegrationConfig, IntegrationProvider
from src.models.user import User
from src.models.customer import Customer

def send_email(config_data, to_email, subject, body_html):
    host = config_data.get("host")
    port = int(config_data.get("port", 587))
    user = config_data.get("user")
    password = config_data.get("password")
    from_email = config_data.get("from_email")
    from_name = config_data.get("from_name", "ServiceSched")

    print(f"   -> Preparando mensagem para {to_email} via {host}:{port}")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email

    html_content = body_html.replace('\n', '<br>')
    template = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
        <div style="max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            {html_content}
            <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 30px;">
            <p style="font-size: 11px; color: #999; text-align: center;">Enviado automaticamente por <strong>ServiceSched</strong></p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(template, "html"))

    print("   -> Conectando ao servidor SMTP (Timeout de 15s)...")
    server = smtplib.SMTP(host, port, timeout=15)
    
    server.ehlo()
    if config_data.get("use_tls", True):
        print("   -> Iniciando handshake TLS...")
        server.starttls()
        server.ehlo()
    
    print("   -> Fazendo login...")
    server.login(user, password)
    
    print("   -> Enviando mensagem...")
    server.sendmail(from_email, to_email, msg.as_string())
    server.quit()
    print("   -> Sucesso!")

def process_email_queue():
    db = SessionLocal()
    try:
        logs = db.query(NotificationLog).filter(
            NotificationLog.status == NotificationStatus.PROCESSANDO
        ).all()
        
        if not logs:
            logs = db.query(NotificationLog).filter(
                NotificationLog.status == NotificationStatus.NA_FILA,
                NotificationLog.canal == NotificationChannel.EMAIL
            ).limit(20).all()

        if not logs:
            return 0 

        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Iniciando processamento de {len(logs)} e-mails...")

        for log in logs:
            log.status = NotificationStatus.PROCESSANDO
            db.commit()

            try:
                # Se for o nosso teste solto, manda para o Edu
                to_email = "eburaglia@gmail.com"
                
                # Mas se tiver cliente ou usuario no banco, tenta buscar o real
                if log.customer_id:
                    cliente = db.query(Customer).filter(Customer.id == log.customer_id).first()
                    if cliente: to_email = cliente.email
                elif log.destinatario_id:
                    usuario = db.query(User).filter(User.id == log.destinatario_id).first()
                    if usuario: to_email = usuario.email

                if not to_email:
                    raise Exception("Destinatário sem e-mail cadastrado.")

                config = db.query(IntegrationConfig).filter(
                    IntegrationConfig.tenant_id == log.tenant_id,
                    IntegrationConfig.provider == IntegrationProvider.SMTP,
                    IntegrationConfig.ativo == True
                ).first()
                if not config:
                    config = db.query(IntegrationConfig).filter(
                        IntegrationConfig.tenant_id == None,
                        IntegrationConfig.provider == IntegrationProvider.SMTP,
                        IntegrationConfig.ativo == True
                    ).first()

                if not config or not config.config_data.get("host"):
                    raise Exception("Falta configurar o SMTP na tela de Integrações.")

                send_email(config.config_data, to_email, log.assunto, log.conteudo)

                log.status = NotificationStatus.PROCESSADA
                log.processado_em = datetime.utcnow()
                log.erro_log = None

            except Exception as e:
                log.status = NotificationStatus.FALHA
                log.erro_log = str(e)
                print(f" ❌ Falha: {e}")

            db.commit()
        return len(logs)
    except Exception as e:
        print(f"Erro Crítico: {e}")
        return 0
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Worker de E-mail iniciado!")
    while True:
        processados = process_email_queue()
        if processados == 0:
            time.sleep(5)
        else:
            time.sleep(1)
