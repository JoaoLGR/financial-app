import { BottomNavigation } from '@/components/layout/BottomNavigation';

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="app-shell">{children}<BottomNavigation /></div>;
}
