"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FeedSearchForm({
  initialSearch,
}: {
  initialSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(
    initialSearch
  );

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    router.push(
      `/feeds${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 md:flex-row"
    >
      <Input
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder="Search posts or #hashtags"
        className="md:max-w-md"
      />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
