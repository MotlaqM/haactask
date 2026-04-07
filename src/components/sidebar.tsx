"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Inbox, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const activeProjectId = searchParams.get("project");

  const activeProjects = projects
    .filter((p) => !p.is_archived)
    .sort((a, b) => {
      // Inbox always first
      if (a.is_inbox && !b.is_inbox) return -1;
      if (!a.is_inbox && b.is_inbox) return 1;
      return a.position - b.position;
    });

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex h-12 items-center border-b border-border px-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          HaacTask
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Projects
        </p>

        {activeProjects.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No projects yet.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {activeProjects.map((project) => {
              const isActive = activeProjectId === project.id;

              return (
                <li key={project.id}>
                  <Link
                    href={`/dashboard?project=${project.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "hover:bg-muted text-foreground/80 hover:text-foreground"
                    )}
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
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
