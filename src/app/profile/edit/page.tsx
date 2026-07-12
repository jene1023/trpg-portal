export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import PlayerProfileEditWrapper from "@/app/_components/PlayerProfileEditWrapper";

export default function ProfileEditPage() {
  return (
    <div className="coc-page-enter mx-auto max-w-lg px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          ホーム
        </Link>
      </div>

      <h1 className="font-cinzel text-2xl font-bold text-coc-text flex items-center gap-2 mb-6">
        <User size={22} className="text-coc-gold" />
        プロフィール編集
      </h1>

      <div className="rounded-xl border border-coc-border bg-coc-surface px-6 py-5">
        <PlayerProfileEditWrapper />
      </div>
    </div>
  );
}
