import { NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '../features/auth/auth.store';
import { useAppStore } from '../store/app.store';

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/catalog', label: 'Catalog' },
  { to: '/infrastructure', label: 'Infrastructure' },
  { to: '/governance', label: 'Governance' },
  { to: '/audit', label: 'Audit' },
  { to: '/settings', label: 'Settings' },
];

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {isSidebarOpen && (
        <aside className="w-60 shrink-0 border-r border-slate-800 p-4">
          <p className="mb-6 text-lg font-semibold">Platform Engineering Center</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
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
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            {isSidebarOpen ? 'Ocultar menu' : 'Exibir menu'}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
