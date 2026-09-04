-- Seed opcional para desenvolvimento. Não contém dados pessoais.
-- Execute após criar um usuário e um workspace de desenvolvimento.
-- As categorias devem ser criadas com o workspace_id correto da sessão.

insert into public.categories (workspace_id, name, type, sort_order)
select w.id, values_table.name, values_table.type::public.category_type, values_table.sort_order
from public.workspaces w
cross join (values
  ('Salário', 'INCOME', 10), ('Premiação', 'INCOME', 20), ('Renda Extra', 'INCOME', 30), ('Reembolso', 'INCOME', 40),
  ('Alimentação', 'EXPENSE', 10), ('Mercado', 'EXPENSE', 20), ('Moradia', 'EXPENSE', 30), ('Condomínio', 'EXPENSE', 40),
  ('Energia', 'EXPENSE', 50), ('Água', 'EXPENSE', 60), ('Internet', 'EXPENSE', 70), ('Transporte', 'EXPENSE', 80),
  ('Combustível', 'EXPENSE', 90), ('Financiamento', 'EXPENSE', 100), ('Lazer', 'EXPENSE', 110), ('Saúde', 'EXPENSE', 120), ('Assinaturas', 'EXPENSE', 130), ('Outros', 'BOTH', 999)
) as values_table(name, type, sort_order)
where w.name = 'Desenvolvimento'
on conflict (workspace_id, name) do nothing;
