'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { getAccounts, getCategories, getWorkspaceId } from '@/repositories/finance';
import { formatCurrency } from '@/lib/money';
import { creditCardSchema } from '@/lib/validations/finance';

type Card = { id: string; name: string; brand: string|null; limit_amount: number; closing_day: number; due_day: number; active: boolean };
type Category = { id: string; name: string; type: string; active: boolean };
type Account = { id: string; name: string; active: boolean };
type Invoice = { id: string; credit_card_id: string; reference_month: string; closing_date: string; due_date: string; status: 'OPEN'|'CLOSED'|'PAID'; amount: number };
type UsageRow = { amount: number; credit_card_id: string|null; credit_card_invoice_id: string|null; status: string; is_invoice_payment: boolean };

export function CardsClient() {
  const client = useMemo(() => createClient(), []);
  const [workspace, setWorkspace] = useState<string|null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: '', brand: '', limit: '', closing: '3', due: '10' });
  const [purchase, setPurchase] = useState({ cardId: '', categoryId: '', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
  const [paymentAccount, setPaymentAccount] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const id = await getWorkspaceId(client);
    setWorkspace(id);
    if (!id) return;
    const [cardsResult, categoriesResult, accountsResult, invoicesResult, transactionsResult] = await Promise.all([
      client.from('credit_cards').select('*').eq('workspace_id', id).order('active', { ascending: false }).order('name'),
      getCategories(client, id),
      getAccounts(client, id),
      client.from('credit_card_invoices').select('id,credit_card_id,reference_month,closing_date,due_date,status,credit_cards!inner(workspace_id)').eq('credit_cards.workspace_id', id).order('due_date'),
      client.from('transactions').select('amount,credit_card_id,credit_card_invoice_id,status,is_invoice_payment').eq('workspace_id', id).neq('status', 'CANCELLED'),
    ]);
    const cardList = (cardsResult.data as Card[]) || [];
    const rows = (transactionsResult.data as UsageRow[]) || [];
    const invoiceRows = (invoicesResult.data as Array<Omit<Invoice, 'amount'> & { id: string }>) || [];
    const totals = new Map<string, number>();
    for (const row of rows) {
      if (!row.credit_card_id || row.is_invoice_payment) continue;
      const invoice = invoiceRows.find(item => item.id === row.credit_card_invoice_id);
      if (!invoice || invoice.status !== 'PAID') totals.set(row.credit_card_id, (totals.get(row.credit_card_id) || 0) + Number(row.amount));
    }
    const invoiceTotals = new Map<string, number>();
    for (const row of rows) if (row.credit_card_invoice_id && !row.is_invoice_payment) invoiceTotals.set(row.credit_card_invoice_id, (invoiceTotals.get(row.credit_card_invoice_id) || 0) + Number(row.amount));
    setCards(cardList); setCategories((categoriesResult.data as Category[]) || []); setAccounts((accountsResult.data as Account[]) || []); setUsage(Object.fromEntries(totals)); setInvoices(invoiceRows.map(invoice => ({ ...invoice, amount: invoiceTotals.get(invoice.id) || 0 })));
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  async function submitCard(event: React.FormEvent) {
    event.preventDefault(); if (!workspace) return;
    const data = creditCardSchema.parse({ name: form.name, brand: form.brand || undefined, limitAmount: form.limit, closingDay: Number(form.closing), dueDay: Number(form.due) });
    const { error } = await client.from('credit_cards').insert({ workspace_id: workspace, name: data.name, brand: data.brand || null, limit_amount: data.limitAmount, closing_day: data.closingDay, due_day: data.dueDay });
    if (!error) { setForm({ name: '', brand: '', limit: '', closing: '3', due: '10' }); await load(); }
  }

  async function submitPurchase(event: React.FormEvent) {
    event.preventDefault(); if (!workspace) return;
    await client.rpc('create_credit_card_expense', { p_workspace_id: workspace, p_credit_card_id: purchase.cardId, p_category_id: purchase.categoryId, p_description: purchase.description, p_amount: Number(purchase.amount), p_purchase_date: purchase.date, p_notes: null });
    setPurchase({ ...purchase, description: '', amount: '' }); await load();
  }

  async function payInvoice(invoice: Invoice) {
    const accountId = paymentAccount[invoice.id]; if (!workspace || !accountId) return;
    await client.rpc('pay_credit_card_invoice', { p_workspace_id: workspace, p_invoice_id: invoice.id, p_account_id: accountId, p_payment_date: new Date().toISOString().slice(0, 10) });
    await load();
  }

  return <div className="module"><h1>Cartões</h1><p className="muted">Compras entram na fatura correta e pagamentos debitam uma conta.</p><form className="inline-form" onSubmit={submitCard}><label className="field">Nome<input placeholder="Digite o nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label><label className="field">Bandeira<input placeholder="Opcional" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></label><label className="field">Limite<input type="number" step="0.01" placeholder="R$ 0,00" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} required /></label><label className="field">Fechamento<input type="number" min="1" max="31" value={form.closing} onChange={e => setForm({ ...form, closing: e.target.value })} /></label><label className="field">Vencimento<input type="number" min="1" max="31" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} /></label><button className="primary-button">Adicionar cartão</button></form><div className="card-grid">{cards.map(card => { const used = usage[card.id] || 0; return <article className="credit-card" key={card.id}><div className="card-top"><strong>{card.name}</strong><span>{card.brand || 'Crédito'}</span></div><span className="muted">Limite disponível</span><strong className="card-limit">{formatCurrency(Number(card.limit_amount) - used)}</strong><div className="limit-line"><span style={{ width: `${Math.min(100, used / Number(card.limit_amount || 1) * 100)}%` }} /></div><div className="card-meta"><span>Usado {formatCurrency(used)}</span><span>Fecha {card.closing_day} · vence {card.due_day}</span></div></article>; })}{cards.length === 0 && <p className="muted">Você ainda não cadastrou nenhum cartão.</p>}</div><section className="module-section"><h2>Nova compra no cartão</h2><form className="stack-form" onSubmit={submitPurchase}><select value={purchase.cardId} onChange={e => setPurchase({ ...purchase, cardId: e.target.value })} required><option value="">Cartão</option>{cards.filter(card => card.active).map(card => <option key={card.id} value={card.id}>{card.name}</option>)}</select><select value={purchase.categoryId} onChange={e => setPurchase({ ...purchase, categoryId: e.target.value })} required><option value="">Categoria</option>{categories.filter(category => category.active && (category.type === 'EXPENSE' || category.type === 'BOTH')).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input placeholder="Descrição" value={purchase.description} onChange={e => setPurchase({ ...purchase, description: e.target.value })} required /><input type="number" step="0.01" min="0.01" placeholder="Valor" value={purchase.amount} onChange={e => setPurchase({ ...purchase, amount: e.target.value })} required /><input type="date" value={purchase.date} onChange={e => setPurchase({ ...purchase, date: e.target.value })} /><button className="primary-button">Registrar compra</button></form></section><section className="module-section"><h2>Faturas</h2><div className="list-card">{invoices.map(invoice => { const card = cards.find(item => item.id === invoice.credit_card_id); return <div className="list-row" key={invoice.id}><div><strong>{card?.name || 'Cartão'} · {invoice.reference_month.slice(0, 7)}</strong><span>{invoice.status} · vence {invoice.due_date}</span></div><div><strong>{formatCurrency(invoice.amount)}</strong>{invoice.status !== 'PAID' && <div className="row-actions"><select value={paymentAccount[invoice.id] || ''} onChange={e => setPaymentAccount({ ...paymentAccount, [invoice.id]: e.target.value })}><option value="">Conta para pagar</option>{accounts.filter(account => account.active).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select><button onClick={() => payInvoice(invoice)}>Pagar</button></div>}</div></div>; })}{invoices.length === 0 && <p className="muted">Nenhuma fatura criada.</p>}</div></section></div>;
}
