"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ContinueAsButton({
  userId,
  name,
  subtitle,
  isActive,
}: {
  userId: string;
  name: string;
  subtitle: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        throw new Error("Failed to switch user");
      }
      toast.success(`Continuing as ${name}`);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      onClick={handleClick}
      disabled={isPending}
      className={cn("h-auto w-full justify-between px-4 py-3")}
    >
      <span className="flex flex-col items-start text-left">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs opacity-70">{subtitle}</span>
      </span>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        isActive && <Check className="size-4" />
      )}
    </Button>
  );
}
