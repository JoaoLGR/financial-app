'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    const client = createClient();
    void client.auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/auth/set-password' : '/login?error=invite');
    });
  }, [router]);
  return <main className="auth-shell auth-loading"><div className="auth-mark">✦</div><h1>Confirmando seu acesso…</h1><p>Aguarde enquanto preparamos sua conta.</p></main>;
}
