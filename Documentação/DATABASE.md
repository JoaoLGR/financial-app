# DATABASE.md

## Banco de dados

Banco principal:

- PostgreSQL via Supabase.

Toda alteração estrutural deve ser feita por migration.

Estrutura sugerida:

```text
supabase/
  migrations/
    001_initial_schema.sql
    002_rls.sql
    003_finance_functions.sql
```

Não depender de alterações manuais no painel do Supabase.

---

# Tabelas

## profiles

```sql
profiles
--------
id uuid primary key references auth.users(id)
name text
avatar_url text null
created_at timestamptz
updated_at timestamptz
```

---

## workspaces

```sql
workspaces
----------
id uuid primary key
name text
created_by uuid
created_at timestamptz
updated_at timestamptz
```

---

## workspace_members

```sql
workspace_members
-----------------
id uuid primary key
workspace_id uuid
user_id uuid
role text
created_at timestamptz
```

Roles iniciais:

- OWNER
- MEMBER

Adicionar unique constraint em:

`workspace_id + user_id`

---

## accounts

```sql
accounts
--------
id uuid primary key
workspace_id uuid
owner_user_id uuid null
name text
type text
initial_balance numeric(14,2)
active boolean
created_at timestamptz
updated_at timestamptz
```

O campo `current_balance` não deve ser fonte primária da verdade.

---

## categories

```sql
categories
----------
id uuid primary key
workspace_id uuid
name text
type text
icon text null
active boolean
created_at timestamptz
updated_at timestamptz
```

Tipos:

- INCOME
- EXPENSE
- BOTH

---

## credit_cards

```sql
credit_cards
------------
id uuid primary key
workspace_id uuid
owner_user_id uuid null
name text
brand text null
limit_amount numeric(14,2)
closing_day integer
due_day integer
active boolean
created_at timestamptz
updated_at timestamptz
```

Constraints:

```text
closing_day between 1 and 31
due_day between 1 and 31
limit_amount >= 0
```

---

## credit_card_invoices

```sql
credit_card_invoices
--------------------
id uuid primary key
credit_card_id uuid
reference_month date
closing_date date
due_date date
status text
paid_at timestamptz null
payment_transaction_id uuid null
created_at timestamptz
updated_at timestamptz
```

Status:

- OPEN
- CLOSED
- PAID

Adicionar unique constraint:

`credit_card_id + reference_month`

---

## transactions

Tabela central do sistema.

```sql
transactions
------------
id uuid primary key

workspace_id uuid
owner_user_id uuid null

type text

description text
amount numeric(14,2)

category_id uuid null

transaction_date date
competence_date date
due_date date null
settled_at timestamptz null

status text
payment_method text null

account_id uuid null
credit_card_id uuid null
credit_card_invoice_id uuid null

recurrence_id uuid null
recurrence_version_id uuid null
is_recurrence_override boolean default false

installment_group_id uuid null
installment_number integer null
installment_total integer null

transfer_group_id uuid null

notes text null

created_at timestamptz
updated_at timestamptz
```

Tipos:

- INCOME
- EXPENSE
- TRANSFER

Status:

- PENDING
- PAID
- RECEIVED
- OVERDUE
- CANCELLED

Payment methods:

- PIX
- DEBIT
- CASH
- CREDIT_CARD

Regras:

- `amount > 0`;
- valor nunca deve ser armazenado como negativo;
- tipo define se é entrada ou saída;
- cartão exige `credit_card_id`;
- Pix/débito/dinheiro normalmente exigem `account_id`.

---

## recurrences

```sql
recurrences
-----------
id uuid primary key
workspace_id uuid
owner_user_id uuid null

type text

frequency text
day_of_month integer null

start_date date
end_date date null

active boolean

created_at timestamptz
updated_at timestamptz
```

Frequência inicial:

- MONTHLY

Preparar estrutura para:

- WEEKLY
- YEARLY

---

## recurrence_versions

```sql
recurrence_versions
-------------------
id uuid primary key

recurrence_id uuid

description text
amount numeric(14,2)

category_id uuid null

payment_method text null
account_id uuid null
credit_card_id uuid null

valid_from date
valid_until date null

created_at timestamptz
```

Regras:

- nunca sobrescrever versão histórica;
- ao alterar regra, encerrar versão atual e criar nova;
- versões não devem possuir vigências conflitantes para a mesma recorrência.

---

## installment_groups

```sql
installment_groups
------------------
id uuid primary key
workspace_id uuid
description text
original_amount numeric(14,2)
installments integer
created_at timestamptz
```

Cada parcela fica em `transactions`.

---

## vehicles

```sql
vehicles
--------
id uuid primary key
workspace_id uuid
owner_user_id uuid null

name text
plate text null
brand text null
model text
year integer null

current_odometer numeric(12,1) null

active boolean

created_at timestamptz
updated_at timestamptz
```

---

## vehicle_fuel_types

```sql
vehicle_fuel_types
------------------
id uuid primary key
vehicle_id uuid
fuel_type text
created_at timestamptz
```

Tipos iniciais:

- GASOLINE
- ETHANOL
- DIESEL
- GNV

Unique:

`vehicle_id + fuel_type`

---

## fuel_entries

```sql
fuel_entries
------------
id uuid primary key

workspace_id uuid
vehicle_id uuid
transaction_id uuid

fuel_type text

fuel_date date

odometer numeric(12,1)
liters numeric(12,3)
total_amount numeric(14,2)

price_per_liter numeric(14,4)

full_tank boolean

gas_station text null
notes text null

created_at timestamptz
updated_at timestamptz
```

Constraints:

- liters > 0;
- total_amount > 0;
- odometer >= 0.

`price_per_liter` deve ser calculado pelo sistema:

`total_amount / liters`

---

# Índices sugeridos

## transactions

```text
workspace_id
transaction_date
competence_date
account_id
credit_card_id
credit_card_invoice_id
recurrence_id
status
category_id
```

Índice composto útil:

```text
workspace_id + competence_date
workspace_id + transaction_date
```

## fuel_entries

```text
vehicle_id
fuel_date
workspace_id
```

## recurrence_versions

```text
recurrence_id
valid_from
valid_until
```

## invoices

```text
credit_card_id
reference_month
status
```

---

# RLS

RLS obrigatório.

Regra base:

O usuário só acessa um registro se for membro do `workspace_id` correspondente.

Conceito:

```sql
exists (
  select 1
  from workspace_members wm
  where wm.workspace_id = target.workspace_id
    and wm.user_id = auth.uid()
)
```

Aplicar conceito equivalente para:

- SELECT;
- INSERT;
- UPDATE;
- DELETE.

Tabelas que não possuírem `workspace_id` diretamente devem validar através da entidade pai.

---

# Exclusão

Evitar exclusão física de entidades usadas por histórico.

Usar `active = false` para:

- accounts;
- categories;
- credit_cards;
- vehicles.

Transactions financeiras históricas não devem desaparecer por desativação de cadastro.

---

# Seed inicial

Criar seed apenas para desenvolvimento.

Categorias de receita:

- Salário
- Premiação
- Renda Extra
- Reembolso

Categorias de despesa:

- Alimentação
- Mercado
- Moradia
- Condomínio
- Energia
- Água
- Internet
- Transporte
- Combustível
- Financiamento
- Lazer
- Saúde
- Assinaturas
- Outros

Não inserir dados pessoais reais.
