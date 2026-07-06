"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X, LogOut, User } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

const navLinks = [
  { href: "/characters", label: "キャラクター" },
  { href: "/scenarios", label: "シナリオ" },
  { href: "/campaigns", label: "キャンペーン" },
  { href: "/npcs", label: "NPC" },
  { href: "/npc-presets", label: "NPCプリセット" },
  { href: "/creatures", label: "クリーチャー" },
  { href: "/mythos", label: "神話辞典" },
  { href: "/rules", label: "ルール" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/materials", label: "素材" },
  { href: "/stats", label: "統計" },
  { href: "/dice-calc", label: "確率計算" },
  { href: "/item-catalog", label: "装備カタログ" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  async function handleLogout() {
    if (!isSupabaseConfigured) return;
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
          <span className="text-coc-gold text-xl select-none coc-star-twinkle">✦</span>
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
                  className={`relative text-sm font-medium transition-colors pb-1 ${
                    isActive
                      ? "text-coc-gold"
                      : "text-coc-muted hover:text-coc-text"
                  }`}
                >
                  {link.label}
                  {isActive && <span className="coc-nav-active-line" aria-hidden="true" />}
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
          <li>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-coc-muted">
                  <User size={12} />
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="ログアウト"
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-coc-muted hover:text-red-400 transition-colors"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-gold hover:border-coc-gold transition-colors"
              >
                ログイン
              </Link>
            )}
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
      <div className="coc-nav-border" aria-hidden="true" />

      {/* モバイルドロワー */}
      {open && (
        <div className="coc-mobile-drawer md:hidden border-t border-coc-border bg-coc-void">
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
            <li className="border-t border-coc-border pt-3 mt-1">
              {user ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-coc-muted">
                    <User size={14} />
                    {user.email}
                  </span>
                  <button
                    onClick={() => { setOpen(false); handleLogout(); }}
                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut size={14} />
                    ログアウト
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-coc-gold hover:text-amber-400 transition-colors"
                >
                  ログイン / 新規登録
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
