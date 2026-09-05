'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { getAccounts, getCategories, getTransactions, getWorkspaceId } from '@/repositories/finance';
import { accountSchema, categorySchema, expenseSchema, incomeSchema, transferSchema } from '@/lib/validations/transactions';
import { calculateAccountBalance } from '@/lib/domain/finance';
import { formatCurrency } from '@/lib/money';
import { cancelTransaction, createExpense, createIncome, settleTransaction } from '@/services/finance/transactions';

type Account = { id: string; name: string; type: string; initial_balance: number; active: boolean };
type Category = { id: string; name: string; type: string; active: boolean };
type Transaction = { id: string; type: 'INCOME'|'EXPENSE'|'TRANSFER'; description: string; amount: number; transaction_date: string; status: string; account_id: string|null; category_id: string|null; transfer_direction: 'IN'|'OUT'|null };
const today = new Date().toISOString().slice(0, 10);

export function AccountsClient() {
  const client = useMemo(() => createClient(), []);
  const [workspace, setWorkspace] = useState<string|null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({ name: '', type: 'DIGITAL', initialBalance: '0' });
  const load = useCallback(async () => { const id = await getWorkspaceId(client); setWorkspace(id); if (!id) return; const [a, t] = await Promise.all([getAccounts(client, id), getTransactions(client, id)]); setAccounts((a.data as Account[]) || []); setTransactions((t.data as Transaction[]) || []); }, [client]);
  useEffect(() => { void load(); }, [load]);
  const balances = useMemo(() => accounts.map(account => ({
    ...account,
    balance: calculateAccountBalance(
      Number(account.initial_balance),
      transactions.filter(t => t.account_id === account.id).map(t => ({
        type: t.type,
        amount: Number(t.amount),
        status: t.status as 'PENDING'|'PAID'|'RECEIVED'|'OVERDUE'|'CANCELLED',
        transfer_direction: t.transfer_direction,
      })),
    ),
  })), [accounts, transactions]);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!workspace) return; const data = accountSchema.parse(form); const { error } = await client.from('accounts').insert({ workspace_id: workspace, name: data.name, type: data.type, initial_balance: data.initialBalance }); if (error) return; setForm({ name: '', type: 'DIGITAL', initialBalance: '0' }); await load(); }
  return <div className="module"><h1>Contas</h1><p className="muted">O saldo é derivado do saldo inicial e dos lançamentos efetivados.</p><form className="inline-form" onSubmit={submit}><input placeholder="Nome da conta" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="DIGITAL">Conta digital</option><option value="CHECKING">Conta corrente</option><option value="SAVINGS">Poupança</option><option value="CASH">Dinheiro</option><option value="OTHER">Outra</option></select><input type="number" step="0.01" placeholder="Saldo inicial" value={form.initialBalance} onChange={e => setForm({ ...form, initialBalance: e.target.value })} /><button className="primary-button">Adicionar conta</button></form><div className="list-card"><div className="list-total"><span>Saldo total</span><strong>{formatCurrency(balances.reduce((sum, item) => sum + item.balance, 0))}</strong></div>{balances.map(account => <div className="list-row" key={account.id}><div><strong>{account.name}</strong><span>{account.type}</span></div><strong>{formatCurrency(account.balance)}</strong></div>)}</div></div>;
}

export function CategoriesClient() {
  const client = useMemo(() => createClient(), []);
  const [workspace, setWorkspace] = useState<string|null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', type: 'EXPENSE' });
  const load = useCallback(async () => { const id = await getWorkspaceId(client); setWorkspace(id); if (id) { const result = await getCategories(client, id); setCategories((result.data as Category[]) || []); } }, [client]);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!workspace) return; const data = categorySchema.parse(form); const { error } = await client.from('categories').insert({ workspace_id: workspace, name: data.name, type: data.type }); if (error) return; setForm({ name: '', type: 'EXPENSE' }); await load(); }
  return <div className="module"><h1>Categorias</h1><p className="muted">Categorias inativas permanecem no histórico.</p><form className="inline-form" onSubmit={submit}><input placeholder="Nome da categoria" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option><option value="BOTH">Ambas</option></select><button className="primary-button">Adicionar</button></form><div className="list-card">{categories.map(category => <div className="list-row" key={category.id}><div><strong>{category.name}</strong><span>{category.type}</span></div><span className={category.active ? 'pill' : 'pill muted-pill'}>{category.active ? 'Ativa' : 'Inativa'}</span></div>)}</div></div>;
}

