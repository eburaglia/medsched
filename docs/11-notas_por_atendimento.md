mplementação do Padrão Service Record (Agnóstico): Substituímos a ideia de "Prontuário Médico" por um modelo de Registro de Serviço universal. Isso permite que o SaaS atenda Clínicas, Estúdios, Oficinas ou Consultorias sem alteração de código.

Isolamento Multi-Tenant: Todos os registros de atendimento são vinculados obrigatoriamente a um tenant_id, garantindo que uma clínica nunca acesse o histórico de outra, mesmo compartilhando o mesmo banco de dados.

Integridade de Dados: Adicionada trava lógica no CRUD; registros marcados como assinado: true impedem a edição do campo conteudo, garantindo valor legal e histórico ao atendimento.

🗄️ Engenharia de Dados (PostgreSQL + Alembic)
Nova Tabela service_records: Criada com suporte nativo a UUIDs e Enums.

Otimização de Performance: Aplicados 5 índices (ix_) estratégicos para buscas ultrarrápidas por: ID, Tenant, Cliente, Profissional e Agendamento.

Relacionamentos Dinâmicos: Implementada a técnica de SET NULL no appointment_id, permitindo que o registro de serviço sobreviva mesmo que o agendamento original seja removido (preservação do histórico do cliente).

🚀 Endpoints de API (FastAPI)
POST /api/v1/service-records/: Criação de novos atendimentos com validação de esquema Pydantic.

GET /api/v1/service-records/customer/{id}: Recuperação cronológica de todo o histórico de um cliente.

PUT /api/v1/service-records/{id}: Atualização de notas e fechamento (assinatura) do atendimento.
