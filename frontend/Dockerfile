# Usa a imagem oficial do Node.js, versão leve (alpine)
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração de dependências primeiro (para otimizar o cache do Docker)
COPY package.json package-lock.json* ./

# Instala as dependências do React (node_modules)
RUN npm install

# Copia o restante do código do frontend
COPY . .

# Expõe a porta interna que configuraremos para o Vite
EXPOSE 3000

# Inicia o servidor de desenvolvimento do Vite, liberando o acesso externo na porta 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
