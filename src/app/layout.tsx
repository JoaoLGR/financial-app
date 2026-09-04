import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clareza — finanças pessoais',
  description: 'Um jeito simples e confiável de cuidar do seu dinheiro.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
