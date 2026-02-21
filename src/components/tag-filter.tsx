"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface TagFilterProps {
  tags: string[];
  activeTag?: string;
  isRemote?: boolean;
}

export function TagFilter({ tags, activeTag, isRemote }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <button
        onClick={() => setFilter("remote", isRemote ? undefined : "true")}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          isRemote
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        Remote
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => setFilter("tag", activeTag === tag ? undefined : tag)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeTag === tag
              ? "bg-gray-900 border-gray-900 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {tag.replace(/-/g, " ")}
        </button>
      ))}
    </div>
  );
}
