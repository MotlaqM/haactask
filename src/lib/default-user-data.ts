import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates the default user data required for a new user.
 * Currently creates the default "Inbox" project.
 */
export async function createDefaultUserData(
  supabase: SupabaseClient,
  userId: string
) {
  // Check if the user already has an Inbox project (idempotent)
  const { data: existingInbox } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("is_inbox", true)
    .maybeSingle();

  if (existingInbox) {
    return; // Inbox already exists, nothing to do
  }

  const { error } = await supabase.from("projects").insert({
    user_id: userId,
    name: "Inbox",
    color: "#6B7280",
    is_inbox: true,
    is_archived: false,
    position: 0,
  });

  if (error) {
    console.error("Failed to create default Inbox project:", error.message);
    throw new Error("Failed to create default user data.");
  }
}
