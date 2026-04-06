import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDefaultUserData } from "@/lib/default-user-data";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Ensure the user has default data (Inbox project) — fallback for edge cases
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, color, is_inbox, is_archived, position")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (!projects || projects.length === 0) {
    try {
      await createDefaultUserData(supabase, user.id);
    } catch (e) {
      console.error("Failed to ensure default user data on dashboard:", e);
    }
  }

  const inbox = projects?.find((p) => p.is_inbox);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to HaacTask
        </h1>
        <p className="text-sm text-muted-foreground">
          You are signed in as{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </p>
        {inbox && (
          <p className="text-sm text-muted-foreground">
            Your default project:{" "}
            <span className="font-medium text-foreground">{inbox.name}</span>
          </p>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
