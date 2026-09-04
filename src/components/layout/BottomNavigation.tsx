'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiList, FiMoreHorizontal, FiPieChart, FiPlus } from 'react-icons/fi';

export function BottomNavigation() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  return <nav className="bottom-nav" aria-label="Navegação principal">
    <Link className={isActive('/dashboard') ? 'active' : ''} href="/dashboard"><FiHome aria-hidden="true" />Início</Link>
    <Link className={isActive('/transactions') ? 'active' : ''} href="/transactions"><FiList aria-hidden="true" />Lançamentos</Link>
    <Link className="fab" href="/transactions/new" aria-label="Adicionar lançamento"><FiPlus aria-hidden="true" /></Link>
    <Link className={isActive('/planning') ? 'active' : ''} href="/planning"><FiPieChart aria-hidden="true" />Planejamento</Link>
    <Link className={isActive('/more') ? 'active' : ''} href="/more"><FiMoreHorizontal aria-hidden="true" />Mais</Link>
  </nav>;
}
