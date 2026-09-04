alter table public.transactions add column if not exists recurrence_occurrence_date date;
create unique index if not exists transactions_recurrence_occurrence_uidx on public.transactions(recurrence_id, recurrence_occurrence_date) where recurrence_id is not null and recurrence_occurrence_date is not null;
create index if not exists recurrences_workspace_active_idx on public.recurrences(workspace_id, active);
create index if not exists transactions_recurrence_competence_idx on public.transactions(recurrence_id, competence_date);

create or replace function public.create_recurrence(p_workspace_id uuid, p_owner_user_id uuid, p_type public.transaction_type, p_description text, p_amount numeric, p_category_id uuid, p_payment_method public.payment_method, p_account_id uuid, p_credit_card_id uuid, p_frequency public.recurrence_frequency, p_day_of_month integer, p_start_date date, p_end_date date default null)
returns uuid language plpgsql security invoker set search_path=public as $$ declare recurrence_id uuid; begin
  if p_type='TRANSFER' or not public.is_workspace_member(p_workspace_id) or p_amount<=0 or p_day_of_month not between 1 and 31 or (p_end_date is not null and p_end_date<p_start_date) then raise exception 'invalid_recurrence'; end if;
  if p_payment_method in ('PIX','DEBIT','CASH') and p_account_id is null then raise exception 'account_required'; end if;
  if p_payment_method='CREDIT_CARD' and p_credit_card_id is null then raise exception 'credit_card_required'; end if;
  insert into public.recurrences(workspace_id,owner_user_id,type,frequency,day_of_month,start_date,end_date) values(p_workspace_id,p_owner_user_id,p_type,p_frequency,p_day_of_month,p_start_date,p_end_date) returning id into recurrence_id;
  insert into public.recurrence_versions(recurrence_id,description,amount,category_id,payment_method,account_id,credit_card_id,valid_from) values(recurrence_id,p_description,p_amount,p_category_id,p_payment_method,p_account_id,p_credit_card_id,p_start_date);
  return recurrence_id;
end $$;

create or replace function public.generate_recurring_transactions(p_workspace_id uuid, p_months_ahead integer default 3)
returns integer language plpgsql security invoker set search_path=public as $$
declare recurrence record; version record; occurrence date; month_cursor date; generated integer:=0; target_end date;
begin
  if not public.is_workspace_member(p_workspace_id) then raise exception 'workspace_access_denied'; end if;
  for recurrence in select * from public.recurrences where workspace_id=p_workspace_id and active loop
    target_end := least(coalesce(recurrence.end_date,'9999-12-31'::date), (date_trunc('month',current_date)+(p_months_ahead||' months')::interval+interval '1 month'-interval '1 day')::date);
    month_cursor := date_trunc('month', greatest(recurrence.start_date,current_date))::date;
    while month_cursor <= target_end loop
      occurrence := make_date(extract(year from month_cursor)::integer,extract(month from month_cursor)::integer,least(recurrence.day_of_month,extract(day from (month_cursor+interval '1 month'-interval '1 day'))::integer));
      if occurrence >= recurrence.start_date and occurrence <= target_end and (recurrence.end_date is null or occurrence <= recurrence.end_date) then
        select * into version from public.recurrence_versions rv where rv.recurrence_id=recurrence.id and rv.valid_from<=occurrence and (rv.valid_until is null or rv.valid_until>=occurrence) order by rv.valid_from desc limit 1;
        if found and not exists(select 1 from public.transactions where recurrence_id=recurrence.id and recurrence_occurrence_date=occurrence) then
          insert into public.transactions(workspace_id,owner_user_id,type,description,amount,category_id,transaction_date,competence_date,status,payment_method,account_id,credit_card_id,recurrence_id,recurrence_version_id,recurrence_occurrence_date) values(p_workspace_id,recurrence.owner_user_id,recurrence.type,version.description,version.amount,version.category_id,occurrence,month_cursor,'PENDING',version.payment_method,version.account_id,version.credit_card_id,recurrence.id,version.id,occurrence);
          generated:=generated+1;
        end if;
      end if;
      month_cursor := (month_cursor+interval '1 month')::date;
    end loop;
  end loop; return generated;
end $$;

create or replace function public.update_recurrence_from_date(p_recurrence_id uuid,p_valid_from date,p_description text,p_amount numeric,p_category_id uuid,p_payment_method public.payment_method,p_account_id uuid,p_credit_card_id uuid)
returns uuid language plpgsql security invoker set search_path=public as $$ declare old_version record; new_id uuid; begin
  select rv.* into old_version from public.recurrence_versions rv join public.recurrences r on r.id=rv.recurrence_id where rv.recurrence_id=p_recurrence_id and rv.valid_from<=p_valid_from and (rv.valid_until is null or rv.valid_until>=p_valid_from) and public.is_workspace_member(r.workspace_id) order by rv.valid_from desc limit 1 for update;
  if not found then raise exception 'active_recurrence_version_not_found'; end if;
  update public.recurrence_versions set valid_until=p_valid_from-1 where id=old_version.id;
  insert into public.recurrence_versions(recurrence_id,description,amount,category_id,payment_method,account_id,credit_card_id,valid_from) values(p_recurrence_id,p_description,p_amount,p_category_id,p_payment_method,p_account_id,p_credit_card_id,p_valid_from) returning id into new_id;
  update public.transactions set description=p_description,amount=p_amount,category_id=p_category_id,payment_method=p_payment_method,account_id=p_account_id,credit_card_id=p_credit_card_id,recurrence_version_id=new_id where recurrence_id=p_recurrence_id and transaction_date>=p_valid_from and status in ('PENDING','OVERDUE') and not is_recurrence_override and status<>'CANCELLED';
  return new_id;
end $$;

create or replace function public.override_recurrence_transaction(p_transaction_id uuid,p_description text,p_amount numeric,p_category_id uuid,p_account_id uuid,p_credit_card_id uuid,p_payment_method public.payment_method)
returns void language plpgsql security invoker set search_path=public as $$ begin
  update public.transactions set description=p_description,amount=p_amount,category_id=p_category_id,account_id=p_account_id,credit_card_id=p_credit_card_id,payment_method=p_payment_method,is_recurrence_override=true where id=p_transaction_id and status in ('PENDING','OVERDUE') and exists(select 1 from public.transactions t where t.id=p_transaction_id and public.is_workspace_member(t.workspace_id));
end $$;

grant execute on function public.create_recurrence(uuid,uuid,public.transaction_type,text,numeric,uuid,public.payment_method,uuid,uuid,public.recurrence_frequency,integer,date,date) to authenticated;
grant execute on function public.generate_recurring_transactions(uuid,integer) to authenticated;
grant execute on function public.update_recurrence_from_date(uuid,date,text,numeric,uuid,public.payment_method,uuid,uuid) to authenticated;
grant execute on function public.override_recurrence_transaction(uuid,text,numeric,uuid,uuid,uuid,public.payment_method) to authenticated;
