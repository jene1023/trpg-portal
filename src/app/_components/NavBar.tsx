"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, Bell } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import SearchBar from "./SearchBar";

const navLinks = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/characters", label: "キャラクター" },
  { href: "/build-simulator", label: "ビルドシミュ" },
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
  { href: "/dice/macros", label: "マクロ" },
  { href: "/item-catalog", label: "装備カタログ" },
  { href: "/tags", label: "タグ" },
  { href: "/archive", label: "アーカイブ" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    if (!isSupabaseConfigured) return;
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out ${scrolled ? "bg-coc-void/98 backdrop-blur-md shadow-[0_4px_28px_rgba(0,0,0,0.55),0_1px_0_rgba(61,47,26,0.22)]" : "bg-coc-void/95 backdrop-blur-sm"}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* ロゴ */}
        <Link
          href="/"
          className="flex items-center gap-2 font-cinzel text-lg font-bold text-coc-text hover:text-coc-gold transition-colors"
        >
          <span className="text-coc-gold text-xl select-none coc-star-twinkle">✦</span>
          <span className="coc-nav-logo">CoC Portal</span>
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
                      : "text-coc-muted hover:text-coc-text coc-link-accent"
                  }`}
                >
                  {link.label}
                  {isActive && <span className="coc-nav-active-line" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
          <li>
            <SearchBar inputClassName="w-32 focus:w-44" />
          </li>
          <li>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-1 text-xs text-coc-muted hover:text-coc-gold transition-colors"
                  title="マイプロフィール"
                >
                  <User size={12} />
                  {user.email?.split("@")[0]}
                </Link>
                <Link
                  href="/settings/notifications"
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-coc-muted hover:text-coc-gold transition-colors"
                  title="通知設定"
                >
                  <Bell size={13} />
                </Link>
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
          <div className="px-4 pt-3">
            <SearchBar
              className="w-full"
              inputClassName="w-full pl-8 pr-3 py-2 text-sm"
              iconSize={14}
              onSubmit={() => setOpen(false)}
            />
          </div>
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
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-gold transition-colors"
                  >
                    <User size={14} />
                    マイプロフィール
                  </Link>
                  <Link
                    href="/settings/notifications"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-gold transition-colors"
                  >
                    <Bell size={14} />
                    通知設定
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-coc-faint">{user.email}</span>
                    <button
                      onClick={() => { setOpen(false); handleLogout(); }}
                      className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut size={14} />
                      ログアウト
                    </button>
                  </div>
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
