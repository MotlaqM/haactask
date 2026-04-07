"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { signUp, signIn, resetPassword, signInWithGoogle } from "./actions";

type AuthMode = "login" | "signup" | "reset";

function AuthForm() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const callbackMessage = searchParams.get("message");

  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(callbackError);
  const [success, setSuccess] = useState<string | null>(callbackMessage);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      let result;

      if (mode === "signup") {
        result = await signUp(formData);
      } else if (mode === "login") {
        result = await signIn(formData);
      } else {
        result = await resetPassword(formData);
      }

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      } else if (mode === "reset") {
        setSuccess("Check your email for a password reset link.");
      }
    });
  }

  function handleGoogleSignIn() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  const heading =
    mode === "login"
      ? "Sign in to HaacTask"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "reset"
              ? "Enter your email to receive a reset link."
              : "Manage your tasks with HaacTask."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-md border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700 dark:text-green-400"
          >
            {success}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "reset" && (
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={6}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="••••••••"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </Button>
        </form>

        {mode !== "reset" && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isPending}
              onClick={handleGoogleSignIn}
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => {
                  setMode("reset");
                  setError(null);
                  setSuccess(null);
                }}
              >
                Forgot password?
              </button>
              <span className="mx-2">·</span>
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccess(null);
                }}
              >
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
            >
              Already have an account? Sign in
            </button>
          )}
          {mode === "reset" && (
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
