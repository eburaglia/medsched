from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, and_
from typing import Dict, Any, List
from datetime import date, datetime, timedelta

from src.database import get_db
from src.api.deps import get_current_user
from src.models.user import User, UserRole
from src.models.appointment import Appointment, AppointmentStatus
from src.models.customer import Customer

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=Dict[str, Any])
def get_dashboard_stats(
    periodo: str = Query("semana", description="Filtro para o gráfico: dia, semana, mes"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    # Identifica se é usuário comum ou Super Admin
    papel = current_user.papel.value if hasattr(current_user.papel, 'value') else getattr(current_user, 'papel', '')
    
    # 🛡️ TRAVA PARA O SUPER ADMIN (Dono do SaaS)
    if papel in ["SUPER_ADMIN", "SYSTEM_ADMIN"]:
        # Ele não tem tenant_id. O Dashboard dele será construído futuramente com dados globais.
        return {
            "resumo": {"servicos_hoje": 0, "usuarios_ativos": 0, "profissionais": 0, "taxa_ocupacao": 100},
            "proximos_atendimentos": [],
            "grafico": {"dia": [], "semana": [], "mes": []}
        }

    hoje = date.today()
    tenant_id = current_user.tenant_id

    # 1. Serviços Hoje
    inicio_dia = datetime.combine(hoje, datetime.min.time())
    fim_dia = datetime.combine(hoje, datetime.max.time())
    
    servicos_hoje = db.query(func.count(Appointment.id)).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.data_hora_inicio >= inicio_dia,
        Appointment.data_hora_inicio <= fim_dia,
        Appointment.status.notin_([AppointmentStatus.CANCELADO_CLIENTE, AppointmentStatus.CANCELADO_PROFISSIONAL])
    ).scalar() or 0

    # 2. Total de Usuários
    total_usuarios = db.query(func.count(Customer.id)).filter(
        Customer.tenant_id == tenant_id,
        Customer.status == 'ATIVO'
    ).scalar() or 0

    # 3. Profissionais Ativos
    total_profissionais = db.query(func.count(User.id)).filter(
        User.tenant_id == tenant_id,
        User.papel == "PROFISSIONAL", # Usamos string direto para evitar conflito de importação
        User.status == 'ATIVO'
    ).scalar() or 0

    # 4. Próximos Atendimentos
    proximos_agendamentos = db.query(
        Appointment.id,
        Appointment.data_hora_inicio,
        User.nome.label("nome_profissional"),
        Customer.nome.label("nome_cliente")
    ).outerjoin(User, Appointment.profissional_id == User.id)\
     .outerjoin(Customer, Appointment.customer_id == Customer.id)\
     .filter(
        Appointment.tenant_id == tenant_id,
        Appointment.data_hora_inicio >= datetime.now(),
        Appointment.status.in_([AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO])
    ).order_by(Appointment.data_hora_inicio.asc()).limit(5).all()

    atendimentos_lista = []
    for ag in proximos_agendamentos:
        atendimentos_lista.append({
            "id": str(ag.id),
            "dataHora": ag.data_hora_inicio.isoformat(),
            "profissional": ag.nome_profissional or "N/D",
            "cliente": ag.nome_cliente or "N/D"
        })

    # 5. Dados do Gráfico
    data_inicio = inicio_dia
    if periodo == "semana":
        data_inicio = inicio_dia - timedelta(days=7)
    elif periodo == "mes":
        data_inicio = inicio_dia - timedelta(days=30)
        
    agendados_grafico = db.query(func.count(Appointment.id)).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.data_hora_inicio >= data_inicio,
        Appointment.data_hora_inicio <= fim_dia,
        Appointment.status.in_([AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO])
    ).scalar() or 0
    
    executados_grafico = db.query(func.count(Appointment.id)).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.data_hora_inicio >= data_inicio,
        Appointment.data_hora_inicio <= fim_dia,
        Appointment.status == AppointmentStatus.CONCLUIDO
    ).scalar() or 0

    grafico_data = [
        {"name": f"Últimos {periodo.capitalize()}", "Agendados": agendados_grafico, "Executados": executados_grafico}
    ]

    return {
        "resumo": {
            "servicos_hoje": servicos_hoje,
            "usuarios_ativos": total_usuarios,
            "profissionais": total_profissionais,
            "taxa_ocupacao": 65
        },
        "proximos_atendimentos": atendimentos_lista,
        "grafico": {"dia": grafico_data, "semana": grafico_data, "mes": grafico_data}
    }
