from src.database import engine
from sqlalchemy import text
conn = engine.connect()
conn.execute(text('DROP TABLE IF EXISTS appointments CASCADE'))
conn.commit()
conn.execute(text('DROP TYPE IF EXISTS appointmentstatus CASCADE'))
conn.commit()
print('Tabela Limpa!')
conn.close()
