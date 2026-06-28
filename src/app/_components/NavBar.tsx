"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/characters", label: "キャラクター" },
  { href: "/npcs", label: "NPC" },
  { href: "/rules", label: "ルール" },
  { href: "/materials", label: "素材" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-coc-border bg-coc-void/95 backdrop-blur-sm">
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

      {/* モバイルドロワー */}
      {open && (
        <div className="md:hidden border-t border-coc-border bg-coc-void">
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
