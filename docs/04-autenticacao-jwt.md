# 🔐 Módulo de Autenticação e Segurança (JWT)

O sistema MedSched utiliza o padrão **OAuth2 com Password Flow** e **JSON Web Tokens (JWT)** para garantir a segurança das rotas e o isolamento dos tenants.

## ⚙️ Como o Fluxo Funciona

1. **Login (`POST /api/v1/auth/login`):** - O cliente envia as credenciais (e-mail e senha) via formulário (`application/x-www-form-urlencoded`).
   - A API valida o hash da senha usando a biblioteca `passlib` (com `bcrypt`).
   - Se validado, a função `create_access_token` (`src/core/auth.py`) emite um JWT assinado com a `SECRET_KEY` do servidor.
   - **Payload do Token:** O token embute o `user_id` (sub) e o `tenant_id`, eliminando a necessidade de consultas extras ao banco para descobrir a qual clínica o usuário pertence.

2. **Acesso Protegido (Injeção de Dependência):**
   - Rotas privadas utilizam a dependência `get_current_user` (`src/api/deps.py`).
   - Este "guarda de segurança" intercepta a requisição, decodifica o JWT, valida a assinatura e a expiração, e retorna o objeto `User` instanciado do banco de dados.
   - Usuários com status `INATIVO` são bloqueados imediatamente nesta camada (HTTP 403).

3. **Filtragem de Dados (Schemas):**
   - Para evitar vazamento de dados sensíveis (como `senha_hash`), as respostas da API são filtradas pelo modelo Pydantic `UserResponse` (`from_attributes=True`), que expõe apenas os dados públicos do perfil.

## ⚠️ Regras de Ouro de Roteamento (FastAPI)

Durante o desenvolvimento, estabelecemos uma regra de arquitetura crucial para evitar erros `422 Unprocessable Entity`:
* **A Ordem Importa:** Rotas estáticas (como `GET /users/me`) **devem sempre ser declaradas ANTES** de rotas dinâmicas (como `GET /users/{user_id}`). Caso contrário, o roteador do FastAPI tentará interpretar a string "me" como um UUID válido.
