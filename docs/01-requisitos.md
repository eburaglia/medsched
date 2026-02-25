# 📄 FASE 1: Requisitos e Regras de Negócio
**Sistema Multi-Tenant de Agendamento de Serviços**

## 1. Visão Geral
O sistema tem como objetivo fornecer uma plataforma unificada (multi-tenant) onde diferentes empresas (clínicas, salões, oficinas, etc.) possam gerenciar suas agendas de serviços. O sistema garante o isolamento dos dados de cada empresa, permitindo flexibilidade na configuração de profissionais, serviços e horários.

## 2. Atores do Sistema (Níveis de Acesso)
* **Super Admin (Dono da Aplicação):** Gerencia os Tenants (empresas assinantes do sistema), visualiza métricas globais e garante a operação da plataforma.
* **Tenant Admin (Dono/Gerente do Negócio):** Configura a própria empresa, cria serviços, cadastra profissionais e tem visão total da agenda do seu negócio.
* **Profissional (Prestador do Serviço):** Gerencia sua própria agenda, aprova/recusa agendamentos, define seus horários de trabalho e local de atendimento. O sistema deve garantir que o Profissional A não veja a agenda do Profissional B, a menos que autorizado.
* **Cliente Final:** Acessa o portal/link do Tenant, visualiza horários disponíveis, solicita e gerencia seus agendamentos.

## 3. Regras de Negócio Core (Agendamento)
* **RN-01 (Gestão de Disponibilidade):** O profissional (ou Admin) é o único responsável por configurar sua grade de horários disponíveis e dias úteis na semana.
* **RN-02 (Gestão de Recursos):** Um atendimento deve possuir uma modalidade de local, podendo exigir a alocação de uma "Sala Física" (evitando que duas pessoas reservem a mesma sala no mesmo horário) ou ser classificado como "Online".
* **RN-03 (Máquina de Estados de Agendamento):**
    * *Via Cliente:* Entra obrigatoriamente no status **Pendente**. Requer ação do Profissional/Admin para mudar para **Ativo**.
    * *Via Profissional/Admin:* Entra diretamente no status **Ativo**.
* **RN-04 (Fluxo de Remarcação):** Quando um cliente remarca, o agendamento original é cancelado/liberado instantaneamente. O novo agendamento nasce como **Pendente**. O sistema disparará notificações automatizadas (E-mail e Push) para o profissional responsável.
* **RN-05 (Recorrência):** O sistema deve suportar tanto agendamentos únicos (Ad-hoc) quanto agendamentos em lote/recorrentes (Periódicos).
* **RN-06 (Flexibilidade de Duração):** Cada serviço tem uma duração padrão pré-configurada. No entanto, no ato do agendamento, o tempo pode ser ajustado manualmente, desde que o algoritmo de validação confirme que o novo tempo não conflita com o próximo agendamento da grade, nem do profissional, nem da sala.
