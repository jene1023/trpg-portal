export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { supabase, isSupabaseConfigured, PartyTemplate } from "@/lib/supabase";
import PartyTemplateCreateForm from "./PartyTemplateCreateForm";

export default async function PartyTemplatesPage() {
  let templates: PartyTemplate[] = [];

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("party_templates")
      .select("*")
      .order("created_at", { ascending: false });
    templates = (data ?? []) as PartyTemplate[];
  }

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-coc-muted">
          <span className="text-coc-gold">パーティーテンプレート</span>
          <span>·</span>
          <Link href="/kp/narration" className="hover:text-coc-gold transition-colors">
            ナレーション生成
          </Link>
          <span>·</span>
          <Link href="/kp/player-notes" className="hover:text-coc-gold transition-colors">
            常連プレイヤー台帳
          </Link>
        </nav>

        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            パーティーテンプレート
          </h1>
          <p className="text-sm text-coc-muted">
            よく使うメンバー構成を保存して、セッション作成時に再利用できます。
          </p>
        </div>

        <PartyTemplateCreateForm />

        {templates.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
            <Users size={32} className="mx-auto mb-3 text-coc-faint" />
            <p className="text-sm text-coc-muted">テンプレートがまだありません</p>
            <p className="text-xs text-coc-faint mt-1">上のフォームから作成してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              保存済みテンプレート ({templates.length}件)
            </h2>
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/kp/party-templates/${t.id}`}
                className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-cinzel font-semibold text-coc-text text-sm group-hover:text-coc-gold transition-colors">
                    {t.name}
                  </p>
                  {t.description && (
                    <p className="text-xs text-coc-muted mt-0.5 truncate">{t.description}</p>
                  )}
                  <p className="text-xs text-coc-faint mt-1">
                    {t.members.length}名
                  </p>
                </div>
                <span className="text-coc-muted group-hover:text-coc-text transition-colors ml-3">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
