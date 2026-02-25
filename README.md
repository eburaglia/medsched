# 🏥 MedSched - Sistema Multi-Tenant de Agendamentos

Sistema robusto de agendamento de serviços, projetado com arquitetura Multi-Tenant nativa (SaaS), alta segurança de isolamento de dados e design responsivo.

## 📌 Status Atual do Projeto
**Fase Atual:** Iniciando Fase 4 (Implementação e Persistência)

### ✅ O Que Já Foi Concluído (Fases 1 a 3)

* **Fase 1: Escopo e Regras de Negócio**
  * Definição de arquitetura SaaS Multi-Tenant.
  * Estabelecimento de regras de aprovação de cadastros, auditoria de dados e gestão de recursos físicos/online para prevenção de *overbooking*.
* **Fase 2: Modelagem de Dados Relacional**
  * Adoção de **Isolamento Lógico (Row-level)** via `tenant_id` (UUID).
  * Desenho de 5 tabelas fundamentais: `tenants` (Empresas), `users` (Atores), `services` (Catálogo), `resources` (Salas/Equipamentos) e `appointments` (Agenda Transacional).
  * Implementação rigorosa de campos de auditoria (Criação, Alteração e Soft Delete).
* **Fase 3: Infraestrutura e Stack Tecnológica**
  * Implementação de ambiente 100% conteinerizado (Docker e Docker Compose).
  * **Banco de Dados (Porta 45432):** PostgreSQL 15.
  * **Backend / API (Porta 40000):** Python 3.11 com FastAPI (Arquitetura REST).
  * **Frontend / UI (Porta 40001):** React.js com Vite (Mobile-First SPA).
  * **Controle de Versão:** Adoção do padrão Git Flow, com separação estrita entre a branch `main` (Produção) e `develop` (Bancada de Trabalho).

## 🚀 Como Rodar o Ambiente Local

O projeto exige o Docker instalado na máquina host.

1. Clone este repositório.
2. Crie um arquivo `.env` na raiz (utilize os parâmetros padrão do time de desenvolvimento).
3. Execute o orquestrador:
   ```bash
   docker compose up -d --build



Acesso aos serviços:
Frontend (React): http://localhost:40001
Backend API (FastAPI): http://localhost:40000
Banco de Dados: localhost:45432
