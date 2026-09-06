"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
      setIsPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isPending}>
      <LogOut className="size-3.5" />
      Sign out
    </Button>
  );
}
