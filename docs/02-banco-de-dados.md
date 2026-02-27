# 📄 FASE 2: Modelagem de Dados
**Sistema Multi-Tenant de Agendamento de Serviços**

## Estratégia de Arquitetura
O sistema utiliza **Isolamento Lógico (Row-level Isolation)** para o Multi-Tenancy. Todos os clientes compartilham a mesma infraestrutura de banco de dados, mas o isolamento e a segurança são garantidos pela coluna `tenant_id` (UUID) presente em todas as tabelas transacionais. Nenhuma query será executada sem este filtro.

---

## 1. Tabela `tenants` (As Empresas / Clientes)
Armazena os dados dos donos dos negócios (ex: clínicas, barbearias). É a tabela raiz do sistema.

**Considerações de Segurança e Design:**
* **Chave Primária:** Utiliza UUID v4 para prevenir ataques de enumeração (IDOR).
* **Armazenamento de Arquivos:** Logotipos e mídias são salvos em Storage Externo (ex: S3), armazenando apenas a URL no banco para otimização de performance e redução de custos de backup.
* **Auditoria e Deleção:** Registros não são apagados fisicamente (Soft Delete via `status` e `deletado_em`), mantendo a integridade histórica.

| Coluna | Tipo de Dado | Obrigatório | Descrição / Regra de Negócio |
| :--- | :--- | :---: | :--- |
| `id` | UUID | Sim | (PK) Identificador único. Chave base para todo o sistema. |
| `codigo_visual` | INT (Auto Inc.)| Sim | Identificador numérico amigável para exibição em tela. |
| `status` | ENUM | Sim | Valores: `phase-in`, `ativo`, `phase-out`, `inativo`. |
| `nome` | VARCHAR(255) | Sim | Razão social ou nome principal da empresa. |
| `nome_fantasia` | VARCHAR(255) | Não | Marca de uso comercial do tenant. |
| `cnpj` | VARCHAR(20) | Não | *Índice Único.* Documento legal (CNPJ/CPF). |
| `segmento_atuacao` | VARCHAR(100) | Sim | Categoria do negócio (Saúde, Estética, Automotivo, etc). |
| `fuso_horario` | VARCHAR(50) | Sim | Ex: `America/Sao_Paulo`. Essencial para conversão de UTC. |
| `endereco_logradouro` | VARCHAR(255) | Sim | Rua, número, complemento e bairro. |
| `endereco_cidade` | VARCHAR(100) | Sim | Cidade da sede. |
| `endereco_estado` | VARCHAR(2) | Sim | UF (Unidade Federativa). |
| `endereco_regiao` | VARCHAR(50) | Sim | Região ou zona geográfica. |
| `site_url` | VARCHAR(255) | Sim | Site institucional externo do cliente. |
| `email_contato` | VARCHAR(255) | Sim | E-mail oficial para notificações gerais e cobrança. |
| `telefone_contato` | VARCHAR(20) | Sim | Telefone/WhatsApp principal. |
| `dominio_interno` | VARCHAR(100) | Sim | Subdomínio de acesso (ex: `clinica-vida`). |
| `url_externa` | VARCHAR(255) | Sim | Link de direcionamento customizado. |
| `logotipo_url` | VARCHAR(500) | Sim | URL apontando para o Storage Externo (S3/Cloud). |
| `validade_assinatura`| TIMESTAMP | Sim | Data limite de acesso. Bloqueia o sistema se expirada. |
| `observacoes` | TEXT | Não | Anotações internas do Super Admin. |
| **[AUDITORIA]** | | | *Controle estrito de alterações.* |
| `criado_em` | TIMESTAMP | Sim | Data e hora exata da criação do registro. |
| `criado_por` | UUID | Sim | ID do usuário (Super Admin) responsável pelo cadastro. |
| `alterado_em` | TIMESTAMP | Não | Data e hora da última alteração. |
| `alterado_por` | UUID | Não | ID do usuário responsável pela última alteração. |
| `deletado_em` | TIMESTAMP | Não | Data e hora em que o tenant foi inativado (Soft Delete). |
| `deletado_por` | UUID | Não | ID do usuário que realizou a inativação. |

## 2. Tabela `users` (Os Atores do Sistema)
Armazena todos os indivíduos que interagem com um Tenant específico. O isolamento rigoroso garante que um cliente ou profissional pertença exclusivamente a um único Tenant.

