"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VariantProps } from "class-variance-authority";

import {
  Button,
  buttonVariants,
} from "@/components/ui/button";

export function LogoutButton({
  className,
  variant,
}: {
  className?: string;
  variant?: VariantProps<
    typeof buttonVariants
  >["variant"];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant ?? "outline"}
      className={className}
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      {isSubmitting
        ? "Signing out..."
        : "Sign out"}
    </Button>
  );
}
