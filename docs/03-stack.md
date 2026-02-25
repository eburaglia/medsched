# 📄 FASE 3: Stack Tecnológica e Infraestrutura
**Sistema Multi-Tenant de Agendamento de Serviços**

## 1. Visão Geral da Arquitetura
O sistema adota uma arquitetura conteinerizada (Docker) em 3 camadas (Frontend, Backend API e Banco de Dados), garantindo isolamento total do sistema operacional host (`/opt/medsched`). A comunicação entre as camadas ocorre estritamente via rede interna do Docker, expondo apenas as portas seguras previamente mapeadas.

## 2. Tecnologias Escolhidas (O Arsenal)

* **Banco de Dados (Storage Tier): `PostgreSQL`**
    * *Motivo:* Conformidade total com a Fase 2 (Modelagem de Dados). Suporte nativo a UUIDs, integridade referencial complexa e alta performance para arquiteturas Multi-Tenant (Isolamento Lógico).
* **Backend (Logic Tier / API): `Python` (com `FastAPI`)**
    * *Motivo:* Segurança, legibilidade e performance assíncrona. O FastAPI será responsável por aplicar todas as regras de negócio, validar permissões de Tenant e fornecer endpoints RESTful seguros para o Frontend.
* **Frontend (Presentation Tier): `React`**
    * *Motivo:* Criação de uma Single Page Application (SPA) responsiva (Mobile-First). Garante que a interface se adapte perfeitamente a celulares, tablets e desktops, consumindo a API Python de forma assíncrona.
* **Orquestração e Infraestrutura: `Docker` e `Docker Compose`**
    * *Motivo:* Elimina o problema "funciona na minha máquina". Substitui a necessidade de gerenciadores de processo (como PM2), pois o próprio daemon do Docker monitora e reinicia os containers em caso de falha.

## 3. Topologia de Rede e Portas (High Ports)
Para evitar conflitos com serviços do sistema operacional e garantir um ambiente isolado, foram designadas portas efêmeras na faixa de `40000` a `45000`.

| Serviço | Container Docker | Porta Interna | Porta Externa (Host) | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Banco de Dados** | `medsched-db` | 5432 | **45432** | Conexão de dados (PostgreSQL) |
| **API Backend** | `medsched-api` | 8000 | **40000** | Cérebro do sistema (Python/FastAPI) |
| **Interface UI** | `medsched-web` | 3000 | **40001** | Interface do usuário (React) |

## 4. Estrutura de Diretórios (`/opt/medsched/`)
A organização do repositório reflete a separação de responsabilidades. O código de interface jamais se mistura com as regras de negócio.

```text
/opt/medsched/
├── docs/                  # Documentação de Arquitetura (Docs as Code)
├── backend/               # Aplicação Python / FastAPI e seu Dockerfile
├── frontend/              # Aplicação React SPA e seu Dockerfile
├── docker-compose.yml     # Orquestrador Central da Infraestrutura
├── .env                   # Variáveis de Ambiente (Senhas, chaves) - Ignorado no Git
├── .gitignore             # Regras de proteção do repositório
└── README.md              # Apresentação do projeto
