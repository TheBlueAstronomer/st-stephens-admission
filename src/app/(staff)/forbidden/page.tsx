import { ShieldWarningIcon } from '@phosphor-icons/react/dist/ssr';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldWarningIcon size={48} weight="light" className="text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
      <p className="max-w-md text-muted-foreground">
        You do not have permission to access this page. If you believe this is
        an error, please contact your system administrator.
      </p>
    </div>
  );
}
