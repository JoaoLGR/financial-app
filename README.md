# Clareza — MVP de finanças pessoais

Fundação mobile-first para até duas pessoas, com Next.js, TypeScript, App Router e Supabase.

## Estrutura

- `src/app`: rotas e composição visual.
- `src/lib/domain`: regras financeiras puras e testáveis.
- `src/lib/validations`: schemas Zod compartilhados.
- `src/lib/supabase`: clientes browser/server.
- `supabase/migrations`: schema, constraints, índices e RLS versionados.

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha as chaves públicas do Supabase.
2. Execute as migrations pelo Supabase CLI ou pelo pipeline do projeto.
3. Crie um usuário autorizado no Supabase Auth. O trigger cria o perfil e o workspace inicial.

Na configuração do projeto hospedado, mantenha a Data API habilitada, desative a exposição automática de novas tabelas e aplique todas as migrations. A migration `006_api_grants.sql` concede acesso somente ao papel `authenticated`; as policies RLS continuam controlando quais linhas cada usuário pode acessar.

A primeira tela é intencionalmente um estado vazio: a próxima fatia deve implementar contas, categorias e o primeiro lançamento usando Server Actions/RPC transacional.
