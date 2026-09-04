'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirmation) { setError('As senhas não conferem.'); return; }
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) setError('Não foi possível criar a senha. Solicite um novo convite.'); else router.replace('/dashboard');
    setLoading(false);
  }
  return <main className="auth-shell"><div className="auth-mark">✦</div><span className="eyebrow">PRIMEIRO ACESSO</span><h1>Crie sua senha.</h1><p>Escolha uma senha para proteger seu espaço financeiro.</p><form className="auth-form" onSubmit={submit}><label>Nova senha<input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label><label>Confirme a senha<input type="password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required /></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary-button auth-button" disabled={loading}>{loading?'Salvando…':'Criar senha e entrar'}</button></form></main>;
}
