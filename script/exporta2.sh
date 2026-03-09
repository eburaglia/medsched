#!/bin/bash

# Script: exporta.sh
# Uso: ./exporta.sh nome_do_arquivo

# Verifica se o nome do arquivo foi fornecido
if [ $# -eq 0 ]; then
    echo "Erro: Nome do arquivo não fornecido"
    echo "Uso: ./exporta.sh nome_do_arquivo"
    echo "Exemplo: ./exporta.sh user.py"
    exit 1
fi

# Remove a extensão .py se fornecida (opcional)
ARQUIVO=$(basename "$1" .py)

cd /opt/medsched/script || exit 1

echo "====================================================" > saida2.txt


echo "=== CUSTOMERS.JSX ===" >> saida2.txt
cat /opt/medsched/frontend/src/pages/Customers.jsx >> saida2.txt

echo -e "\n=== MODEL CUSTOMER ===" >> saida2.txt
cat /opt/medsched/backend/src/models/customer.py >> saida2.txt

echo -e "\n=== SCHEMA CUSTOMER ===" >> saida2.txt
cat /opt/medsched/backend/src/schemas/customer.py >> saida2.txt

echo -e "\n=== CRUD CUSTOMER ===" >> saida2.txt
cat /opt/medsched/backend/src/crud/customer.py >> saida2.txt

echo -e "\n=== ENDPOINTS CUSTOMER ===" >> saida2.txt
cat /opt/medsched/backend/src/api/v1/endpoints/customer.py >> saida2.txt
