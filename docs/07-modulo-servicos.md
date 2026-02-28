# 🏷️ Módulo de Serviços (O Catálogo de Faturamento)

A entidade `Service` representa o que a clínica/empresa vende. Ela padroniza o atendimento e é fundamental para o módulo financeiro e a organização da agenda.

## ⚙️ Regras de Negócio e Faturamento
* **`duracao_minutos`**: Define o tamanho do "bloco" que será reservado na agenda do profissional. Garante que um "Procedimento Complexo" não seja agendado no mesmo espaço de tempo de uma "Consulta de Retorno".
* **`preco`**: O valor base do serviço.
* **`status` (ATIVO/INATIVO)**: Permite que a clínica pare de oferecer um serviço sem precisar deletá-lo do banco de dados (o que corromperia o histórico financeiro de consultas passadas).

## 🔗 Próximos Passos de Integração
Com o catálogo criado, o próximo passo arquitetônico é religar a trava de `ForeignKey` na tabela de Agendamentos (`appointments`), garantindo que toda consulta esteja obrigatoriamente vinculada a um serviço válido.
