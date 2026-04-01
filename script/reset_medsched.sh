
#!/bin/bash



# Configurações de cores para o terminal

GREEN='\033[0;32m'

YELLOW='\033[1;33m'

BLUE='\033[0;34m'

NC='\033[0m'



echo -e "${BLUE}=======================================================${NC}"

echo -e "${BLUE}       🔄 INTERFACE DE MANUTENÇÃO MEDSCHED             ${NC}"

echo -e "${BLUE}=======================================================${NC}"



# 1. PERGUNTA SOBRE O BACKUP

echo -e "${YELLOW}❓ Deseja realizar o backup do banco de dados antes do reset? (y/n)${NC}"

read -r answer



if [[ "$answer" =~ ^([yY][eE][sS]|[yY])$ ]]; then

    BACKUP_DIR="/opt/medsched/backup"

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

    FILENAME="backup_medsched_${TIMESTAMP}.sql"

    

    echo -e "${BLUE}💾 Iniciando backup...${NC}"

    mkdir -p "$BACKUP_DIR"

    

    docker exec medsched-db pg_dump -U postgres medsched_db > "${BACKUP_DIR}/${FILENAME}"

    

    if [ $? -eq 0 ]; then

        echo -e "${GREEN}✅ Backup concluído com sucesso em: ${BACKUP_DIR}/${FILENAME}${NC}"

    else

        echo -e "\033[0;31m❌ FALHA NO BACKUP! Operação interrompida para sua segurança.\033[0m"

        exit 1

    fi

else

    echo -e "${YELLOW}⚠️  Pulando backup por solicitação do usuário...${NC}"

fi



echo ""

echo -e "${BLUE}2/4 🛑 Derrubando estritamente os containers do MedSched...${NC}"

# Derruba apenas os containers e redes listados no nosso docker-compose.yml

docker-compose down



echo ""

echo -e "${BLUE}3/4 👻 Limpando resíduos locais (Sem afetar outros projetos)...${NC}"

# Remove os containers parados locais caso o 'down' tenha deixado algo

docker-compose rm -f

# Reconstrói as imagens locais forçando ignorar o cache antigo (mata o volume fantasma)

docker-compose build --no-cache



echo ""

echo -e "${BLUE}4/4 🏗️  Subindo a infraestrutura atualizada...${NC}"

# Força a recriação dos containers com a nova build

docker-compose up -d --force-recreate



echo ""

echo -e "${GREEN}✅ SISTEMA RESTAURADO! Verificando motores:${NC}"

echo "-------------------------------------------------------"

docker ps | grep medsched

echo "-------------------------------------------------------"

echo -e "${GREEN}🚀 Acesse: http://localhost:40001${NC}"

echo -e "${BLUE}=======================================================${NC}"

