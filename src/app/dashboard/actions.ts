"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string | null;
  const color = formData.get("color") as string | null;

  if (!name || name.trim().length === 0) {
    return { error: "Project name is required." };
  }

  if (!color || color.trim().length === 0) {
    return { error: "Project color is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  // Get the highest position to place the new project after existing ones
  const { data: existing } = await supabase
    .from("projects")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    name: name.trim(),
    color: color.trim(),
    is_inbox: false,
    is_archived: false,
    position: nextPosition,
  });

  if (error) {
    return { error: "Failed to create project. Please try again." };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateProject(
  projectId: string,
  data: { name?: string; color?: string }
) {
  if (!projectId || projectId.trim().length === 0) {
    return { error: "Project ID is required." };
  }

  if (data.name !== undefined && data.name.trim().length === 0) {
    return { error: "Project name cannot be empty." };
  }

  if (
    data.color !== undefined &&
    !/^#[0-9a-fA-F]{6}$/.test(data.color.trim())
  ) {
    return { error: "Invalid color value." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const updates: Record<string, string> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.color !== undefined) updates.color = data.color.trim();

  if (Object.keys(updates).length === 0) {
    return { error: "No changes provided." };
  }

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update project. Please try again." };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function archiveProject(projectId: string) {
  if (!projectId || projectId.trim().length === 0) {
    return { error: "Project ID is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  // Fetch the project to check if it's the Inbox
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("is_inbox")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !project) {
    return { error: "Project not found." };
  }

  if (project.is_inbox) {
    return { error: "The Inbox project cannot be archived." };
  }

  const { error } = await supabase
    .from("projects")
    .update({ is_archived: true })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to archive project. Please try again." };
  }

  revalidatePath("/dashboard");
  return { error: null };
}