**Considerações de Segurança e Design:**
* **Isolamento Horizontal:** A chave primária composta lógica é `tenant_id` + `email` / `cpf`. Isso permite que um mesmo e-mail seja usado em Tenants diferentes (clínicas diferentes), mantendo o isolamento total dos dados e resolvendo conflitos de homônimos.
* **Criptografia Unidirecional:** Senhas são salvas exclusivamente em formato de *Hash* (ex: Bcrypt/Argon2).
* **Controle de Acesso Baseado em Papel (RBAC):** O campo `papel` delimita o nível de acesso à interface e aos dados.
* **Isolamento de Super Admin:** Administradores globais da plataforma NÃO residem nesta tabela para evitar vulnerabilidades de escalonamento de privilégios.

| Coluna | Tipo de Dado | Obrigatório | Descrição / Regra de Negócio |
| :--- | :--- | :---: | :--- |
| `id` | UUID | Sim | (PK) Identificador único do usuário. |
| `tenant_id` | UUID | Sim | (FK) Trava de segurança. Liga o usuário ao seu Tenant. |
| `status` | ENUM | Sim | Valores: `pendente` (auto-cadastro), `ativo`, `inativo`. |
| `nome` | VARCHAR(255) | Sim | Nome completo do usuário. |
| `email` | VARCHAR(255) | Sim | E-mail de login (Único por Tenant). |
| `cpf` | VARCHAR(20) | Sim | Documento de identificação (Único por Tenant). |
| `senha_hash` | VARCHAR(255) | Sim | Senha criptografada irreversível. |
| `recuperacao_token`| VARCHAR(100) | Não | Token temporário para "Esqueci a Senha". |
| `recuperacao_expira`| TIMESTAMP | Não | Validade temporal do token de recuperação. |
| `papel` | ENUM | Sim | Valores: `tenant_admin`, `profissional`, `cliente`. |
| `endereco_logradouro`| VARCHAR(255) | Sim | Rua, número, complemento e bairro. |
| `endereco_cidade` | VARCHAR(100) | Sim | Cidade de residência. |
| `endereco_estado` | VARCHAR(2) | Sim | UF (Unidade Federativa). |
| `endereco_regiao` | VARCHAR(50) | Sim | Região demográfica. |
| `telefone_contato` | VARCHAR(20) | Sim | Telefone principal / WhatsApp. |
| `observacoes` | TEXT | Não | Anotações internas (visíveis apenas para o admin). |
| **[AUDITORIA]** | | | *Rastreabilidade de alterações.* |
| `criado_em` | TIMESTAMP | Sim | Data e hora exata do registro. |
| `criado_por` | UUID | Não | ID de quem criou (Nulo se foi auto-cadastro). |
| `alterado_em` | TIMESTAMP | Não | Data da última edição. |
| `alterado_por` | UUID | Não | ID de quem editou. |
| `deletado_em` | TIMESTAMP | Não | Data de inativação (Soft Delete). |
| `deletado_por` | UUID | Não | ID do Admin que inativou. |

## 3. Tabela `services` (Catálogo de Serviços)
Armazena os serviços oferecidos por um Tenant. O catálogo é global para a clínica/empresa, permitindo que múltiplos profissionais executem o mesmo serviço através de uma futura tabela de ligação (N:N).

**Considerações de Segurança e Design:**
* **Matemática de Tempo:** A duração é salva estritamente em minutos (`INT`) para garantir a performance e exatidão do algoritmo de cálculo de conflitos na agenda.
* **Precisão Financeira:** Valores monetários utilizam `DECIMAL(10,2)` para evitar erros de arredondamento de ponto flutuante comuns em computação.
* **Mídias Externas:** Imagens/GIFs para o menu do cliente final são armazenadas em nuvem (S3), salvando apenas a URL no banco para otimização de I/O.

