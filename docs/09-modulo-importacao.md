# 📥 Módulo de Importação (Motor ETL)

O sistema possui um pipeline de ETL (Extract, Transform, Load) assíncrono projetado para migração de dados em massa (Onboarding de novas clínicas).

## 🏗️ Arquitetura de Staging Area
Para evitar corrupção da base de dados principal, utilizamos o padrão de **Staging Area** com o poder do `JSONB` do PostgreSQL:
1. **Upload (`import_batches`):** O arquivo Excel/CSV é recebido, e suas linhas são salvas de forma bruta (`raw_data`) na tabela `import_rows`.
2. **Validação (Inspetor):** O sistema aplica as regras de negócio do Pydantic (ex: e-mail duplicado, formatação de telefone) e atualiza o status de cada linha (`VALID`, `INVALID`, `DUPLICATED`).
3. **Promoção:** O usuário aprova o lote. O sistema insere os dados válidos nas tabelas oficiais (ex: `customers`) e realiza o *Hard Delete* (limpeza física) da Staging Area, mantendo o banco otimizado.
