# PROJECT.md

## MVP — Aplicativo Pessoal de Finanças

### Objetivo

Desenvolver um aplicativo pessoal de finanças, com foco **mobile first**, para uso de no máximo duas pessoas.

O sistema deve permitir controlar receitas, despesas, contas, cartões, recorrências, planejamento financeiro e abastecimentos de veículos, priorizando:

1. rapidez para registrar movimentações;
2. integridade dos dados financeiros;
3. histórico confiável;
4. simplicidade de uso no celular;
5. análises úteis;
6. boa base arquitetural para evolução.

---

## Stack

- Next.js
- TypeScript
- App Router
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Row Level Security
- Vercel

---

## Escopo do MVP

### Autenticação

- Sem cadastro público.
- Usuários previamente autorizados.
- Estrutura preparada para até duas pessoas.
- Suporte a dados pessoais e compartilhados.

### Dashboard

Exibir inicialmente:

- saldo atual;
- receitas recebidas no mês;
- receitas previstas;
- despesas pagas;
- despesas pendentes;
- faturas abertas;
- valor estimado disponível para gastar;
- últimos lançamentos.

### Contas

Permitir cadastrar contas como:

- Nubank;
- Caixa;
- Mercado Pago;
- carteira;
- dinheiro.

Campos principais:

- nome;
- tipo;
- saldo inicial;
- proprietário;
- status ativo/inativo.

O saldo atual deve ser derivado das movimentações sempre que possível.

### Receitas

Permitir:

- receitas recorrentes;
- receitas eventuais.

Exemplos:

- salário;
- premiação;
- bônus;
- renda extra;
- reembolso.

### Despesas

Permitir:

- despesas recorrentes;
- despesas eventuais;
- pagamento via Pix;
- débito;
- dinheiro;
- cartão de crédito.

### Cartões

Cada cartão deve possuir:

- nome;
- limite;
- dia de fechamento;
- dia de vencimento;
- proprietário;
- status.

Compras devem entrar automaticamente na fatura correta.

### Faturas

Status:

- OPEN;
- CLOSED;
- PAID.

O pagamento da fatura reduz o saldo da conta escolhida.

A compra no cartão representa a despesa. O pagamento da fatura representa a liquidação da obrigação e não deve duplicar a despesa nas análises.

### Recorrências

Obrigatório no MVP.

Aplicável a:

- entradas;
- saídas.

Exemplos:

- salário;
- aluguel;
- condomínio;
- financiamento;
- internet;
- assinaturas.

As recorrências devem gerar lançamentos automaticamente ou sob rotina controlada.

Cada lançamento gerado deve funcionar como snapshot histórico.

### Parcelamentos

Compras parceladas devem gerar parcelas independentes e vinculadas entre si.

Cada parcela deve entrar na fatura correspondente.

### Transferências

Transferências entre contas:

- reduzem a conta de origem;
- aumentam a conta de destino;
- não contam como receita;
- não contam como despesa.

### Veículos

Permitir cadastrar:

- nome;
- placa;
- marca;
- modelo;
- ano;
- quilometragem;
- combustíveis aceitos.

Um veículo pode aceitar múltiplos combustíveis.

### Abastecimentos

Campos:

- veículo;
- data;
- quilometragem;
- combustível;
- litros;
- valor total;
- tanque cheio;
- forma de pagamento;
- conta ou cartão;
- posto;
- observação.

O preço por litro deve ser calculado automaticamente:

`preço por litro = valor total / litros`

O abastecimento deve gerar automaticamente uma despesa financeira vinculada.

### Análises de combustível

Preparar o sistema para exibir:

- gasto mensal;
- litros abastecidos;
- km rodados;
- consumo médio;
- custo por km;
- preço médio por litro;
- melhor consumo;
- pior consumo;
- comparação por combustível.

Para veículos flex, comparar custo real por quilômetro de cada combustível.

---

## UX Mobile First

Faixa prioritária:

- 360px a 430px.

Navegação sugerida:

- Início
- Lançamentos
- +
- Planejamento
- Mais

O botão `+` deve permitir:

- nova entrada;
- nova saída;
- novo abastecimento;
- transferência.

### Lançamento rápido

Campos principais:

- tipo;
- descrição;
- valor;
- categoria;
- data;
- forma de pagamento.

Seção `Mais detalhes`:

- conta;
- cartão;
- competência;
- vencimento;
- status;
- recorrência;
- parcelamento;
- observação;
- responsável.

---

## Roadmap

### Fase 1 — Fundação

- Next.js;
- Supabase;
- Auth;
- migrations;
- RLS;
- workspace;
- estrutura base;
- layout mobile.

### Fase 2 — Financeiro

- contas;
- categorias;
- entradas;
- saídas;
- saldo;
- histórico;
- dashboard.

### Fase 3 — Cartões

- cartões;
- faturas;
- limite;
- pagamento de fatura.

### Fase 4 — Recorrências

- recorrências;
- versões;
- snapshots;
- overrides;
- geração futura.

### Fase 5 — Veículos

- veículos;
- combustíveis;
- abastecimentos;
- integração financeira;
- análises.

### Fase 6 — Refinamento

- filtros;
- estados de carregamento;
- erros;
- responsividade desktop;
- testes.

---

## Prioridades

1. Integridade financeira
2. Segurança
3. Facilidade de uso
4. Arquitetura
5. Mobile first
6. Performance
7. Recursos adicionais
