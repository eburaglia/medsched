# 🏢 Módulo de Recursos (Salas e Equipamentos)

A entidade `Resource` gerencia a infraestrutura física e virtual da clínica. É a chave para evitar conflitos operacionais, como agendar duas consultas no mesmo consultório ao mesmo tempo.

## 🧠 Inteligência de Negócios Implementada
* **`tipo` (Físico/Online):** Prepara o sistema para um modelo de negócios híbrido (Telemedicina + Atendimento Presencial).
* **`capacidade_maxima`:** Essencial para modalidades em grupo (Pilates, Treinamento Funcional, Terapias em Grupo), permitindo que o agendamento saiba quantos "espaços" ainda restam na sala.
* **`requer_aprovacao`:** Trava de segurança para equipamentos de alto custo ou salas de cirurgia, onde a reserva exige uma segunda camada de validação da gerência.
