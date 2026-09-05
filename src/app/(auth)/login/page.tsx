'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
    if (signInError) setError('Não foi possível entrar. Confira seu e-mail e senha.');
    else router.push('/dashboard');
    setLoading(false);
  }

  return <main className="auth-shell"><div className="auth-mark">✦</div><span className="eyebrow">CLAREZA</span><h1>Seu dinheiro,<br /><em>mais claro.</em></h1><p>Entre para acompanhar o que entra, o que sai e o que importa.</p><form className="auth-form" onSubmit={handleSubmit}><label>E-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label><label>Senha<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button auth-button" disabled={loading}>{loading ? 'Entrando…' : 'Entrar na minha conta'}</button></form><small>Acesso restrito a pessoas previamente autorizadas.</small></main>;
}
