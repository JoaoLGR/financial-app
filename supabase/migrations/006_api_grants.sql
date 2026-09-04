-- Data API: exposição explícita e mínima para o papel autenticado.
-- O papel anon não recebe acesso às tabelas financeiras.
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, insert, update on public.accounts to authenticated;
grant select, insert, update on public.categories to authenticated;
grant select, insert, update on public.credit_cards to authenticated;
grant select, insert, update on public.credit_card_invoices to authenticated;
grant select, insert, update on public.recurrences to authenticated;
grant select, insert, update on public.recurrence_versions to authenticated;
grant select, insert, update on public.installment_groups to authenticated;
grant select, insert, update on public.transactions to authenticated;
grant select, insert, update on public.vehicles to authenticated;
grant select, insert, update on public.vehicle_fuel_types to authenticated;
grant select, insert, update on public.fuel_entries to authenticated;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant execute on function public.create_account_transfer(uuid, uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.resolve_invoice_dates(uuid, date) to authenticated;
grant execute on function public.create_credit_card_expense(uuid, uuid, uuid, text, numeric, date, text) to authenticated;
grant execute on function public.pay_credit_card_invoice(uuid, uuid, uuid, date) to authenticated;

-- Funções internas: não são endpoints da aplicação.
-- handle_new_user é usada apenas pelo trigger de auth.
-- is_workspace_member é usada internamente pelas policies e RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_workspace_member(uuid) from public, anon, authenticated;
