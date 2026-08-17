import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '../features/auth/auth.store';
import { Button } from '../shared/components/Button';
import { GlobalSearch } from '../shared/components/GlobalSearch';
import {
  AppWindowIcon,
  BookIcon,
  BoxIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CpuIcon,
  GroupIcon,
  HomeIcon,
  LayersIcon,
  NetworkIcon,
  ServerIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
} from '../shared/components/icons';
import { useAppStore } from '../store/app.store';

// --- Types ---

type NavChildItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

type NavLinkItem = {
  kind: 'link';
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

type NavGroupItem = {
  kind: 'group';
  id: string;
  label: string;
  icon: React.ReactNode;
  children: NavChildItem[];
};

type NavItem = NavLinkItem | NavGroupItem;

// --- Nav structure ---

const NAV_ITEMS: NavItem[] = [
  { kind: 'link', to: '/', label: 'Painel', icon: <HomeIcon /> },
  { kind: 'link', to: '/inventory', label: 'Inventario', icon: <ClipboardIcon /> },
  {
    kind: 'group',
    id: 'governance',
    label: 'Governanca',
    icon: <ShieldIcon />,
    children: [
      { to: '/users', label: 'Usuarios', icon: <UsersIcon />, adminOnly: true },
      { to: '/teams', label: 'Times', icon: <GroupIcon /> },
      { to: '/environments', label: 'Ambientes', icon: <TagIcon /> },
      { to: '/server-types', label: 'Tipos de Maquina', icon: <CpuIcon /> },
      { to: '/application-types', label: 'Tipos de Aplicacao', icon: <AppWindowIcon /> },
      { to: '/audit', label: 'Auditoria', icon: <ClipboardIcon /> },
    ],
  },
  { kind: 'link', to: '/catalog', label: 'Catalogo', icon: <BookIcon /> },
  { kind: 'link', to: '/infrastructure', label: 'Infraestrutura', icon: <LayersIcon /> },
  { kind: 'link', to: '/servers', label: 'Servidores', icon: <ServerIcon /> },
  { kind: 'link', to: '/applications', label: 'Aplicacoes', icon: <BoxIcon /> },
  { kind: 'link', to: '/databases', label: 'Bancos de Dados', icon: <BoxIcon /> },
  { kind: 'link', to: '/urls', label: 'URLs', icon: <NetworkIcon /> },
  { kind: 'link', to: '/ecosystem', label: 'Ecossistema', icon: <NetworkIcon /> },
  { kind: 'link', to: '/settings', label: 'Configuracoes', icon: <SettingsIcon /> },
];

const LINK_CLASS = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm';
const LINK_ACTIVE = 'bg-slate-800 text-slate-100';
const LINK_IDLE = 'text-slate-400 hover:bg-slate-900';
const CHILD_LINK_CLASS = 'flex items-center gap-2 rounded-md py-1.5 pl-7 pr-3 text-sm';

// --- Component ---

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const location = useLocation();
  const isAdmin = user?.roles.includes('admin') ?? false;

  // Auto-expand groups that contain the active route
  const initialExpanded = new Set<string>(
    NAV_ITEMS.filter((item): item is NavGroupItem => item.kind === 'group').flatMap((group) =>
      group.children.some((c) => location.pathname.startsWith(c.to)) ? [group.id] : [],
    ),
  );
  // Always start governance expanded since it holds key items
  initialExpanded.add('governance');

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(initialExpanded);

  function toggleGroup(id: string): void {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {isSidebarOpen && (
        <aside className="w-60 shrink-0 border-r border-slate-800 p-4">
          <p className="mb-6 text-lg font-semibold">Platform Engineering Center</p>
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              if (item.kind === 'link') {
                if (item.adminOnly && !isAdmin) return null;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `${LINK_CLASS} ${isActive ? LINK_ACTIVE : LINK_IDLE}`
                    }
                  >
                    <span className="shrink-0 text-base leading-none">{item.icon}</span>
                    {item.label}
                  </NavLink>
                );
              }

              // kind === 'group'
              const visibleChildren = item.children.filter(
                (c) => !c.adminOnly || isAdmin,
              );
              if (visibleChildren.length === 0) return null;

              const isExpanded = expandedGroups.has(item.id);
              const hasActiveChild = item.children.some((c) =>
                location.pathname.startsWith(c.to),
              );

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.id)}
                    className={`${LINK_CLASS} w-full justify-between ${
                      hasActiveChild && !isExpanded ? LINK_ACTIVE : LINK_IDLE
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="shrink-0 text-base leading-none">{item.icon}</span>
                      {item.label}
                    </span>
                    <ChevronDownIcon
                      className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      {visibleChildren.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            `${CHILD_LINK_CLASS} ${isActive ? LINK_ACTIVE : LINK_IDLE}`
                          }
                        >
                          <span className="shrink-0 text-base leading-none">{child.icon}</span>
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3 gap-4">
          <Button variant="secondary" size="sm" onClick={toggleSidebar}>
            {isSidebarOpen ? 'Ocultar menu' : 'Exibir menu'}
          </Button>
          <GlobalSearch />
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
