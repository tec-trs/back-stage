import { NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '../features/auth/auth.store';
import { Button } from '../shared/components/Button';
import { useAppStore } from '../store/app.store';

const NAV_ITEMS: { to: string; label: string; adminOnly?: boolean }[] = [
  { to: '/', label: 'Painel' },
  { to: '/catalog', label: 'Catalogo' },
  { to: '/infrastructure', label: 'Infraestrutura' },
  { to: '/servers', label: 'Servidores' },
  { to: '/applications', label: 'Aplicacoes' },
  { to: '/ecosystem', label: 'Ecossistema' },
  { to: '/governance', label: 'Governanca' },
  { to: '/audit', label: 'Auditoria' },
  { to: '/users', label: 'Usuarios', adminOnly: true },
  { to: '/settings', label: 'Configuracoes' },
];

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const isAdmin = user?.roles.includes('admin') ?? false;
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {isSidebarOpen && (
        <aside className="w-60 shrink-0 border-r border-slate-800 p-4">
          <p className="mb-6 text-lg font-semibold">Platform Engineering Center</p>
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm ${
                    isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
          <Button variant="secondary" size="sm" onClick={toggleSidebar}>
            {isSidebarOpen ? 'Ocultar menu' : 'Exibir menu'}
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-slate-400">{user?.code}</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
