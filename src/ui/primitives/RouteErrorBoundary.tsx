import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/ui/primitives/Button';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'An unexpected error occurred while rendering this page.';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center page-bg text-ink">
      <div className="max-w-md w-full rounded-2xl border border-line bg-card p-6 shadow-card space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/20">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-display font-bold text-ink">Something went wrong</h2>
          <p className="text-xs text-ink/65 leading-relaxed">
            AegisVault ran into an unexpected rendering issue. Your encrypted data in storage remains completely safe and untouched.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-moss/70 p-3 text-left">
          <p className="text-[11px] font-mono text-ink/75 break-words line-clamp-3">
            {errorMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Page</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Go to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
