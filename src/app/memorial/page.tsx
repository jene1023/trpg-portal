import Link from "next/link";
import Image from "next/image";
import { Scroll } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import TributeForm from "@/app/_components/TributeForm";

export const dynamic = "force-dynamic";

type MemorialCharacter = {
  id: string;
  name: string;
  occupation: string | null;
  portrait_url: string | null;
  status: "dead" | "retired";
  farewell_scene: string | null;
  farewell_message: string | null;
  updated_at: string;
};

type TributeRow = { character_id: string };

export default async function MemorialPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-coc-muted">
        Supabase が未設定です。
      </div>
    );
  }

  const [{ data: characters }, { data: tributes }] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, occupation, portrait_url, status, farewell_scene, farewell_message, updated_at")
      .in("status", ["dead", "retired"])
      .eq("is_public", true)
      .order("updated_at", { ascending: false }),
    supabase.from("character_tributes").select("character_id"),
  ]);

  const chars = (characters ?? []) as MemorialCharacter[];
  const tributeRows = (tributes ?? []) as TributeRow[];

  const tributeCount: Record<string, number> = {};
  for (const row of tributeRows) {
    tributeCount[row.character_id] = (tributeCount[row.character_id] ?? 0) + 1;
  }

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-10 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-coc-muted text-xs uppercase tracking-widest font-cinzel">
          <Scroll size={14} />
          <span>Memorial Hall</span>
        </div>
        <h1 className="font-cinzel text-3xl font-bold text-coc-text">探索者メモリアルホール</h1>
        <p className="font-crimson italic text-coc-muted text-base">
          彼らの勇気と犠牲を、ここに永遠に刻む。
        </p>
      </div>

      {chars.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-coc-muted font-crimson italic text-lg">
            追悼すべき探索者は、まだここにいない。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {chars.map((char) => {
            const isDead = char.status === "dead";
            const count = tributeCount[char.id] ?? 0;

            return (
              <div
                key={char.id}
                className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden"
              >
                <div className="p-5 flex gap-4">
                  {/* Portrait */}
                  <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-coc-border bg-coc-raised flex items-center justify-center">
                    {char.portrait_url ? (
                      <Image
                        src={char.portrait_url}
                        alt={char.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-2xl text-coc-muted select-none">✦</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h2 className="font-cinzel font-bold text-lg text-coc-text leading-tight">
                        {char.name}
                      </h2>
                      <span
                        className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${
                          isDead
                            ? "border-red-700/50 text-red-400 bg-red-900/20"
                            : "border-coc-border text-coc-muted bg-coc-raised"
                        }`}
                      >
                        {isDead ? "死亡" : "引退"}
                      </span>
                    </div>
                    {char.occupation && (
                      <p className="text-xs text-coc-muted mt-0.5">{char.occupation}</p>
                    )}
                    <p className="text-xs text-coc-faint mt-0.5">
                      追悼メッセージ {count} 件
                    </p>
                  </div>
                </div>

                {/* Farewell scene */}
                {char.farewell_scene && (
                  <div className="px-5 pb-4 border-t border-coc-border/40 pt-4">
                    <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-1">
                      最後のシーン
                    </p>
                    <p className="font-crimson text-sm text-coc-text/80 leading-relaxed line-clamp-3">
                      {char.farewell_scene}
                    </p>
                  </div>
                )}

                {/* Farewell message */}
                {char.farewell_message && (
                  <div className="px-5 pb-4">
                    <p className="font-crimson text-sm italic text-coc-muted/80 leading-relaxed">
                      &ldquo;{char.farewell_message}&rdquo;
                    </p>
                  </div>
                )}

                {/* Tribute form */}
                <div className="px-5 pb-5 border-t border-coc-border/40 pt-4">
                  <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-1">
                    追悼メッセージ
                  </p>
                  <TributeForm characterId={char.id} />
                </div>

                {/* Link to character */}
                <div className="px-5 pb-4">
                  <Link
                    href={`/characters/${char.id}`}
                    className="text-xs text-coc-muted hover:text-coc-gold transition-colors"
                  >
                    キャラクター詳細 →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
