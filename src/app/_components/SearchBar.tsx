"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  className?: string;
  inputClassName?: string;
  iconSize?: number;
  placeholder?: string;
  onSubmit?: () => void;
}

export default function SearchBar({
  className = "",
  inputClassName = "",
  iconSize = 13,
  placeholder = "検索...",
  onSubmit,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setQuery("");
      onSubmit?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search
        size={iconSize}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`rounded-lg border border-coc-border bg-coc-surface pl-7 pr-2 py-1.5 text-xs text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-all ${inputClassName}`}
      />
    </form>
  );
}
