import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDefaultUserData } from "@/lib/default-user-data";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user projects
  let { data: projects } = await supabase
    .from("projects")
    .select("id, name, color, is_inbox, is_archived, position")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  // Ensure Inbox exists (fallback for edge cases)
  if (!projects || projects.length === 0) {
    try {
      await createDefaultUserData(supabase, user.id);
      const { data: refetched } = await supabase
        .from("projects")
        .select("id, name, color, is_inbox, is_archived, position")
        .eq("user_id", user.id)
        .order("position", { ascending: true });
      projects = refetched;
    } catch (e) {
      console.error("Failed to ensure default user data in layout:", e);
    }
  }

  return (
    <div className="flex h-full flex-1">
      <Sidebar projects={projects ?? []} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