export function TransactionsClient({ mode = 'list' }: { mode?: 'list'|'new' }) {
  const client = useMemo(() => createClient(), []);
  const [workspace, setWorkspace] = useState<string|null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kind, setKind] = useState<'INCOME'|'EXPENSE'|'TRANSFER'>('EXPENSE');
  const [form, setForm] = useState({ description: '', amount: '', categoryId: '', accountId: '', destinationAccountId: '', paymentMethod: 'PIX', status: 'PAID', transactionDate: today });
  const load = useCallback(async () => { const id = await getWorkspaceId(client); setWorkspace(id); if (id) { const [a, c, t] = await Promise.all([getAccounts(client, id), getCategories(client, id), getTransactions(client, id)]); setAccounts((a.data as Account[]) || []); setCategories((c.data as Category[]) || []); setTransactions((t.data as Transaction[]) || []); } }, [client]);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!workspace) return; const base = { description: form.description, amount: form.amount, transactionDate: form.transactionDate, competenceDate: form.transactionDate }; if (kind === 'INCOME') await createIncome(client, incomeSchema.parse({ ...base, categoryId: form.categoryId, accountId: form.accountId, status: form.status }), workspace); else if (kind === 'EXPENSE') await createExpense(client, expenseSchema.parse({ ...base, categoryId: form.categoryId, accountId: form.accountId, paymentMethod: form.paymentMethod, status: form.status }), workspace); else { const data = transferSchema.parse({ description: form.description, amount: form.amount, transactionDate: form.transactionDate, sourceAccountId: form.accountId, destinationAccountId: form.destinationAccountId }); await client.rpc('create_account_transfer', { p_workspace_id: workspace, p_source_account_id: data.sourceAccountId, p_destination_account_id: data.destinationAccountId, p_amount: data.amount, p_transaction_date: data.transactionDate, p_description: data.description || 'Transferência' }); } setForm({ ...form, description: '', amount: '' }); await load(); }
  if (mode === 'new') return <div className="module"><h1>Novo lançamento</h1><div className="segmented">{(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map(item => <button className={kind === item ? 'selected' : ''} key={item} onClick={() => setKind(item)}>{item === 'EXPENSE' ? 'Saída' : item === 'INCOME' ? 'Entrada' : 'Transferência'}</button>)}</div><form className="stack-form" onSubmit={submit}><input placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /><input type="number" step="0.01" min="0.01" placeholder="Valor" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /><input type="date" value={form.transactionDate} onChange={e => setForm({ ...form, transactionDate: e.target.value })} />{kind !== 'TRANSFER' && <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required><option value="">Categoria</option>{categories.filter(c => c.active && (c.type === kind || c.type === 'BOTH')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}<select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} required><option value="">{kind === 'TRANSFER' ? 'Conta de origem' : 'Conta'}</option>{accounts.filter(a => a.active).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>{kind === 'TRANSFER' && <select value={form.destinationAccountId} onChange={e => setForm({ ...form, destinationAccountId: e.target.value })} required><option value="">Conta de destino</option>{accounts.filter(a => a.active).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>}{kind === 'EXPENSE' && <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}><option value="PIX">Pix</option><option value="DEBIT">Débito</option><option value="CASH">Dinheiro</option></select>}{kind !== 'TRANSFER' && <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value={kind === 'INCOME' ? 'RECEIVED' : 'PAID'}>{kind === 'INCOME' ? 'Recebida' : 'Paga'}</option><option value="PENDING">Pendente</option><option value="OVERDUE">Vencida</option></select>}<button className="primary-button">Salvar lançamento</button></form></div>;
  return <div className="module"><div className="module-heading"><div><h1>Lançamentos</h1><p className="muted">Histórico financeiro do workspace</p></div><a className="primary-button" href="/transactions/new">Novo</a></div><div className="list-card">{transactions.map(t => <div className="list-row" key={t.id}><div><strong>{t.description}</strong><span>{t.transaction_date} · {t.status}</span></div><strong className={t.type === 'INCOME' || (t.type === 'TRANSFER' && t.transfer_direction === 'IN') ? 'income' : ''}>{t.type === 'INCOME' || (t.type === 'TRANSFER' && t.transfer_direction === 'IN') ? '+' : '−'} {formatCurrency(Number(t.amount))}</strong><div className="row-actions">{t.status === 'PENDING' && <button onClick={async () => { await settleTransaction(client, t.id, t.type === 'INCOME' ? 'INCOME' : 'EXPENSE'); await load(); }}>Liquidar</button>} {t.status !== 'CANCELLED' && <button onClick={async () => { if (confirm('Cancelar este lançamento?')) { await cancelTransaction(client, t.id); await load(); } }}>Cancelar</button>}</div></div>)}</div></div>;
}
