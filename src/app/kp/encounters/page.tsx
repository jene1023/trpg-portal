"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Swords, ChevronDown, ChevronUp, Trash2, Search } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  EncounterTemplateWithEntries,
  Creature,
} from "@/lib/supabase";

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

type CreatureEntry = {
  creature: Pick<Creature, "id" | "name" | "hp" | "dex">;
  count: number;
};

function TemplateCard({ template, onDelete }: { template: EncounterTemplateWithEntries; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const entries = template.encounter_template_entries ?? [];

  return (
    <div className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-cinzel font-semibold text-coc-text text-sm">
            {template.name}
          </p>
          <p className="text-xs text-coc-muted mt-0.5">
            {entries.length === 0
              ? "クリーチャー未登録"
              : entries
                  .map((e) => `${e.creatures.name}×${e.count}`)
                  .join("、")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDelete(template.id)}
                className="text-xs rounded px-2 py-1 bg-red-900/50 text-red-300 border border-red-700 hover:bg-red-800/50 transition-colors"
              >
                削除確定
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="text-xs rounded px-2 py-1 text-coc-muted border border-coc-border hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="rounded-lg border border-coc-border p-1.5 text-coc-faint hover:text-red-400 hover:border-red-700 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "閉じる" : "セッション中に使う"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-coc-border px-5 py-4 space-y-2">
          <p className="text-[10px] font-semibold text-coc-gold uppercase tracking-widest mb-3">
            クリーチャー能力値
          </p>
          {entries.length === 0 ? (
            <p className="text-xs text-coc-faint">クリーチャーが登録されていません</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm text-coc-text">
                      {entry.creatures.name}
                    </p>
                    <span className="text-xs font-medium text-coc-gold bg-coc-surface border border-coc-border rounded-full px-2 py-0.5">
                      ×{entry.count}体
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-coc-muted">
                    <span>
                      HP:{" "}
                      <span className="text-coc-text font-medium">
                        {entry.creatures.hp ?? "—"}
                      </span>
                    </span>
                    <span>
                      DEX:{" "}
                      <span className="text-coc-text font-medium">
                        {entry.creatures.dex ?? "—"}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreatureSearch({
  onAdd,
  added,
}: {
  onAdd: (creature: Pick<Creature, "id" | "name" | "hp" | "dex">) => void;
  added: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pick<Creature, "id" | "name" | "hp" | "dex">[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!isSupabaseConfigured || q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("creatures")
      .select("id, name, hp, dex")
      .ilike("name", `%${q.trim()}%`)
      .limit(8);
    setResults((data ?? []) as Pick<Creature, "id" | "name" | "hp" | "dex">[]);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-faint pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="クリーチャー名で検索…"
          className="w-full rounded-lg border border-coc-border bg-coc-raised pl-8 pr-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
        />
      </div>
      {searching && (
        <p className="text-xs text-coc-faint px-1">検索中…</p>
      )}
      {!searching && query.trim() && results.length === 0 && (
        <p className="text-xs text-coc-faint px-1">見つかりませんでした</p>
      )}
      {results.length > 0 && (
        <div className="rounded-lg border border-coc-border bg-coc-raised divide-y divide-coc-border overflow-hidden">
          {results.map((c) => {
            const isAdded = added.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={isAdded}
                onClick={() => {
                  onAdd(c);
                  setQuery("");
                  setResults([]);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-coc-surface transition-colors disabled:opacity-40"
              >
                <span className="text-sm text-coc-text">{c.name}</span>
                <span className="text-xs text-coc-muted">
                  {isAdded ? "追加済み" : `HP${c.hp ?? "—"} DEX${c.dex ?? "—"}`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KpEncountersPage() {
  const [templates, setTemplates] = useState<EncounterTemplateWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [entries, setEntries] = useState<CreatureEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data } = await supabase
      .from("encounter_templates")
      .select("*, encounter_template_entries(*, creatures(id, name, hp, dex))")
      .order("created_at", { ascending: false });
    setTemplates((data ?? []) as EncounterTemplateWithEntries[]);
    setLoading(false);
  }

  function openCreate() {
    setNewName("");
    setEntries([]);
    setError(null);
    setCreating(true);
  }

  function closeCreate() {
    setCreating(false);
    setError(null);
  }

  function addCreature(creature: Pick<Creature, "id" | "name" | "hp" | "dex">) {
    setEntries((prev) => {
      const existing = prev.find((e) => e.creature.id === creature.id);
      if (existing) {
        return prev.map((e) =>
          e.creature.id === creature.id ? { ...e, count: e.count + 1 } : e
        );
      }
      return [...prev, { creature, count: 1 }];
    });
  }

  function updateCount(creatureId: string, count: number) {
    if (count < 1) return;
    setEntries((prev) =>
      prev.map((e) => (e.creature.id === creatureId ? { ...e, count } : e))
    );
  }

  function removeEntry(creatureId: string) {
    setEntries((prev) => prev.filter((e) => e.creature.id !== creatureId));
  }

  async function handleSave() {
    if (!isSupabaseConfigured || !newName.trim()) return;
    setSaving(true);
    setError(null);

    const { data: tmpl, error: tmplErr } = await supabase
      .from("encounter_templates")
      .insert({ name: newName.trim() })
      .select()
      .single();

    if (tmplErr || !tmpl) {
      setError(tmplErr?.message ?? "テンプレートの作成に失敗しました");
      setSaving(false);
      return;
    }

    if (entries.length > 0) {
      const { error: entErr } = await supabase
        .from("encounter_template_entries")
        .insert(
          entries.map((e) => ({
            template_id: tmpl.id,
            creature_id: e.creature.id,
            count: e.count,
          }))
        );
      if (entErr) {
        setError(entErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeCreate();
    loadTemplates();
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("encounter_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  const addedIds = entries.map((e) => e.creature.id);

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-coc-muted">
          <a href="/kp/party-templates" className="hover:text-coc-gold transition-colors">
            パーティーテンプレート
          </a>
          <span>·</span>
          <a href="/kp/narration" className="hover:text-coc-gold transition-colors">
            ナレーション生成
          </a>
          <span>·</span>
          <a href="/kp/player-notes" className="hover:text-coc-gold transition-colors">
            常連プレイヤー台帳
          </a>
          <span>·</span>
          <span className="text-coc-gold">エンカウンターテンプレート</span>
        </nav>

        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            エンカウンターテンプレート
          </h1>
          <p className="text-sm text-coc-muted">
            繰り返し使うクリーチャー構成を保存し、セッション中に即召喚できます。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl border border-dashed border-coc-border bg-coc-surface px-5 py-4 w-full text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <Plus size={16} />
          新しいテンプレートを作成
        </button>

        {loading ? (
          <div className="text-center py-10 text-sm text-coc-muted">読み込み中…</div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
            <Swords size={32} className="mx-auto mb-3 text-coc-faint" />
            <p className="text-sm text-coc-muted">テンプレートがまだありません</p>
            <p className="text-xs text-coc-faint mt-1">上のボタンから作成してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              保存済みテンプレート ({templates.length}件)
            </p>
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreate();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-coc-border bg-coc-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-base font-semibold text-coc-text">
                エンカウンターテンプレートを作成
              </h2>
              <button
                type="button"
                onClick={closeCreate}
                className="text-coc-faint hover:text-coc-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className={labelClass}>テンプレート名 *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 深海の化け物×2 + ショゴス"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>クリーチャーを追加</label>
              <CreatureSearch onAdd={addCreature} added={addedIds} />
            </div>

            {entries.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-coc-muted uppercase tracking-widest">
                  追加済み ({entries.length}種)
                </p>
                {entries.map((e) => (
                  <div
                    key={e.creature.id}
                    className="flex items-center gap-3 rounded-lg border border-coc-border bg-coc-raised px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-coc-text min-w-0 truncate">
                      {e.creature.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCount(e.creature.id, e.count - 1)}
                        disabled={e.count <= 1}
                        className="w-6 h-6 rounded border border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors disabled:opacity-30 text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm text-coc-text font-medium">
                        {e.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCount(e.creature.id, e.count + 1)}
                        className="w-6 h-6 rounded border border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors text-sm font-bold"
                      >
                        ＋
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(e.creature.id)}
                      className="text-coc-faint hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !newName.trim()}
                className="rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2 disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {saving ? "保存中…" : "作成する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
