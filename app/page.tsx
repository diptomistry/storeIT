import Link from "next/link";
import { HardDrive, ShieldCheck, UploadCloud, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_40%,#eef2ff_100%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HardDrive className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Store It</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium text-primary">Modern cloud file storage</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Store It
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Securely upload, organize, search, and preview your files from anywhere — with
            architecture ready for future AI-powered search and insights.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? "Go to dashboard" : "Create free account"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: UploadCloud,
              title: "Direct-to-cloud uploads",
              body: "Presigned R2 uploads with quota checks and verified object metadata.",
            },
            {
              icon: ShieldCheck,
              title: "Ownership-first security",
              body: "Supabase Auth, RLS policies, and server-side ownership checks on every action.",
            },
            {
              icon: Sparkles,
              title: "AI-ready foundation",
              body: "Schema stubs for categorization, embeddings, and processing jobs later.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm"
              >
                <span className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="size-4" />
                </span>
                <h2 className="font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
