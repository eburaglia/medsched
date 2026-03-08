from fastapi import APIRouter, HTTPException
import urllib.request
import json

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
