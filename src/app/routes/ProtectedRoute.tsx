import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '@/state/sessionStore';
import { appVaultService } from '@/application/services/AppVaultService';
import { AppShell } from '@/ui/layout/AppShell';

export function ProtectedRoute() {
  const status = useSessionStore((state) => state.status);
  const [target, setTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === 'unlocked') {
      setTarget(null);
      return;
    }
    if (status === 'locked') {
      setTarget('/unlock');
      return;
    }
    // uninitialized: check if vault exists in storage
    appVaultService.isVaultCreated().then((exists) => {
      setTarget(exists ? '/unlock' : '/welcome');
    });
  }, [status]);

  if (status === 'unlocked') {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  if (target) {
    return <Navigate to={target} replace />;
  }

  return null;
}

export function RootRedirect() {
  const status = useSessionStore((state) => state.status);
  const [target, setTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === 'unlocked') {
      setTarget('/dashboard');
      return;
    }
    if (status === 'locked') {
      setTarget('/unlock');
      return;
    }
    appVaultService.isVaultCreated().then((exists) => {
      setTarget(exists ? '/unlock' : '/welcome');
    });
  }, [status]);

  if (!target) return null;
  return <Navigate to={target} replace />;
}
