# 🏥 MedSched - Sistema Multi-Tenant de Agendamentos

Sistema robusto de agendamento de serviços, projetado com arquitetura Multi-Tenant nativa (SaaS), alta segurança de isolamento de dados e design responsivo.

## 📌 Status Atual do Projeto
**Fase Atual:** Fase 4 (Implementação da API RESTful e Regras de Negócio)

### ✅ O Que Já Foi Concluído (Fases 1 a 3)

* **Fase 1: Escopo e Regras de Negócio**
  * Definição de arquitetura SaaS Multi-Tenant.
  * Regras de prevenção de *overbooking* e auditoria.
* **Fase 2: Modelagem de Dados Relacional**
  * Desenho lógico de 5 tabelas de negócio e 1 tabela de isolamento (Super Admin).
* **Fase 3: Infraestrutura e Stack Tecnológica**
  * Ambiente 100% conteinerizado (Docker Compose).
  * Backend API (FastAPI) na porta `40000`.
  * Frontend UI (React/Vite) na porta `40001`.
  * Banco de Dados (PostgreSQL) na porta `45432`.

### 🏗️ Fase 4: Persistência e API (Em Andamento)

* **ORM e Banco de Dados (Concluído):**
  * Abordagem *Code-First* implementada com SQLAlchemy.
  * Modelos criados: `Tenant`, `User`, `Service`, `Resource`, `Appointment` e a tabela isolada de backoffice `SuperAdmin`.
  * DNA de Auditoria centralizado via `AuditoriaMixin` (UUIDs nativos, Soft Delete, Rastreamento de autoria).
  * Motor de migrações estruturais implementado e executado via **Alembic**. Banco de dados físico sincronizado com o código Python.
* **Próximo Passo Lógico:** Construção dos Endpoints (Rotas), Schemas (Pydantic) e CRUD para a entidade raiz (`Tenant`).

## 🚀 Status do Projeto: Fase 4 Concluída

Atualmente, o núcleo do sistema está operacional com suporte a múltiplos inquilinos (Tenants) e gestão segura de utilizadores.

### ✅ O que já foi implementado:
- [x] **Arquitetura de Containers:** Ambiente isolado com Docker e Docker Compose (API + PostgreSQL).
- [x] **Mapeamento de Redes:** Porta externa `40000` roteada para o serviço interno do Uvicorn.
- [x] **Isolamento Multi-Tenant:** Implementação de lógica de `tenant_id` em nível de banco de dados para separação total de dados entre clínicas.
- [x] **Segurança de Identidade:** Criptografia de senhas com `Bcrypt` e `passlib`, utilizando versionamento fixo para garantir compatibilidade de infraestrutura.
- [x] **Persistência de Dados:** Modelagem ORM com SQLAlchemy e sistema de migrações automáticas com Alembic.
- [x] **Documentação Automática:** OpenAPI (Swagger) totalmente funcional e tipada.


## 🛠️ Stack Tecnológica
- **Linguagem:** Python 3.11+
- **Framework:** FastAPI
- **Banco de Dados:** PostgreSQL 15
- **ORM:** SQLAlchemy 2.0
- **Migrações:** Alembic
- **DevOps:** Docker / Docker Compose

---

## 🚦 Próximos Passos
- [ ] **Autenticação JWT:** Implementação de tokens de acesso seguros para login.
- [ ] **RBAC (Role-Based Access Control):** Restrição de endpoints baseada nos papéis (PROFISSIONAL, ADMIN, CLIENTE).
- [ ] **Módulo de Agendamentos:** Lógica central de horários e disponibilidade.

---


## 🚀 Como Rodar o Ambiente Local

1. Clone este repositório.
2. Crie um arquivo `.env` na raiz (utilize os parâmetros padrão do time de desenvolvimento).
3. Execute o orquestrador:
   ```bash
   docker compose up -d --build


Documentação da API (Swagger): http://localhost:40000/docs
Frontend (React): http://localhost:40001
Backend API (FastAPI): http://localhost:40000 
Banco de Dados: localhost:45432
