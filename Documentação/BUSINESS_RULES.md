# BUSINESS_RULES.md

## Regras de negócio do MVP

Este documento concentra as regras que não podem ser quebradas durante a implementação.

---

# 1. Receitas

Receitas podem ser:

- recorrentes;
- eventuais.

Exemplos recorrentes:

- salário;
- aluguel recebido;
- comissão fixa.

Exemplos eventuais:

- premiação;
- bônus;
- venda;
- renda extra;
- reembolso.

Receita recebida em conta deve aumentar o saldo.

Receita apenas prevista não deve alterar saldo até ser efetivada.

---

# 2. Despesas

Despesas podem ser:

- recorrentes;
- eventuais;
- parceladas.

A forma de pagamento define o comportamento financeiro.

---

# 3. Pix, débito e dinheiro

Se a despesa for paga via:

- PIX;
- DEBIT;
- CASH;

ela deve estar associada a uma conta.

Somente quando efetivamente paga deve reduzir o saldo.

---

# 4. Cartão de crédito

Compra no cartão:

- não reduz o saldo da conta;
- reduz o limite disponível;
- entra em uma fatura;
- representa uma despesa.

Ao pagar a fatura:

- reduzir o saldo da conta escolhida;
- marcar a fatura como paga;
- não gerar nova despesa analítica.

O pagamento da fatura é liquidação financeira, não uma segunda despesa.

---

# 5. Faturas

A fatura deve ser determinada pela:

- data da compra;
- data de fechamento do cartão.

Compras antes e depois do fechamento podem pertencer a competências diferentes.

A lógica deve estar centralizada em serviço de domínio.

---

# 6. Saldo

Saldo de conta:

`saldo inicial + entradas efetivadas - saídas efetivadas`

Transferências devem:

- reduzir origem;
- aumentar destino;
- manter resultado financeiro líquido igual a zero.

---

# 7. Recorrência

Recorrência é obrigatória no MVP.

Pode existir para:

- receita;
- despesa.

Exemplos:

- salário;
- aluguel;
- internet;
- financiamento.

A recorrência é um modelo gerador de lançamentos.

---

# 8. Snapshot de recorrência

Regra crítica:

Cada lançamento gerado por recorrência deve possuir seus próprios dados.

Nunca reconstruir histórico apenas consultando a configuração atual da recorrência.

Exemplo:

Salário até setembro:

R$ 3.500

Novo valor a partir de outubro:

R$ 3.800

Resultado:

- setembro continua R$ 3.500;
- outubro passa a R$ 3.800;
- meses futuros seguem R$ 3.800.

Lançamentos passados não podem ser alterados automaticamente.

---

# 9. Versionamento da recorrência

Ao alterar uma recorrência:

1. encerrar versão vigente;
2. criar nova versão;
3. definir `valid_from`;
4. preservar versões anteriores.

Nunca sobrescrever versão histórica.

---

# 10. Edição de recorrência

Permitir conceitos como:

- somente este lançamento;
- este e próximos;
- alterar regra futura.

A opção padrão deve favorecer alterações futuras.

Nunca alterar automaticamente lançamentos já pagos ou recebidos.

---

# 11. Override

Um lançamento gerado por recorrência pode ser alterado individualmente.

Exemplo:

Aluguel padrão:

R$ 1.200

Novembro excepcional:

R$ 1.280

Dezembro:

R$ 1.200

Novembro deve ser marcado como override.

Alterar um mês específico não altera a recorrência nem os próximos meses.

---

# 12. Geração de recorrências

A geração pode ocorrer antecipadamente.

Exemplo:

Gerar lançamentos dos próximos meses.

Ao gerar, copiar para a transaction:

- descrição;
- valor;
- categoria;
- forma de pagamento;
- conta/cartão;
- versão usada.

Após gerada, a transaction passa a ser independente.

---

# 13. Parcelamentos

Uma compra parcelada gera:

- um installment_group;
- várias transactions.

Cada parcela deve possuir:

- número;
- total de parcelas;
- competência;
- fatura correta.

Exemplo:

1/12
2/12
3/12

---

# 14. Transferências

Transferência entre contas:

- não é receita;
- não é despesa;
- não altera resultado mensal;
- deve possuir rastreabilidade.

Usar `transfer_group_id` para vincular as movimentações.

