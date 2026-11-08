"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import {
  demoAccessLoginAction,
  loginAction,
  type ActionResult,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const initial: ActionResult = {};

export function LoginForm({ showDevBypass = false }: { showDevBypass?: boolean }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const demoKey = searchParams.get("demo") ?? searchParams.get("bypass") ?? "";
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [demoState, demoFormAction, demoPending] = useActionState(
    demoAccessLoginAction,
    initial
  );

  useEffect(() => {
    if (!showDevBypass || !demoKey) return;
    const form = document.getElementById("demo-access-form") as HTMLFormElement | null;
    form?.requestSubmit();
  }, [showDevBypass, demoKey]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>

      {showDevBypass ? (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-slate-400">Demo access</span>
            <Separator className="flex-1" />
          </div>

          <form id="demo-access-form" action={demoFormAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            {demoState.error ? (
              <Alert variant="destructive">
                <AlertDescription>{demoState.error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="accessKey">Demo access key</Label>
              <Input
                id="accessKey"
                name="accessKey"
                type="password"
                defaultValue={demoKey}
                placeholder="Enter demo access key"
                required
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={demoPending}
            >
              {demoPending ? "Signing in…" : "Continue with demo access"}
            </Button>
            <p className="text-center text-xs text-slate-400">
              Local only. Requires <code>DEV_MODE=true</code>.
            </p>
          </form>
        </>
      ) : null}
    </div>
  );
}
