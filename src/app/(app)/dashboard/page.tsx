import { ArrowDownLeft, ArrowUpRight, CarFront, WalletCards } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardClient } from '@/components/finance/DashboardClient';

const actions = [{ label: 'Nova entrada', icon: ArrowDownLeft, tone: 'green' }, { label: 'Nova saída', icon: ArrowUpRight, tone: 'coral' }, { label: 'Abastecimento', icon: CarFront, tone: 'blue' }, { label: 'Transferência', icon: WalletCards, tone: 'lavender' }];

export default function DashboardPage() { return <main className="dashboard-page"><PageHeader /><section className="quick-actions"><div className="section-title"><h2>Acesso rápido</h2><span>1 toque</span></div><div className="action-grid">{actions.map(({ label, icon: Icon, tone }) => <button key={label} className="action-button"><span className={`action-icon ${tone}`}><Icon size={20} /></span><span>{label}</span></button>)}</div></section><DashboardClient /></main>; }
