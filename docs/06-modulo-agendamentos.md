# 📅 Módulo de Agendamentos (O Coração do SaaS)

A entidade `Appointment` é a transação central do MedSched. Ela atua como uma tabela de junção (Junction Table) complexa que conecta todas as bases do sistema.

## 🔗 Relacionamentos (As 3 Chaves)
Para um agendamento existir, ele obrigatoriamente precisa de:
1. **`tenant_id`**: Onde vai acontecer? (A Clínica/Empresa)
2. **`profissional_id`**: Quem vai atender? (Tabela `users`)
3. **`customer_id`**: Quem será atendido? (Tabela `customers`)

## 📸 Arquitetura de "Fotografia" (Snapshot)
Implementamos um padrão de design de software robusto para dados financeiros:
* Campos como `preco_aplicado` e `duracao_aplicada` gravam a "fotografia" do momento do agendamento.
* **Motivo:** Se a clínica aumentar o preço da consulta de R$ 100 para R$ 150 no ano que vem, os agendamentos do passado manterão o valor de R$ 100 intacto, garantindo a integridade dos relatórios financeiros.

## 🚥 Máquina de Estados (Status)
O ciclo de vida da consulta é controlado por um `Enum`:
* `PENDENTE` -> `CONFIRMADO` -> `CONCLUIDO`
* Fluxos de exceção: `CANCELADO_CLIENTE`, `CANCELADO_PROFISSIONAL`, `NO_SHOW` (Faltou).

## 🔒 Isolamento e Segurança
A camada de API protege a agenda de duas formas:
1. Um usuário só pode ver/criar agendamentos do seu próprio `tenant_id`.
2. A rota `/api/v1/appointments/agenda/me` filtra automaticamente os agendamentos para mostrar apenas os do `profissional_id` logado no momento.
