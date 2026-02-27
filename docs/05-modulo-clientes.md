# 👥 Módulo de Clientes (Agnóstico e Multi-Serviço)

O sistema MedSched foi projetado com uma arquitetura flexível para atender ao modelo **SaaS (Software as a Service)**. Para garantir que a plataforma não fique restrita apenas à área da saúde (clínicas/hospitais), a entidade que recebe o serviço foi modelada de forma agnóstica como **`Customer` (Cliente)**.

## 🏢 Visão de Negócios
Um `Customer` pode representar:
* Um paciente (em uma clínica médica ou odontológica).
* Um aluno (em um estúdio de Pilates ou academia).
* Um cliente corporativo/PF (em um escritório de advocacia ou contabilidade).

Para suportar essa flexibilidade, o campo de identificação foi definido como `cpf_cnpj`, permitindo o cadastro tanto de Pessoas Físicas quanto Jurídicas.

## 🔒 Segurança e Isolamento (Multi-Tenant)
Assim como os funcionários (`Users`), os clientes (`Customers`) pertencem a uma empresa/clínica específica (`Tenant`).

**Regras de Ouro implementadas na API (`src/api/v1/endpoints/customer.py`):**
1. **Isolamento Absoluto:** Uma requisição para listar ou criar clientes exige a validação do `tenant_id`. Se o usuário autenticado tentar passar o ID de uma clínica concorrente, a API bloqueia a ação com um erro `HTTP 403 Forbidden`.
2. **Duplicidade Controlada:** O CRUD verifica se já existe o mesmo `cpf_cnpj` cadastrado **dentro do mesmo Tenant**, evitando redundância de dados.
3. **Acesso:** Qualquer usuário autenticado (independente do papel) pode listar e criar clientes para a sua própria clínica, pois essa é a operação base do dia a dia do negócio.

## 🛠️ Stack Utilizada
* **Banco de Dados:** Tabela `customers` gerada via migração automática do Alembic.
* **Validação:** Schemas rigorosos do Pydantic (exigência de `nome`, validação de `EmailStr`, e campos opcionais flexíveis).
* **Roteamento:** Módulo plugado dinamicamente no `main.py` sob o prefixo `/api/v1/customers`
