import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Handle OAuth error responses (e.g. user canceled, provider denied)
  const oauthError = searchParams.get("error");
  if (oauthError) {
    const errorDescription =
      searchParams.get("error_description") ?? "Authentication was canceled or failed.";
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code and no explicit error — something unexpected happened
  return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("Could not authenticate. Please try again.")}`);
}
