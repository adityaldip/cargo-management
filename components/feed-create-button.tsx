"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FeedCreateButton() {
  return (
    <Button asChild type="button">
      <Link href="/feeds/new">New post</Link>
    </Button>
  );
}
