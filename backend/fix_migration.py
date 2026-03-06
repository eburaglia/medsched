import glob

# Busca o arquivo de migração que deu erro
files = glob.glob('/opt/medsched/backend/alembic/versions/*_add_audit_and_status_to_customers.py')
if files:
    filepath = files[0]
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Injeta o código SQL para criar o ENUM no Postgres (ignorando se já existir)
    sql_inj = """def upgrade() -> None:
    op.execute("DO $$ BEGIN CREATE TYPE customerstatus AS ENUM ('ativo', 'inativo', 'ATIVO', 'INATIVO'); EXCEPTION WHEN duplicate_object THEN null; END $$;")"""
    
    if "CREATE TYPE customerstatus" not in content:
        content = content.replace("def upgrade() -> None:", sql_inj)
        
        # 2. Injeta um valor padrão (server_default) para não quebrar a tabela se já tiver dados
        content = content.replace("name='customerstatus'), nullable=False)", "name='customerstatus'), server_default='ativo', nullable=False)")
        
        with open(filepath, 'w') as f:
            f.write(content)
        print("✅ Arquivo de migração corrigido com sucesso!")
else:
    print("❌ Arquivo de migração não encontrado.")
