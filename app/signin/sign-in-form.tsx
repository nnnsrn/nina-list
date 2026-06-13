"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SignInFormProps = {
  nextPath: string;
};

export default function SignInForm({ nextPath }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(typeof payload.error === "string" ? payload.error : "Unable to sign in.");
        return;
      }

      router.replace(nextPath.startsWith("/") ? nextPath : "/admin");
      router.refresh();
    } catch {
      setError("Unable to connect to the login endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.16),transparent_35%),linear-gradient(180deg,rgba(4,14,20,1),rgba(2,8,12,1))] text-on-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        <section className="relative overflow-hidden rounded-4xl border border-primary/15 bg-surface-container-low/75 backdrop-blur-2xl p-8 md:p-12 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.08),transparent_30%)] pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3 mb-8">
            <div>
              <p className="font-label-md text-xs tracking-[0.3em] text-primary-container uppercase">NinaList</p>
              <h1 className="font-plus-jakarta text-2xl md:text-3xl font-bold text-on-surface">Admin Access</h1>
            </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="font-plus-jakarta text-4xl md:text-6xl font-bold leading-tight text-on-surface mb-5">
              One account to rule them all
            </h2>
            <p className="font-manrope text-base md:text-lg text-on-surface-variant leading-relaxed max-w-lg">
              If you are not the admin, please return to the public site.
            </p>
          </div>
        </section>

        <section className="rounded-4xl border border-outline-variant/15 bg-surface-container/80 backdrop-blur-2xl p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-8">
            <h3 className="font-plus-jakarta text-2xl font-bold text-on-surface mb-2">Sign in to the dashboard</h3>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Admin email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl bg-background/70 border border-outline-variant/25 px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl bg-background/70 border border-outline-variant/25 px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-linear-to-r from-primary-fixed to-primary-container px-4 py-3.5 text-on-primary-container font-semibold tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.18)] hover:shadow-[0_0_30px_rgba(0,229,255,0.28)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Signing in..." : "Enter Admin Dashboard"}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between gap-4 text-sm text-on-surface-variant">
            <span>Not the admin?</span>
            <Link href="/" className="text-primary hover:text-primary-container transition-colors font-medium">
              Return to the public site
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}