'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { getCategories, getWorkspaceId } from '@/repositories/finance';
import { categorySchema } from '@/lib/validations/transactions';

type Category = { id: string; name: string; type: 'INCOME'|'EXPENSE'|'BOTH'; active: boolean };

export function CategoriesClient() {
  const client = useMemo(() => createClient(), []);
  const [workspace, setWorkspace] = useState<string|null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', type: 'EXPENSE' });
  const load = useCallback(async () => { const id = await getWorkspaceId(client); setWorkspace(id); if (!id) return; const result = await getCategories(client, id); setCategories((result.data as Category[]) || []); }, [client]);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!workspace) return; const data = categorySchema.parse(form); const { error } = await client.from('categories').insert({ workspace_id: workspace, name: data.name, type: data.type }); if (!error) { setForm({ name: '', type: 'EXPENSE' }); await load(); } }
  async function toggle(category: Category) { await client.from('categories').update({ active: !category.active }).eq('id', category.id); await load(); }
  return <div className="module"><h1>Categorias</h1><p className="muted">Cadastre categorias de receita, despesa ou uso misto. Desativar preserva o histórico.</p><form className="inline-form" onSubmit={submit}><input placeholder="Nome da categoria" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option><option value="BOTH">Ambas</option></select><button className="primary-button">Adicionar</button></form><div className="list-card">{categories.map(category => <div className="list-row" key={category.id}><div><strong>{category.name}</strong><span>{category.type}</span></div><button className={category.active ? 'pill' : 'pill muted-pill'} onClick={() => toggle(category)}>{category.active ? 'Desativar' : 'Ativar'}</button></div>)}{categories.length === 0 && <p className="muted">Nenhuma categoria cadastrada.</p>}</div></div>;
}
