-- Permite remover um usuário de teste sem apagar histórico financeiro.
-- O usuário perde o membership; registros históricos preservam as referências nulas.
alter table public.workspaces alter column created_by drop not null;

alter table public.workspaces drop constraint if exists workspaces_created_by_fkey;
alter table public.workspaces add constraint workspaces_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.accounts drop constraint if exists accounts_owner_user_id_fkey;
alter table public.accounts add constraint accounts_owner_user_id_fkey foreign key (owner_user_id) references public.profiles(id) on delete set null;
alter table public.credit_cards drop constraint if exists credit_cards_owner_user_id_fkey;
alter table public.credit_cards add constraint credit_cards_owner_user_id_fkey foreign key (owner_user_id) references public.profiles(id) on delete set null;
alter table public.recurrences drop constraint if exists recurrences_owner_user_id_fkey;
alter table public.recurrences add constraint recurrences_owner_user_id_fkey foreign key (owner_user_id) references public.profiles(id) on delete set null;
alter table public.transactions drop constraint if exists transactions_owner_user_id_fkey;
alter table public.transactions add constraint transactions_owner_user_id_fkey foreign key (owner_user_id) references public.profiles(id) on delete set null;
alter table public.vehicles drop constraint if exists vehicles_owner_user_id_fkey;
alter table public.vehicles add constraint vehicles_owner_user_id_fkey foreign key (owner_user_id) references public.profiles(id) on delete set null;