---

# 15. Veículos

Um veículo pode aceitar múltiplos combustíveis.

Não representar veículo flex apenas como:

`FLEX`

Registrar combustíveis aceitos individualmente.

Exemplo:

- GASOLINE
- ETHANOL

---

# 16. Abastecimento

Ao registrar abastecimento, informar:

- veículo;
- data;
- quilometragem;
- combustível;
- litros;
- valor total;
- tanque cheio;
- forma de pagamento.

Preço por litro é calculado automaticamente:

`total_amount / liters`

Usuário não precisa digitar o preço por litro.

---

# 17. Abastecimento e financeiro

Todo abastecimento deve gerar uma única transaction de despesa.

Não exigir segundo lançamento manual.

`fuel_entries.transaction_id` deve apontar para a transaction correspondente.

O módulo de veículo armazena os dados técnicos.

A transaction representa o impacto financeiro.

---

# 18. Pagamento do abastecimento

Se:

- PIX;
- DEBIT;
- CASH;

selecionar conta e impactar saldo após liquidação.

Se:

- CREDIT_CARD;

selecionar cartão, associar à fatura e reduzir limite disponível.

Não reduzir saldo da conta no momento da compra no cartão.

---

# 19. Quilometragem

A quilometragem de um novo abastecimento não deve ser inferior ao último registro válido do veículo, salvo fluxo explícito de correção.

Atualizar `current_odometer` quando um lançamento mais recente e válido for registrado.

---

# 20. Consumo

Para cálculo confiável de consumo, priorizar abastecimentos marcados como tanque cheio.

Fórmula base:

`km rodados / litros abastecidos`

Exemplo:

Km anterior:

81.980

Km atual:

82.450

Distância:

470 km

Litros:

34,2

Consumo:

13,74 km/l

---

# 21. Custo por km

Fórmula:

`valor abastecido / km rodados`

Exemplo:

R$ 146,72 / 470 km = R$ 0,31/km

---

# 22. Comparação de combustível

Para veículo flex, comparar combustível pelo custo real por quilômetro.

Exemplo:

Etanol:

R$ 0,38/km

Gasolina:

R$ 0,42/km

O sistema pode indicar qual está sendo mais econômico com base nos dados reais.

Não depender apenas da regra genérica de 70%.

---

# 23. Status

Movimentações:

- PENDING;
- PAID;
- RECEIVED;
- OVERDUE;
- CANCELLED.

Somente movimentações efetivadas alteram saldo.

---

# 24. Competência

Diferenciar:

- data do lançamento;
- competência;
- vencimento;
- liquidação.

Exemplo:

Conta de setembro paga em outubro pode continuar sendo analisada como setembro.

---

# 25. Categorias

Categorias podem ser:

- INCOME;
- EXPENSE;
- BOTH.

Desativar categoria não deve apagar histórico.

---

# 26. Disponível para gastar

Indicador conceitual:

`saldo atual - despesas pendentes - faturas - compromissos próximos`

O cálculo pode evoluir, mas deve permanecer separado de `saldo atual`.

Saldo e dinheiro disponível para gastar não são a mesma coisa.

---

# 27. Histórico

Histórico financeiro deve ser preservado.

Mudanças em:

- conta;
- cartão;
- categoria;
- recorrência;
- veículo;

não podem corromper ou apagar dados passados.

---

# 28. Segurança

Usuário só pode acessar workspaces dos quais faça parte.

RLS obrigatório.

Nenhuma regra de autorização deve depender exclusivamente da interface.

---

# 29. Integridade

Operações envolvendo múltiplas tabelas devem ser atômicas.

Casos obrigatórios:

- abastecimento;
- transferência;
- pagamento de fatura;
- parcelamento;
- atualização de recorrência.

---

# 30. Testes obrigatórios

## Recorrência

Alterar valor a partir de outubro não altera setembro.

## Override

Alterar apenas novembro não altera dezembro.

## Cartão

Compra antes/depois do fechamento entra na fatura correta.

## Pagamento de fatura

Conta deve ser debitada uma única vez.

## Transferência

Não altera total de receita/despesa.

## Abastecimento

Preço por litro calculado corretamente.

## Consumo

Cálculo somente com dados válidos.

## Flex

Comparação de combustíveis deve usar dados do próprio veículo.
