import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Spinner } from '../shared/components/Spinner';

const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CatalogPage = lazy(() =>
  import('../pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const ServiceDetailPage = lazy(() =>
  import('../pages/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage })),
);
const InfrastructurePage = lazy(() =>
  import('../pages/InfrastructurePage').then((m) => ({ default: m.InfrastructurePage })),
);
const GovernancePage = lazy(() =>
  import('../pages/GovernancePage').then((m) => ({ default: m.GovernancePage })),
);
const AuditPage = lazy(() => import('../pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const UsersPage = lazy(() => import('../pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const ServersPage = lazy(() =>
  import('../pages/ServersPage').then((m) => ({ default: m.ServersPage })),
);
const ServerDetailPage = lazy(() =>
  import('../pages/ServerDetailPage').then((m) => ({ default: m.ServerDetailPage })),
);
const ApplicationsPage = lazy(() =>
  import('../pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })),
);
const ApplicationDetailPage = lazy(() =>
  import('../pages/ApplicationDetailPage').then((m) => ({ default: m.ApplicationDetailPage })),
);
const EcosystemPage = lazy(() =>
  import('../pages/EcosystemPage').then((m) => ({ default: m.EcosystemPage })),
);

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<Spinner />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: withSuspense(<LoginPage />) }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: withSuspense(<DashboardPage />) },
          { path: '/catalog', element: withSuspense(<CatalogPage />) },
          { path: '/catalog/:id', element: withSuspense(<ServiceDetailPage />) },
          { path: '/infrastructure', element: withSuspense(<InfrastructurePage />) },
          { path: '/governance', element: withSuspense(<GovernancePage />) },
          { path: '/audit', element: withSuspense(<AuditPage />) },
          { path: '/users', element: withSuspense(<UsersPage />) },
          { path: '/servers', element: withSuspense(<ServersPage />) },
          { path: '/servers/:id', element: withSuspense(<ServerDetailPage />) },
          { path: '/applications', element: withSuspense(<ApplicationsPage />) },
          { path: '/applications/:id', element: withSuspense(<ApplicationDetailPage />) },
          { path: '/ecosystem', element: withSuspense(<EcosystemPage />) },
          { path: '/settings', element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },
]);
