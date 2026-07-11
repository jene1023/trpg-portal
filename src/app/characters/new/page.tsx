import CharacterForm from "@/app/_components/CharacterForm";
import Link from "next/link";

export default function NewCharacterPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-6 flex justify-end">
        <Link
          href="/characters/new/wizard"
          className="inline-flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold-dim px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-raised transition-colors"
        >
          ✦ ウィザードで作成（初心者向け）
        </Link>
      </div>
      <CharacterForm />
    </div>
  );
}
