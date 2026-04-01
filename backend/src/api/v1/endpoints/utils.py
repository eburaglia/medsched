from fastapi import APIRouter, HTTPException, Depends
import urllib.request
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.database import get_db

router = APIRouter(prefix="/utils", tags=["Utilidades Gerais"])

@router.get("/cep/{cep}")
def buscar_cep(cep: str):
    # Limpa o CEP para deixar só números
    clean_cep = "".join(filter(str.isdigit, cep))
    
    if len(clean_cep) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido. Deve conter 8 dígitos.")
    
    try:
        # Bate na API pública do ViaCEP usando biblioteca nativa do Python
        url = f"https://viacep.com.br/ws/{clean_cep}/json/"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            if "erro" in data:
                raise HTTPException(status_code=404, detail="CEP não encontrado.")
                
            return data
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Falha ao consultar o serviço de CEP: {str(e)}")

# 👇 DRCODE: Nova rota dinâmica que lê as categorias do Banco de Dados
@router.get("/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    try:
        # Busca todas as categorias ordenadas
        result = db.execute(text("SELECT macro, micro FROM system_categories ORDER BY macro, micro")).fetchall()
        
        categorias = {}
        for row in result:
            macro = row.macro
            micro = row.micro
            if macro not in categorias:
                categorias[macro] = []
            categorias[macro].append(micro)
            
        return categorias
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar categorias: {str(e)}")
