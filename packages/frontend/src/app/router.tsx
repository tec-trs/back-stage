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
const EnvironmentsPage = lazy(() =>
  import('../pages/EnvironmentsPage').then((m) => ({ default: m.EnvironmentsPage })),
);
const ServerTypesPage = lazy(() =>
  import('../pages/ServerTypesPage').then((m) => ({ default: m.ServerTypesPage })),
);
const ApplicationTypesPage = lazy(() =>
  import('../pages/ApplicationTypesPage').then((m) => ({ default: m.ApplicationTypesPage })),
);
const TeamsPage = lazy(() =>
  import('../pages/TeamsPage').then((m) => ({ default: m.TeamsPage })),
);
const DatabasesPage = lazy(() =>
  import('../pages/DatabasesPage').then((m) => ({ default: m.DatabasesPage })),
);
const DatabaseDetailPage = lazy(() =>
  import('../pages/DatabaseDetailPage').then((m) => ({ default: m.DatabaseDetailPage })),
);
const UrlsPage = lazy(() =>
  import('../pages/UrlsPage').then((m) => ({ default: m.UrlsPage })),
);
const UrlDetailPage = lazy(() =>
  import('../pages/UrlDetailPage').then((m) => ({ default: m.UrlDetailPage })),
);
const SearchResultsPage = lazy(() =>
  import('../pages/SearchResultsPage').then((m) => ({ default: m.SearchResultsPage })),
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
          { path: '/databases', element: withSuspense(<DatabasesPage />) },
          { path: '/databases/:id', element: withSuspense(<DatabaseDetailPage />) },
          { path: '/urls', element: withSuspense(<UrlsPage />) },
          { path: '/urls/:id', element: withSuspense(<UrlDetailPage />) },
          { path: '/search', element: withSuspense(<SearchResultsPage />) },
          { path: '/ecosystem', element: withSuspense(<EcosystemPage />) },
          { path: '/environments', element: withSuspense(<EnvironmentsPage />) },
          { path: '/teams', element: withSuspense(<TeamsPage />) },
          { path: '/server-types', element: withSuspense(<ServerTypesPage />) },
          { path: '/application-types', element: withSuspense(<ApplicationTypesPage />) },
          { path: '/settings', element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },
]);
