# ARCHITECTURE.md

## Visão arquitetural

A aplicação deve utilizar uma arquitetura simples, modular e orientada por domínio.

O objetivo é impedir que regras financeiras fiquem acopladas à interface React.

---

## Princípios

- TypeScript strict.
- Evitar `any`.
- Componentes React focados em UI.
- Regras de negócio em services/use cases.
- Acesso ao banco isolado.
- Validação centralizada.
- Operações financeiras críticas executadas no servidor.
- Operações envolvendo múltiplas tabelas devem ser atômicas.
- Não duplicar regra de negócio entre frontend e backend.
- Não criar abstrações sem necessidade.

---

## Estrutura sugerida

```text
src/
  app/
    (auth)/
    (app)/
      dashboard/
      transactions/
      accounts/
      cards/
      recurrences/
      vehicles/
      fuel/
      settings/

  components/
    ui/
    forms/
    finance/
    vehicles/
    layout/

  features/
    transactions/
    accounts/
    cards/
    invoices/
    recurrences/
    vehicles/
    fuel/

  services/
    finance/
    cards/
    recurrences/
    fuel/

  repositories/

  lib/
    supabase/
    validations/
    money/
    dates/
    utils/

  types/

  constants/
```

A estrutura pode ser adaptada, mas a separação de responsabilidades deve ser preservada.

---

## Camadas

### UI

Responsável por:

- exibição;
- interação;
- estados visuais;
- formulários;
- feedback ao usuário.

Não deve conter regras financeiras complexas.

### Services / Use Cases

Responsáveis por regras como:

- criação de lançamento;
- cálculo de fatura;
- pagamento de fatura;
- geração de recorrência;
- atualização de recorrência;
- criação de transferência;
- criação de abastecimento;
- cálculo de consumo.

Exemplos de funções:

```ts
createTransaction()
createFuelEntry()
createTransfer()
payInvoice()
createRecurrence()
updateRecurrenceFromDate()
resolveInvoiceForPurchase()
calculateFuelEfficiency()
```

### Repositories

Responsáveis por:

- SELECT;
- INSERT;
- UPDATE;
- DELETE controlado;
- chamadas RPC.

Não devem decidir regras financeiras.

### Validações

Usar Zod ou equivalente.

Criar schemas para:

- transaction;
- account;
- credit card;
- recurrence;
- vehicle;
- fuel entry.

Validar no cliente e no servidor.

---

## Supabase

### Auth

Usar Supabase Auth.

Não haverá cadastro público.

### RLS

RLS obrigatório para todas as tabelas com dados do usuário.

A autorização deve ser baseada em:

- `auth.uid()`;
- membership do workspace.

### Server-only

Nunca expor:

`SUPABASE_SERVICE_ROLE_KEY`

no frontend.

---

## Operações financeiras atômicas

Operações críticas não devem depender de múltiplos inserts independentes feitos pelo cliente.

Utilizar PostgreSQL function/RPC quando necessário.

Casos principais:

### Abastecimento

1. criar transaction;
2. criar fuel_entry;
3. vincular ambos.

Se qualquer etapa falhar, nenhuma alteração deve permanecer.

### Transferência

1. registrar saída da conta origem;
2. registrar entrada técnica na conta destino;
3. manter vínculo por `transfer_group_id`.

### Pagamento de fatura

1. criar movimentação de saída na conta;
2. vincular pagamento à fatura;
3. marcar fatura como PAID.

### Parcelamento

1. criar grupo;
2. gerar parcelas;
3. associar cada parcela à fatura correta.

### Recorrência

1. encerrar versão vigente;
2. criar nova versão;
3. preservar histórico;
4. atualizar somente lançamentos futuros elegíveis quando aplicável.

---

## Dinheiro

No PostgreSQL:

```text
numeric(14,2)
```

Para preço por litro:

```text
numeric(14,4)
```

Evitar `float` como fonte de verdade.

No frontend, preferir conversões seguras e, quando útil, trabalhar com centavos inteiros.

---

## Datas

Usar `DATE` para datas financeiras sem necessidade de horário:

- transaction_date;
- competence_date;
- due_date;
- reference_month.

Usar `TIMESTAMPTZ` para eventos reais:

- created_at;
- updated_at;
- settled_at;
- paid_at.

Evitar lógica dependente de timezone para datas de competência.

---

## Componentes reutilizáveis

Criar componentes como:

```text
MoneyInput
DateInput
CategorySelect
AccountSelect
CreditCardSelect
PaymentMethodSelector
TransactionTypeSelector
FormSection
BottomSheet
ConfirmDialog
EmptyState
SummaryCard
```

Evitar duplicar formulários.

---

## Performance

Desde o início:

- índices nos principais filtros;
- paginação no histórico;
- evitar N+1;
- selecionar apenas campos necessários;
- dashboard não deve carregar todo o histórico.

Não fazer otimizações prematuras.

---

## Tratamento de erros

Toda operação deve possuir:

- loading;
- sucesso;
- erro;
- mensagem compreensível.

Não exibir erros brutos do PostgreSQL ao usuário.

---

## Testes prioritários

Criar testes unitários para regras financeiras.

Cobrir:

- recorrência e snapshot;
- alteração futura;
- overrides;
- cartão antes/depois do fechamento;
- pagamento de fatura;
- transferências;
- preço por litro;
- consumo;
- parcelamentos.

---

## Convenções

- arquivos pequenos;
- nomes claros;
- funções pequenas;
- sem código morto;
- sem duplicação;
- comentários apenas quando agregarem contexto;
- regras financeiras sempre testáveis fora da UI.
