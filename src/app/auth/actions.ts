"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDefaultUserData } from "@/lib/default-user-data";

export type AuthResult = {
  error?: string;
};

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Create default user data (Inbox project) for the new user
  if (data.user) {
    try {
      await createDefaultUserData(supabase, data.user.id);
    } catch (e) {
      console.error("Failed to create default user data on sign-up:", e);
      // Don't block sign-up; the dashboard will handle this as a fallback
    }
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide a clear, user-friendly message for common login failures
    if (error.message === "Invalid login credentials") {
      return { error: "Invalid email or password. Please try again." };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Could not initiate Google sign-in." };
}
