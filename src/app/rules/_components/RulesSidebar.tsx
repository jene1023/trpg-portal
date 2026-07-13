"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/rules", label: "概要", exact: true },
  { href: "/rules/abilities", label: "能力値" },
  { href: "/rules/skills", label: "技能一覧" },
  { href: "/rules/combat", label: "戦闘" },
  { href: "/rules/sanity", label: "正気度" },
  { href: "/rules/push", label: "プッシュロール" },
];

export default function RulesSidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-20 rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
      <div className="px-3 py-2 border-b border-coc-border">
        <span className="font-cinzel text-xs font-bold text-coc-gold uppercase tracking-widest">
          カテゴリ
        </span>
      </div>
      <ul className="py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "text-coc-gold bg-coc-gold-dim border-l-2 border-coc-gold"
                    : "text-coc-muted hover:text-coc-text hover:bg-coc-raised border-l-2 border-transparent"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
