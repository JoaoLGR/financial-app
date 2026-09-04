import { createClient } from '@/lib/supabase/server';

export async function PageHeader() {
  let name = 'Pessoa';
  let initials = 'P';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      const { data: profile } = await client.from('profiles').select('name').eq('id', user.id).maybeSingle();
      name = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || name;
    }
  }
  initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || initials;
  return <header className="topbar"><div><span className="eyebrow">SEU ESPAÇO FINANCEIRO</span><h1>Bom dia, {name} <span aria-hidden="true">✦</span></h1></div><button className="avatar" aria-label="Abrir perfil">{initials}</button></header>;
}
