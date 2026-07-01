import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreatureForm from "@/app/_components/CreatureForm";

export default function NewCreaturePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/creatures"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          クリーチャー一覧
        </Link>
      </div>
      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        クリーチャーを登録
      </h1>
      <CreatureForm />
    </div>
  );
}
