alter table public.transactions add column if not exists is_invoice_payment boolean not null default false;
alter table public.transactions drop constraint if exists transactions_check;
alter table public.transactions add constraint transactions_category_or_invoice_payment check (type = 'TRANSFER' or category_id is not null or is_invoice_payment);

create or replace function public.resolve_invoice_dates(p_credit_card_id uuid, p_purchase_date date)
returns table(reference_month date, closing_date date, due_date date)
language plpgsql security invoker set search_path = public as $$
declare card record; closing_month date; closing_day integer; due_month date;
begin
  select closing_day, due_day into card from public.credit_cards where id = p_credit_card_id and active;
  if not found then raise exception 'invalid_or_inactive_credit_card'; end if;
  closing_month := date_trunc('month', p_purchase_date)::date;
  if extract(day from p_purchase_date)::integer > card.closing_day then closing_month := (closing_month + interval '1 month')::date; end if;
  closing_day := least(card.closing_day, extract(day from ((closing_month + interval '1 month')::date - 1))::integer);
  if card.due_day > closing_day then due_month := closing_month; else due_month := (closing_month + interval '1 month')::date; end if;
  return query select closing_month, make_date(extract(year from closing_month)::integer, extract(month from closing_month)::integer, closing_day), make_date(extract(year from due_month)::integer, extract(month from due_month)::integer, least(card.due_day, extract(day from ((due_month + interval '1 month')::date - 1))::integer));
end;
$$;

create or replace function public.create_credit_card_expense(p_workspace_id uuid, p_credit_card_id uuid, p_category_id uuid, p_description text, p_amount numeric, p_purchase_date date, p_notes text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare dates record; invoice_id uuid; used_amount numeric; card_limit numeric; transaction_id uuid;
begin
  if not public.is_workspace_member(p_workspace_id) or p_amount <= 0 then raise exception 'invalid_expense_request'; end if;
  select * into dates from public.resolve_invoice_dates(p_credit_card_id, p_purchase_date);
  select limit_amount into card_limit from public.credit_cards where id = p_credit_card_id and workspace_id = p_workspace_id and active;
  if card_limit is null then raise exception 'invalid_or_inactive_credit_card'; end if;
  select coalesce(sum(t.amount), 0) into used_amount from public.transactions t join public.credit_card_invoices i on i.id=t.credit_card_invoice_id where t.credit_card_id=p_credit_card_id and t.status <> 'CANCELLED' and i.status <> 'PAID';
  if used_amount + p_amount > card_limit then raise exception 'credit_limit_exceeded'; end if;
  insert into public.credit_card_invoices (credit_card_id, reference_month, closing_date, due_date, status) values (p_credit_card_id, dates.reference_month, dates.closing_date, dates.due_date, case when current_date > dates.closing_date then 'CLOSED'::public.invoice_status else 'OPEN'::public.invoice_status end) on conflict (credit_card_id, reference_month) do update set updated_at=now() returning id into invoice_id;
  insert into public.transactions (workspace_id,type,description,amount,category_id,transaction_date,competence_date,status,payment_method,credit_card_id,credit_card_invoice_id,notes) values (p_workspace_id,'EXPENSE',p_description,p_amount,p_category_id,p_purchase_date,p_purchase_date,'PAID','CREDIT_CARD',p_credit_card_id,invoice_id,p_notes) returning id into transaction_id;
  return transaction_id;
end;
$$;

create or replace function public.pay_credit_card_invoice(p_workspace_id uuid, p_invoice_id uuid, p_account_id uuid, p_payment_date date)
returns uuid language plpgsql security invoker set search_path = public as $$
declare invoice record; total numeric; transaction_id uuid;
begin
  if not public.is_workspace_member(p_workspace_id) then raise exception 'workspace_access_denied'; end if;
  select i.*, c.workspace_id into invoice from public.credit_card_invoices i join public.credit_cards c on c.id=i.credit_card_id where i.id=p_invoice_id and c.workspace_id=p_workspace_id for update;
  if not found or invoice.status='PAID' then raise exception 'invoice_not_payable'; end if;
  if not exists(select 1 from public.accounts where id=p_account_id and workspace_id=p_workspace_id and active) then raise exception 'invalid_payment_account'; end if;
  select coalesce(sum(amount),0) into total from public.transactions where credit_card_invoice_id=p_invoice_id and status <> 'CANCELLED';
  insert into public.transactions(workspace_id,type,description,amount,transaction_date,competence_date,status,payment_method,account_id,is_invoice_payment,notes) values(p_workspace_id,'EXPENSE','Pagamento de fatura',total,p_payment_date,p_payment_date,'PAID','DEBIT',p_account_id,true,'CARD_INVOICE_PAYMENT') returning id into transaction_id;
  update public.credit_card_invoices set status='PAID',paid_at=now(),payment_transaction_id=transaction_id,updated_at=now() where id=p_invoice_id;
  return transaction_id;
end;
$$;

grant execute on function public.resolve_invoice_dates(uuid,date) to authenticated;
grant execute on function public.create_credit_card_expense(uuid,uuid,uuid,text,numeric,date,text) to authenticated;
grant execute on function public.pay_credit_card_invoice(uuid,uuid,uuid,date) to authenticated;
