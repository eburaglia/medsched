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




