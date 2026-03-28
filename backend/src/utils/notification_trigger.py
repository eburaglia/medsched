from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from src.models.notification import NotificationTemplate, NotificationLog, NotificationChannel, NotificationStatus
from src.models.appointment import Appointment
from src.models.customer import Customer
from src.models.tenant import Tenant

class NotificationTrigger:
    @staticmethod
    def _parse_content(content: str, data: dict) -> str:
        """Substitui {{variavel}} pelos dados reais."""
        for key, value in data.items():
            placeholder = "{{" + key + "}}"
            if placeholder in content:
                content = content.replace(placeholder, str(value if value else ""))
        return content

    @staticmethod
    def trigger_appointment_event(db: Session, appointment_id: UUID, event_type: str):
        """
        Gatilhos: 'new_appointment', 'appointment_confirmed', 'appointment_canceled'
        """
        # 1. Busca os dados do agendamento
        app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not app: 
            print(f"⚠️ Agendamento {appointment_id} não encontrado.")
            return

        # 2. Busca o cliente e o tenant (empresa)
        customer = db.query(Customer).filter(Customer.id == app.customer_id).first()
        tenant = db.query(Tenant).filter(Tenant.id == app.tenant_id).first()
        
        # 3. Prepara o dicionário de variáveis para o template
        data_vars = {
            "cliente_nome": customer.nome if customer else "Cliente",
            "servico_nome": app.service.nome if app.service else "Serviço",
            "data_hora": app.data_hora_inicio.strftime("%d/%m/%Y às %H:%M"),
            "empresa_nome": tenant.nome_fantasia or "Nossa Clínica"
        }

        # 4. Busca os templates ATIVOS para este evento
        # Prioridade 1: Template da própria clínica (tenant_id)
        # Prioridade 2: Template padrão do sistema (tenant_id is None)
        templates = db.query(NotificationTemplate).filter(
            NotificationTemplate.tenant_id == app.tenant_id,
            NotificationTemplate.codigo_interno == event_type,
            NotificationTemplate.ativo == True
        ).all()

        if not templates:
            templates = db.query(NotificationTemplate).filter(
                NotificationTemplate.tenant_id.is_(None),
                NotificationTemplate.codigo_interno == event_type,
                NotificationTemplate.ativo == True
            ).all()

        # 5. Para cada template encontrado, gera um log na fila
        for tmpl in templates:
            conteudo_final = NotificationTrigger._parse_content(tmpl.conteudo, data_vars)
            assunto_final = NotificationTrigger._parse_content(tmpl.assunto, data_vars) if tmpl.assunto else None

            novo_log = NotificationLog(
                tenant_id=app.tenant_id,
                customer_id=app.customer_id,
                destinatario_id=None,
                canal=tmpl.canal,
                assunto=assunto_final,
                conteudo=conteudo_final,
                status=NotificationStatus.NA_FILA
            )
            db.add(novo_log)
        
        db.commit()
        print(f"🚀 Gatilho '{event_type}' processado para o agendamento {appointment_id}")
