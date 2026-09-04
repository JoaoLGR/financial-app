import Link from 'next/link';

export default function AuthPage() {
  return <main className="auth-shell"><div className="auth-mark">✦</div><span className="eyebrow">CLAREZA</span><h1>Seu dinheiro,<br /><em>mais claro.</em></h1><p>Um espaço simples para acompanhar o que entra, o que sai e o que importa.</p><Link className="primary-button auth-button" href="/">Entrar na minha conta</Link><small>Acesso restrito a pessoas autorizadas.</small></main>;
}
