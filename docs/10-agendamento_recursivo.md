## [Atualização] - Módulo de Agendamentos e Sincronização de Banco
**Data:** 04 de Março de 2026

### 🚀 Novas Funcionalidades (Features)
* **Seed Definitivo:** Criado script de inicialização (`seed.py`) que respeita 100% das regras de negócio e constraints de `Tenant` e `User`, permitindo a criação atômica da "Clínica Master" e do usuário "Dr. Admin" sem violação de chaves nulas.
* **Agendamentos Recorrentes (Two-Step Pattern):**
  * Implementado Endpoint de **Projeção** (`POST /appointments/recorrencia/projecao`): Recebe a regra de repetição (ex: Semanal) e calcula as datas futuras, checando conflitos na agenda do profissional sem gravar no banco (Rascunho).
  * Implementado Endpoint de **Efetivação em Lote** (`POST /appointments/recorrencia/lote`): Grava as sessões projetadas em uma única transação atômica, unindo-as sob o mesmo `grupo_recorrencia_id` (UUID) para facilitar cancelamentos em série no futuro.

### 🛠 Correções e Refatorações (Fixes & Chores)
* **Sincronização do Banco de Dados (Alembic):** * Corrigida a divergência entre o modelo Python e a tabela física do PostgreSQL.
  * Mapeada a coluna `profissional_id` do SQLAlchemy para ler a coluna física `professional_id` do banco.
  * Gerada e aplicada nova migração (`889d1ad42d67_sincroniza_colunas_appointments`) adicionando as colunas faltantes: `duracao_aplicada`, `preco_aplicado`, `observacoes_cliente`, e `observacoes_internas`.
  * Adicionado o `postgresql_using` para realizar o *cast* seguro da coluna `status` de VARCHAR para o tipo ENUM restrito.
