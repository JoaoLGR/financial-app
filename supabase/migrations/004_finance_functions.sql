create or replace function public.create_account_transfer(
  p_workspace_id uuid,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_amount numeric,
  p_transaction_date date,
  p_description text default 'Transferência'
) returns uuid language plpgsql security invoker set search_path = public as $$
declare transfer_id uuid := gen_random_uuid();
begin
  if p_source_account_id = p_destination_account_id then raise exception 'source_and_destination_must_differ'; end if;
  if p_amount <= 0 then raise exception 'amount_must_be_positive'; end if;
  if not public.is_workspace_member(p_workspace_id) then raise exception 'workspace_access_denied'; end if;
  if not exists (select 1 from public.accounts where id = p_source_account_id and workspace_id = p_workspace_id and active) then raise exception 'invalid_source_account'; end if;
  if not exists (select 1 from public.accounts where id = p_destination_account_id and workspace_id = p_workspace_id and active) then raise exception 'invalid_destination_account'; end if;
  insert into public.transactions (workspace_id, type, description, amount, transaction_date, competence_date, status, account_id, transfer_group_id)
  values (p_workspace_id, 'TRANSFER', coalesce(nullif(trim(p_description), ''), 'Transferência'), p_amount, p_transaction_date, p_transaction_date, 'PAID', p_source_account_id, transfer_id);
  insert into public.transactions (workspace_id, type, description, amount, transaction_date, competence_date, status, account_id, transfer_group_id)
  values (p_workspace_id, 'TRANSFER', coalesce(nullif(trim(p_description), ''), 'Transferência'), p_amount, p_transaction_date, p_transaction_date, 'RECEIVED', p_destination_account_id, transfer_id);
  return transfer_id;
end;
$$;

revoke all on function public.create_account_transfer(uuid, uuid, uuid, numeric, date, text) from public;
grant execute on function public.create_account_transfer(uuid, uuid, uuid, numeric, date, text) to authenticated;
