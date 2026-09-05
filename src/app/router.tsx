import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, RootRedirect } from './routes/ProtectedRoute';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { UnlockScreen } from '@/features/unlock/UnlockScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { PasswordsScreen } from '@/features/passwords/PasswordsScreen';
import { GeneratorScreen } from '@/features/generator/GeneratorScreen';
import { BankingScreen } from '@/features/banking/BankingScreen';
import { CardsScreen } from '@/features/cards/CardsScreen';
import { IdentityScreen } from '@/features/identity/IdentityScreen';
import { DocumentsScreen } from '@/features/documents/DocumentsScreen';
import { NotesScreen } from '@/features/notes/NotesScreen';
import { WalletsScreen } from '@/features/wallets/WalletsScreen';
import { SecurityCenterScreen } from '@/features/security-center/SecurityCenterScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { RouteErrorBoundary } from '@/ui/primitives/RouteErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/welcome',
    element: <WelcomeScreen />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/unlock',
    element: <UnlockScreen />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardScreen />,
      },
      {
        path: 'passwords',
        element: <PasswordsScreen />,
      },
      {
        path: 'generator',
        element: <GeneratorScreen />,
      },
      {
        path: 'banking',
        element: <BankingScreen />,
      },
      {
        path: 'cards',
        element: <CardsScreen />,
      },
      {
        path: 'identity',
        element: <IdentityScreen />,
      },
      {
        path: 'documents',
        element: <DocumentsScreen />,
      },
      {
        path: 'notes',
        element: <NotesScreen />,
      },
      {
        path: 'wallets',
        element: <WalletsScreen />,
      },
      {
        path: 'security-center',
        element: <SecurityCenterScreen />,
      },
      {
        path: 'settings',
        element: <SettingsScreen />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  basename: import.meta.env.BASE_URL,
});
