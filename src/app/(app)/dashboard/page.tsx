import { FiArrowDownLeft, FiArrowUpRight, FiRepeat, FiTruck } from 'react-icons/fi';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardClient } from '@/components/finance/DashboardClient';
import Link from 'next/link';

const actions = [{ label: 'Nova entrada', href: '/transactions/new', icon: FiArrowDownLeft, tone: 'green' }, { label: 'Nova saída', href: '/transactions/new', icon: FiArrowUpRight, tone: 'coral' }, { label: 'Abastecimento', href: '/fuel', icon: FiTruck, tone: 'blue' }, { label: 'Transferência', href: '/transactions/new', icon: FiRepeat, tone: 'lavender' }];

export default function DashboardPage() { return <main className="dashboard-page"><PageHeader /><section className="quick-actions"><div className="section-title"><h2>Acesso rápido</h2><span>1 toque</span></div><div className="action-grid">{actions.map(({ label, href, icon: Icon, tone }) => <Link key={label} href={href} className="action-button"><span className={`action-icon ${tone}`}><Icon size={20} /></span><span>{label}</span></Link>)}</div></section><DashboardClient /></main>; }
