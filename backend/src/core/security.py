from passlib.context import CryptContext

# ---------------------------------------------------------
# 🛡️ CONFIGURAÇÃO DE CRIPTOGRAFIA
# Definimos o bcrypt como o algoritmo padrão de hash.
# O parâmetro deprecated="auto" permite que a biblioteca 
# atualize hashes antigos no futuro, se necessário.
# ---------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Recebe uma senha em texto plano e retorna o hash criptografado.
    Este é o valor que será salvo no banco de dados na coluna senha_hash.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara a senha digitada pelo usuário no momento do login
    com o hash armazenado no banco de dados.
    Retorna True se a senha for válida, False caso contrário.
    """
    return pwd_context.verify(plain_password, hashed_password)
