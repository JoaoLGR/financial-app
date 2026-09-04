create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
declare new_workspace uuid;
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  insert into public.workspaces (name, created_by) values ('Meu espaço', new.id) returning id into new_workspace;
  insert into public.workspace_members (workspace_id, user_id, role) values (new_workspace, new.id, 'OWNER');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
