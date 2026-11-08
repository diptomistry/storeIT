import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { isPublicDevModeEnabled } from "@/lib/auth/dev-bypass";

export default function LoginPage() {
  const showDevBypass = isPublicDevModeEnabled();

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to access your files securely.">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
        <LoginForm showDevBypass={showDevBypass} />
      </Suspense>
    </AuthShell>
  );
}
