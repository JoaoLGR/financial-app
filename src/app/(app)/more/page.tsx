import Link from 'next/link';

const items = [
  ['Contas', '/accounts', 'Saldos e contas financeiras'],
  ['Categorias', '/categories', 'Organize receitas e despesas'],
  ['Cartões', '/cards', 'Compras, limites e faturas'],
  ['Recorrências', '/recurrences', 'Lançamentos futuros automáticos'],
  ['Abastecimentos', '/fuel', 'Veículos e gastos de combustível'],
];

export default function MorePage() {
  return <div className="module"><h1>Mais</h1><p className="muted">Acesse os módulos de apoio do seu espaço financeiro.</p><div className="list-card">{items.map(([title, href, description]) => <Link className="list-row" href={href} key={href}><div><strong>{title}</strong><span>{description}</span></div><span>›</span></Link>)}</div></div>;
}
