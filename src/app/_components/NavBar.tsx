"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";

const navLinks = [
  { href: "/characters", label: "キャラクター" },
  { href: "/scenarios", label: "シナリオ" },
  { href: "/npcs", label: "NPC" },
  { href: "/rules", label: "ルール" },
  { href: "/materials", label: "素材" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchQuery("");
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-coc-void/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* ロゴ */}
        <Link
          href="/"
          className="flex items-center gap-2 font-cinzel text-lg font-bold text-coc-text hover:text-coc-gold transition-colors"
        >
          <span className="text-coc-gold text-xl select-none">✦</span>
          CoC Portal
        </Link>

        {/* デスクトップナビ */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-medium transition-colors pb-0.5 ${
                    isActive
                      ? "text-coc-gold border-b border-coc-gold"
                      : "text-coc-muted hover:text-coc-text"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
              <input
                type="text"
                placeholder="検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 rounded-lg border border-coc-border bg-coc-surface pl-7 pr-2 py-1.5 text-xs text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold focus:w-44 transition-all"
              />
            </form>
          </li>
        </ul>

        {/* モバイルハンバーガー */}
        <button
          className="md:hidden text-coc-muted hover:text-coc-text transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="メニュー"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* グラデーションボーダーライン */}
      <div className="h-px bg-gradient-to-r from-transparent via-coc-border to-transparent" />

      {/* モバイルドロワー */}
      {open && (
        <div className="md:hidden border-t border-coc-border bg-coc-void">
          <form onSubmit={handleSearchSubmit} className="relative px-4 pt-3">
            <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface pl-8 pr-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors"
            />
          </form>
          <ul className="flex flex-col px-4 py-3 gap-3">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`block text-sm font-medium transition-colors ${
                      isActive ? "text-coc-gold" : "text-coc-muted hover:text-coc-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
