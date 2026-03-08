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

echo "====================================================" > saida.txt
echo "=========                      Iniciando Export do arquivo ${ARQUIVO}.py ===============" >> saida.txt
echo "====================================================" >> saida.txt
echo "    ARQUIVO MODELS/${ARQUIVO^^}.PY" >> saida.txt 
echo "====================================================" >> saida.txt
cat "/opt/medsched/backend/src/models/${ARQUIVO}.py" >> saida.txt 2>/dev/null || echo "Arquivo não encontrado: models/${ARQUIVO}.py" >> saida.txt
echo "====================================================" >> saida.txt
echo "    ARQUIVO SCHEMAS/${ARQUIVO^^}.PY" >> saida.txt
echo "====================================================" >> saida.txt
cat "/opt/medsched/backend/src/schemas/${ARQUIVO}.py" >> saida.txt 2>/dev/null || echo "Arquivo não encontrado: schemas/${ARQUIVO}.py" >> saida.txt
echo "====================================================" >> saida.txt
echo "    ARQUIVO CRUD/${ARQUIVO^^}.PY" >> saida.txt
echo "====================================================" >> saida.txt
cat "/opt/medsched/backend/src/crud/${ARQUIVO}.py" >> saida.txt 2>/dev/null || echo "Arquivo não encontrado: crud/${ARQUIVO}.py" >> saida.txt
echo "====================================================" >> saida.txt
echo "    ARQUIVO API/V1/ENDPOINTS/${ARQUIVO^^}.PY" >> saida.txt
echo "====================================================" >> saida.txt
cat "/opt/medsched/backend/src/api/v1/endpoints/${ARQUIVO}.py" >> saida.txt 2>/dev/null || echo "Arquivo não encontrado: api/v1/endpoints/${ARQUIVO}.py" >> saida.txt
echo "====================================================" >> saida.txt

echo "Exportação concluída para o arquivo: ${ARQUIVO}.py"
