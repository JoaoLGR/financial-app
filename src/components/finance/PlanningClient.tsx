'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { getTransactions, getWorkspaceId } from '@/repositories/finance';
import { formatCurrency } from '@/lib/money';

type Transaction = { type: 'INCOME'|'EXPENSE'; amount: number; competence_date: string; status: string; is_invoice_payment: boolean };
function currentMonth() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }

export function PlanningClient() {
  const client = useMemo(() => createClient(), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const month = currentMonth();
  const load = useCallback(async () => { const workspace = await getWorkspaceId(client); if (!workspace) { setLoading(false); return; } const result = await getTransactions(client, workspace); setTransactions((result.data as Transaction[]) || []); setLoading(false); }, [client]);
  useEffect(() => { void load(); }, [load]);
  const summary = useMemo(() => { const current = transactions.filter(transaction => transaction.competence_date.startsWith(month)); const income = current.filter(transaction => transaction.type === 'INCOME'); const expenses = current.filter(transaction => transaction.type === 'EXPENSE' && !transaction.is_invoice_payment); const received = income.filter(transaction => transaction.status === 'RECEIVED').reduce((sum, transaction) => sum + Number(transaction.amount), 0); const paid = expenses.filter(transaction => transaction.status === 'PAID').reduce((sum, transaction) => sum + Number(transaction.amount), 0); const pending = expenses.filter(transaction => transaction.status === 'PENDING' || transaction.status === 'OVERDUE').reduce((sum, transaction) => sum + Number(transaction.amount), 0); const expectedIncome = income.reduce((sum, transaction) => sum + Number(transaction.amount), 0); return { received, paid, pending, expectedIncome, projected: expectedIncome - paid - pending }; }, [month, transactions]);
  if (loading) return <div className="module"><p className="muted">Carregando planejamento…</p></div>;
  return <div className="module"><h1>Planejamento</h1><p className="muted">Projeção do mês por competência, sem confundir saldo com dinheiro disponível.</p><section className="month-section"><div className="section-title"><div><h2>Mês atual</h2><span className="muted">{month}</span></div></div><div className="metrics"><div><span>Receitas previstas</span><strong className="income">{formatCurrency(summary.expectedIncome)}</strong></div><div><span>Despesas pagas</span><strong>{formatCurrency(summary.paid)}</strong></div><div><span>Pendentes</span><strong>{formatCurrency(summary.pending)}</strong></div></div><div className="list-total"><span>Projeção após compromissos</span><strong>{formatCurrency(summary.projected)}</strong></div></section><section className="list-card"><div className="list-row"><div><strong>Recebido até agora</strong><span>Somente entradas efetivadas</span></div><strong className="income">{formatCurrency(summary.received)}</strong></div><div className="list-row"><div><strong>Compromissos pendentes</strong><span>Despesas pendentes ou vencidas</span></div><strong>{formatCurrency(summary.pending)}</strong></div></section></div>;
}
