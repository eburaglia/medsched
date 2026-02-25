# Usa uma imagem oficial do Python, versão enxuta (slim) para segurança e performance
FROM python:3.11-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Impede o Python de gravar arquivos .pyc no disco (performance)
ENV PYTHONDONTWRITEBYTECODE 1
# Garante que os logs do Python saiam direto no terminal do Docker (sem atraso)
ENV PYTHONUNBUFFERED 1

# Instala dependências do sistema necessárias para o psycopg2 (Postgres)
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências do Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código da pasta backend local para o /app do container
COPY . .

# Expõe a porta interna que o FastAPI vai usar
EXPOSE 8000

# Comando para iniciar o servidor, apontando para o arquivo main.py dentro de src/
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