| Coluna | Tipo de Dado | Obrigatório | Descrição / Regra de Negócio |
| :--- | :--- | :---: | :--- |
| `id` | UUID | Sim | (PK) Identificador único do serviço. |
| `tenant_id` | UUID | Sim | (FK) Trava de segurança. Garante o isolamento do catálogo. |
| `status` | ENUM | Sim | Valores: `ativo`, `inativo`. Oculta o serviço do menu do cliente. |
| `nome` | VARCHAR(255) | Sim | Nome comercial do serviço (ex: "Consulta de Rotina"). |
| `duracao_minutos` | INT | Sim | Duração base matemática (ex: 30, 60, 90). |
| `preco` | DECIMAL(10,2) | Não | Valor de face do serviço. |
| `imagem_url` | VARCHAR(500) | Não | Link apontando para a nuvem com a imagem/gif do serviço. |
| `observacoes` | TEXT | Não | Descrição detalhada ou anotações internas. |
| **[AUDITORIA]** | | | *Rastreabilidade de alterações.* |
| `criado_em` | TIMESTAMP | Sim | Data e hora exata do registro. |
| `criado_por` | UUID | Não | ID do Admin que cadastrou. |
| `alterado_em` | TIMESTAMP | Não | Data da última edição. |
| `alterado_por` | UUID | Não | ID de quem editou. |
| `deletado_em` | TIMESTAMP | Não | Data de inativação (Soft Delete). |
| `deletado_por` | UUID | Não | ID do Admin que inativou. |

## 4. Tabela `resources` (Salas e Equipamentos)
Gerencia a infraestrutura necessária para a execução de um serviço (Regra de Negócio 02). Garante que recursos físicos (como salas de cirurgia) ou lógicos (links de conferência) não sofram *overbooking* (reservas duplicadas no mesmo horário).

**Considerações de Segurança e Design:**
* **Controle de Lotação:** O campo `capacidade_maxima` permite que o sistema suporte tanto atendimentos individuais (padrão 1) quanto serviços em grupo (ex: turmas de Pilates).
* **Governança de Uso:** O campo `requer_aprovacao` trava a alocação de recursos críticos até que um Tenant Admin libere o agendamento.
* **Manutenção Preventiva:** O `status` inativo retira o equipamento temporariamente da grade sem a necessidade de exclusão dos dados históricos.

| Coluna | Tipo de Dado | Obrigatório | Descrição / Regra de Negócio |
| :--- | :--- | :---: | :--- |
| `id` | UUID | Sim | (PK) Identificador único do recurso. |
| `tenant_id` | UUID | Sim | (FK) Trava de isolamento. Pertence a uma única clínica. |
| `status` | ENUM | Sim | Valores: `ativo`, `inativo` (manutenção/indisponível). |
| `nome` | VARCHAR(255) | Sim | Identificação (ex: "Sala de Cirurgia", "Box 03"). |
| `tipo` | ENUM | Sim | Valores: `fisico`, `online`. |
| `capacidade_maxima` | INT | Sim | Limite de agendamentos simultâneos (Padrão: 1). |
| `requer_aprovacao` | BOOLEAN | Sim | Se `true`, exige liberação de um Admin. |
| `observacoes` | TEXT | Não | Detalhes técnicos ou links fixos (ex: URL do Zoom). |
| **[AUDITORIA]** | | | *Rastreabilidade de alterações.* |
| `criado_em` | TIMESTAMP | Sim | Data e hora exata do registro. |
| `criado_por` | UUID | Não | ID do Admin que cadastrou. |
| `alterado_em` | TIMESTAMP | Não | Data da última edição. |
| `alterado_por` | UUID | Não | ID de quem editou. |
| `deletado_em` | TIMESTAMP | Não | Data de inativação (Soft Delete). |
| `deletado_por` | UUID | Não | ID do Admin que inativou. |


## 5. Tabela `appointments` (A Agenda)
O núcleo transacional do sistema. Conecta o Cliente, o Profissional, o Serviço e o Recurso em um espaço de tempo determinado.

**Considerações de Segurança e Design:**
* **Prevenção de Overbooking:** Utiliza `data_hora_inicio` e `data_hora_fim` (UTC) para cálculos de colisão no banco de dados.
* **Integridade Histórica:** Os campos `duracao_aplicada` e `preco_aplicado` garantem que alterações futuras no catálogo de serviços não corrompam o histórico financeiro e de auditoria dos agendamentos passados.
* **Agrupamento Lógico:** O `grupo_recorrencia_id` suporta a manipulação em lote de agendamentos periódicos (RN-05).
* **Auditoria de Status:** A máquina de estados (ENUM) permite rastrear com precisão a origem de cancelamentos e abstenções (`no_show`).

