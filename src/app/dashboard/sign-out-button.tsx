"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "./actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
