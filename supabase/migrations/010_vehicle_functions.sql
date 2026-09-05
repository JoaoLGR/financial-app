create or replace function public.create_vehicle(
  p_workspace_id uuid,
  p_owner_user_id uuid,
  p_name text,
  p_plate text,
  p_brand text,
  p_model text,
  p_year integer,
  p_odometer numeric,
  p_fuel_types text[]
) returns uuid language plpgsql security invoker set search_path = public as $$
declare vehicle_id uuid; fuel text;
begin
  if not public.is_workspace_member(p_workspace_id) or nullif(trim(p_name), '') is null or nullif(trim(p_model), '') is null or coalesce(array_length(p_fuel_types, 1), 0) = 0 then raise exception 'invalid_vehicle'; end if;
  if p_odometer < 0 then raise exception 'invalid_odometer'; end if;
  insert into public.vehicles(workspace_id, owner_user_id, name, plate, brand, model, year, current_odometer)
  values(p_workspace_id, p_owner_user_id, trim(p_name), nullif(trim(p_plate), ''), nullif(trim(p_brand), ''), trim(p_model), p_year, p_odometer)
  returning id into vehicle_id;
  foreach fuel in array p_fuel_types loop
    insert into public.vehicle_fuel_types(vehicle_id, fuel_type) values(vehicle_id, fuel::public.fuel_type);
  end loop;
  return vehicle_id;
exception when invalid_text_representation then raise exception 'invalid_fuel_type';
end;
$$;

create or replace function public.create_fuel_entry(
  p_workspace_id uuid,
  p_vehicle_id uuid,
  p_category_id uuid,
  p_fuel_type public.fuel_type,
  p_fuel_date date,
  p_odometer numeric,
  p_liters numeric,
  p_total_amount numeric,
  p_full_tank boolean,
  p_payment_method public.payment_method,
  p_account_id uuid,
  p_credit_card_id uuid,
  p_gas_station text default null,
  p_notes text default null
) returns uuid language plpgsql security invoker set search_path = public as $$
declare vehicle record; transaction_id uuid; description text;
begin
  if not public.is_workspace_member(p_workspace_id) or p_liters <= 0 or p_total_amount <= 0 or p_odometer < 0 then raise exception 'invalid_fuel_entry'; end if;
  select v.* into vehicle from public.vehicles v where v.id=p_vehicle_id and v.workspace_id=p_workspace_id and v.active for update;
  if not found then raise exception 'invalid_vehicle'; end if;
  if not exists(select 1 from public.vehicle_fuel_types where vehicle_id=p_vehicle_id and fuel_type=p_fuel_type) then raise exception 'fuel_type_not_allowed'; end if;
  if p_odometer < coalesce((select max(odometer) from public.fuel_entries where vehicle_id=p_vehicle_id), vehicle.current_odometer, 0) then raise exception 'odometer_must_not_decrease'; end if;
  if not exists(select 1 from public.categories where id=p_category_id and workspace_id=p_workspace_id and active and type in ('EXPENSE','BOTH')) then raise exception 'invalid_expense_category'; end if;
  if p_payment_method in ('PIX','DEBIT','CASH') then
    if not exists(select 1 from public.accounts where id=p_account_id and workspace_id=p_workspace_id and active) then raise exception 'invalid_payment_account'; end if;
    insert into public.transactions(workspace_id,type,description,amount,category_id,transaction_date,competence_date,status,payment_method,account_id,notes)
    values(p_workspace_id,'EXPENSE',coalesce(nullif(trim(p_gas_station), ''), 'Abastecimento'),p_total_amount,p_category_id,p_fuel_date,p_fuel_date,'PAID',p_payment_method,p_account_id,p_notes) returning id into transaction_id;
  elsif p_payment_method = 'CREDIT_CARD' then
    select public.create_credit_card_expense(p_workspace_id,p_credit_card_id,p_category_id,coalesce(nullif(trim(p_gas_station), ''), 'Abastecimento'),p_total_amount,p_fuel_date,p_notes) into transaction_id;
  else raise exception 'invalid_payment_method'; end if;
  insert into public.fuel_entries(workspace_id,vehicle_id,transaction_id,fuel_type,fuel_date,odometer,liters,total_amount,full_tank,gas_station,notes)
  values(p_workspace_id,p_vehicle_id,transaction_id,p_fuel_type,p_fuel_date,p_odometer,p_liters,p_total_amount,p_full_tank,nullif(trim(p_gas_station), ''),p_notes);
  update public.vehicles set current_odometer=p_odometer,updated_at=now() where id=p_vehicle_id;
  return transaction_id;
end;
$$;

grant execute on function public.create_vehicle(uuid,uuid,text,text,text,text,integer,numeric,text[]) to authenticated;
grant execute on function public.create_fuel_entry(uuid,uuid,uuid,public.fuel_type,date,numeric,numeric,numeric,boolean,public.payment_method,uuid,uuid,text,text) to authenticated;