| Coluna | Tipo de Dado | Obrigatório | Descrição / Regra de Negócio |
| :--- | :--- | :---: | :--- |
| `id` | UUID | Sim | (PK) Identificador único da reserva. |
| `tenant_id` | UUID | Sim | (FK) Trava de segurança principal do multi-tenant. |
| `cliente_id` | UUID | Sim | (FK) Usuário que receberá o atendimento. |
| `profissional_id` | UUID | Sim | (FK) Usuário que prestará o atendimento. |
| `servico_id` | UUID | Sim | (FK) O procedimento a ser realizado. |
| `recurso_id` | UUID | Não | (FK) A infraestrutura alocada (opcional). |
| `status` | ENUM | Sim | Valores: `pendente`, `confirmado`, `concluido`, `cancelado_cliente`, `cancelado_profissional`, `no_show`. |
| `data_hora_inicio` | TIMESTAMP | Sim | Início exato do atendimento (UTC). |
| `data_hora_fim` | TIMESTAMP | Sim | Fim exato do atendimento (UTC). |
| `duracao_aplicada` | INT | Sim | Duração efetiva em minutos. |
| `preco_aplicado` | DECIMAL(10,2)| Sim | Valor "congelado" no momento da reserva. |
| `grupo_recorrencia_id`| UUID | Não | Agrupa atendimentos periódicos. |
| `observacoes_cliente` | TEXT | Não | Mensagem enviada pelo cliente. |
| `observacoes_internas`| TEXT | Não | Prontuário básico ou notas da clínica. |
| **[AUDITORIA]** | | | *Rastreabilidade de alterações.* |
| `criado_em` | TIMESTAMP | Sim | Data da solicitação. |
| `criado_por` | UUID | Não | Quem registrou (Nulo se auto-atendimento). |
| `alterado_em` | TIMESTAMP | Não | Data da remarcação. |
| `alterado_por` | UUID | Não | Quem remarcou. |

## Informacoes inseridas em 20260226
## Visão Geral
O sistema utiliza **PostgreSQL 15** (via Docker) com uma arquitetura **Multi-Tenant**. O isolamento dos dados é garantido pela coluna `tenant_id` em todas as tabelas principais.

## Tipos Enumerados (Enums)
Uma descoberta crítica na Fase 3 revelou que o PostgreSQL armazena os valores de forma rígida. A sincronização com o SQLAlchemy deve respeitar a capitalização exata definida na criação do tipo no DB.

### 1. UserStatus
Utilizado para o fluxo de vida da conta do utilizador.
- **Valores (MAIÚSCULO):** `PENDENTE`, `ATIVO`, `INATIVO`.
- **Comportamento:** O código Python deve enviar a string em maiúsculo.

### 2. UserRole
Define o nível de acesso (RBAC).
- **Valores (MAIÚSCULO):** - `TENANT_ADMIN`: Administrador da clínica/tenant.
  - `PROFISSIONAL`: Médicos, dentistas e prestadores de serviço.
  - `CLIENTE`: Pacientes ou utilizadores finais.
- **Nota:** O valor `medico` foi depreciado em favor de `PROFISSIONAL` para manter a compatibilidade com a estrutura legada do banco.

---

## Dicionário de Dados: Tabela `users`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único gerado automaticamente. |
| `tenant_id` | UUID (FK) | Identificador da clínica (Relacionamento com `tenants.id`). |
| `nome` | VARCHAR(255) | Nome completo do utilizador. |
| `email` | VARCHAR(255) | E-mail (único, indexado, usado para login). |
| `cpf` | VARCHAR(20) | CPF (único, indexado). |
| `telefone` | VARCHAR(20) | Telefone principal. |
| `telefone_contato`| VARCHAR(20) | Telefone secundário/contato de emergência. |
| `observacoes` | TEXT | Notas gerais sobre o utilizador. |
| `status` | ENUM | Estado da conta (Default: `PENDENTE`). |
| `papel` | ENUM | Nível de acesso (Ex: `PROFISSIONAL`). |
| `senha_hash` | VARCHAR(255) | Hash da senha gerado via Bcrypt (passlib). |
| `criado_em` | DATETIME | Carimbo de data/hora da criação (via AuditoriaMixin). |

### Endereço (Colunas Independentes)
Para facilitar buscas geográficas, o endereço é armazenado de forma desnormalizada na tabela de utilizadores:
- `endereco_logradouro` (VARCHAR 255)
- `endereco_cidade` (VARCHAR 100)
- `endereco_estado` (VARCHAR 2)
- `endereco_regiao` (VARCHAR 50)

---

## Notas de Manutenção
- **Segurança:** A coluna `senha_hash` nunca deve ser incluída em consultas de listagem ou schemas de resposta (UserResponse).
- **Migrações:** Todas as alterações estruturais são geridas pelo **Alembic**.
