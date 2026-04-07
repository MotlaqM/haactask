"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox, FolderOpen, Plus, X, Pencil, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createProject, updateProject, archiveProject } from "@/app/dashboard/actions";

const PROJECT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

type Project = {
  id: string;
  name: string;
  color: string;
  is_inbox: boolean;
  is_archived: boolean;
  position: number;
};

export function Sidebar({ projects }: { projects: Project[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeProjectId = searchParams.get("project");

  const [showForm, setShowForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[5]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditPending, startEditTransition] = useTransition();
  const editInputRef = useRef<HTMLInputElement>(null);

  // Archive state
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchivePending, startArchiveTransition] = useTransition();

  const activeProjects = projects
    .filter((p) => !p.is_archived)
    .sort((a, b) => {
      // Inbox always first
      if (a.is_inbox && !b.is_inbox) return -1;
      if (!a.is_inbox && b.is_inbox) return 1;
      return a.position - b.position;
    });

  function handleOpenForm() {
    setShowForm(true);
    setError(null);
    setSelectedColor(PROJECT_COLORS[5]);
    setEditingProjectId(null);
    // Focus the name input after render
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  function handleCancel() {
    setShowForm(false);
    setError(null);
  }

  async function handleSubmit(formData: FormData) {
    formData.set("color", selectedColor);

    startTransition(async () => {
      const result = await createProject(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        setError(null);
        router.refresh();
      }
    });
  }

  function handleStartEdit(project: Project) {
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditColor(project.color);
    setEditError(null);
    setShowForm(false);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function handleCancelEdit() {
    setEditingProjectId(null);
    setEditError(null);
  }

  function handleSaveEdit(projectId: string) {
    if (!editName.trim()) {
      setEditError("Project name cannot be empty.");
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Save previous values for rollback
    const prevName = project.name;
    const prevColor = project.color;

    startEditTransition(async () => {
      const result = await updateProject(projectId, {
        name: editName,
        color: editColor,
      });

      if (result.error) {
        // Rollback to previous values
        setEditName(prevName);
        setEditColor(prevColor);
        setEditError(result.error);
      } else {
        setEditingProjectId(null);
        setEditError(null);
        router.refresh();
      }
    });
  }

  function handleEditKeyDown(e: React.KeyboardEvent, projectId: string) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit(projectId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

  function handleArchive(projectId: string) {
    setArchiveError(null);
    startArchiveTransition(async () => {
      const result = await archiveProject(projectId);
      if (result.error) {
        setArchiveError(result.error);
      } else {
        // If the archived project was active, navigate to dashboard
        if (activeProjectId === projectId) {
          router.push("/dashboard");
        }
        router.refresh();
      }
    });
  }

  // Focus the edit input when editingProjectId changes
  useEffect(() => {
    if (editingProjectId) {
      editInputRef.current?.focus();
    }
  }, [editingProjectId]);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex h-12 items-center border-b border-border px-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          HaacTask
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-1 flex items-center justify-between px-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Projects
          </p>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleOpenForm}
            aria-label="New project"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        {showForm && (
          <form action={handleSubmit} className="mb-2 rounded-md border border-border bg-background p-2">
            <input
              ref={nameInputRef}
              name="name"
              type="text"
              placeholder="Project name"
              required
              className="mb-2 w-full rounded-md border border-border bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
              autoComplete="off"
            />

            <div className="mb-2 flex flex-wrap gap-1">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "size-5 rounded-full border-2 transition-transform",
                    selectedColor === color
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>

            {error && (
              <p className="mb-2 text-xs text-destructive">{error}</p>
            )}

            <div className="flex gap-1">
              <Button type="submit" size="xs" disabled={isPending} className="flex-1">
                {isPending ? "Creating..." : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handleCancel}
                aria-label="Cancel"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </form>
        )}

        {archiveError && (
          <p className="mb-2 rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
            {archiveError}
          </p>
        )}

        {activeProjects.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No projects yet.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {activeProjects.map((project) => {
              const isActive = activeProjectId === project.id;
              const isEditing = editingProjectId === project.id;

              if (isEditing) {
                return (
                  <li key={project.id}>
                    <div className="rounded-md border border-border bg-background p-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, project.id)}
                        className="mb-2 w-full rounded-md border border-border bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
                        autoComplete="off"
                      />

                      <div className="mb-2 flex flex-wrap gap-1">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditColor(color)}
                            className={cn(
                              "size-5 rounded-full border-2 transition-transform",
                              editColor === color
                                ? "scale-110 border-foreground"
                                : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>

                      {editError && (
                        <p className="mb-2 text-xs text-destructive">{editError}</p>
                      )}

                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="xs"
                          disabled={isEditPending}
                          className="flex-1"
                          onClick={() => handleSaveEdit(project.id)}
                        >
                          {isEditPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={handleCancelEdit}
                          aria-label="Cancel edit"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={project.id} className="group">
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "hover:bg-muted text-foreground/80 hover:text-foreground"
                    )}
                  >
                    <Link
                      href={`/dashboard?project=${project.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      {project.is_inbox ? (
                        <Inbox className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <FolderOpen
                          className="size-4 shrink-0"
                          style={{ color: project.color }}
                        />
                      )}
                      <span className="truncate">{project.name}</span>
                    </Link>
                    {!project.is_inbox && (
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleStartEdit(project)}
                          aria-label={`Edit ${project.name}`}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleArchive(project.id)}
                          disabled={isArchivePending}
                          aria-label={`Archive ${project.name}`}
                        >
                          <Archive className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
