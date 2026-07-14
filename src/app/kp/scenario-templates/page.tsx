"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookMarked, Plus, X, Globe, Lock, Trash2, PlusCircle } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioTemplate, ScenarioTemplateData } from "@/lib/supabase";

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

function emptyTemplateData(): ScenarioTemplateData {
  return { scenes: [], npc_slots: [], handout_count: 0, creature_slots: [] };
}

export default function ScenarioTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPublic, setCreatePublic] = useState(false);
  const [createScenes, setCreateScenes] = useState<{ title: string }[]>([]);
  const [sceneInput, setSceneInput] = useState("");
  const [createNpcSlots, setCreateNpcSlots] = useState<{ role: string }[]>([]);
  const [npcInput, setNpcInput] = useState("");
  const [createHandoutCount, setCreateHandoutCount] = useState(0);
  const [createCreatureSlots, setCreateCreatureSlots] = useState<{ role: string }[]>([]);
  const [creatureInput, setCreatureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Create-from-template state
  const [creatingFrom, setCreatingFrom] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("scenario_templates")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTemplates((data ?? []) as ScenarioTemplate[]);
        setLoading(false);
      });
  }, []);

  async function handleCreate() {
    if (!isSupabaseConfigured || !createTitle.trim()) return;
    setSaving(true);
    setSaveError(null);

    const templateData: ScenarioTemplateData = {
      scenes: createScenes.map((s, i) => ({ title: s.title, order: i + 1 })),
      npc_slots: createNpcSlots,
      handout_count: createHandoutCount,
      creature_slots: createCreatureSlots,
    };

    const { data, error } = await supabase
      .from("scenario_templates")
      .insert({
        title: createTitle.trim(),
        description: createDesc.trim() || null,
        template_data: templateData,
        is_public: createPublic,
      })
      .select()
      .single();

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    setTemplates((prev) => [data as ScenarioTemplate, ...prev]);
    setCreateTitle("");
    setCreateDesc("");
    setCreatePublic(false);
    setCreateScenes([]);
    setCreateNpcSlots([]);
    setCreateHandoutCount(0);
    setCreateCreatureSlots([]);
    setShowCreate(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    if (!confirm("このテンプレートを削除しますか？")) return;
    await supabase.from("scenario_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleCreateScenario(template: ScenarioTemplate) {
    if (!isSupabaseConfigured) return;
    setCreatingFrom(template.id);

    const { data: scenario, error: sErr } = await supabase
      .from("scenarios")
      .insert({
        title: `新しいシナリオ（${template.title}）`,
        status: "planning",
      })
      .select()
      .single();

    if (sErr || !scenario) {
      alert(sErr?.message ?? "シナリオの作成に失敗しました");
      setCreatingFrom(null);
      return;
    }

    const td = template.template_data as ScenarioTemplateData;

    const inserts: Promise<unknown>[] = [];

    if (td.scenes.length > 0) {
      inserts.push(
        supabase.from("scenario_scenes").insert(
          td.scenes.map((s) => ({
            scenario_id: scenario.id,
            title: s.title,
            scene_order: s.order,
          }))
        )
      );
    }

    if (td.handout_count > 0) {
      inserts.push(
        supabase.from("handouts").insert(
          Array.from({ length: td.handout_count }, (_, i) => ({
            scenario_id: scenario.id,
            title: `ハンドアウト ${i + 1}`,
            is_secret: false,
            is_distributed: false,
          }))
        )
      );
    }

    await Promise.all(inserts);
    setCreatingFrom(null);
    router.push(`/scenarios/${scenario.id}`);
  }

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-coc-muted">
          <span className="text-coc-gold">シナリオテンプレート</span>
          <span>·</span>
          <Link href="/kp/scenario-templates/public" className="hover:text-coc-gold transition-colors">
            公開テンプレート
          </Link>
          <span>·</span>
          <Link href="/kp/party-templates" className="hover:text-coc-gold transition-colors">
            パーティーテンプレート
          </Link>
          <span>·</span>
          <Link href="/kp/narration" className="hover:text-coc-gold transition-colors">
            ナレーション生成
          </Link>
        </nav>

        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            シナリオテンプレート
          </h1>
          <p className="text-sm text-coc-muted">
            シナリオの骨格（シーン構成・ハンドアウト枠・NPC配置）をテンプレートとして保存し、次回制作時に再利用できます。
          </p>
        </div>

        {/* Create form toggle */}
        {!showCreate ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl border border-dashed border-coc-border bg-coc-surface px-5 py-4 w-full text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
          >
            <Plus size={16} />
            新しいテンプレートを手動作成
          </button>
        ) : (
          <div className="rounded-xl border border-coc-border bg-coc-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-sm font-semibold text-coc-text">新しいテンプレート</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-coc-faint hover:text-coc-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className={labelClass}>テンプレート名 *</label>
              <input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="例: 3シーン標準構成"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>説明（任意）</label>
              <input
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="例: 調査→クライマックス→エンディングの基本構成"
                className={fieldClass}
              />
            </div>

            {/* Scenes */}
            <div>
              <label className={labelClass}>シーン</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={sceneInput}
                  onChange={(e) => setSceneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && sceneInput.trim()) {
                      setCreateScenes((p) => [...p, { title: sceneInput.trim() }]);
                      setSceneInput("");
                    }
                  }}
                  placeholder="シーン名（Enterで追加）"
                  className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (sceneInput.trim()) {
                      setCreateScenes((p) => [...p, { title: sceneInput.trim() }]);
                      setSceneInput("");
                    }
                  }}
                  className="flex items-center rounded-lg border border-coc-border px-3 py-2 text-coc-muted hover:text-coc-gold hover:border-coc-gold transition-colors"
                >
                  <PlusCircle size={16} />
                </button>
              </div>
              {createScenes.length > 0 && (
                <ul className="space-y-1">
                  {createScenes.map((s, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-text">
                      <span><span className="text-coc-muted mr-2">{i + 1}.</span>{s.title}</span>
                      <button type="button" onClick={() => setCreateScenes((p) => p.filter((_, j) => j !== i))} className="text-coc-faint hover:text-red-400 transition-colors"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* NPC slots */}
            <div>
              <label className={labelClass}>NPC枠</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={npcInput}
                  onChange={(e) => setNpcInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && npcInput.trim()) {
                      setCreateNpcSlots((p) => [...p, { role: npcInput.trim() }]);
                      setNpcInput("");
                    }
                  }}
                  placeholder="役割名（例: 依頼人）"
                  className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (npcInput.trim()) {
                      setCreateNpcSlots((p) => [...p, { role: npcInput.trim() }]);
                      setNpcInput("");
                    }
                  }}
                  className="flex items-center rounded-lg border border-coc-border px-3 py-2 text-coc-muted hover:text-coc-gold hover:border-coc-gold transition-colors"
                >
                  <PlusCircle size={16} />
                </button>
              </div>
              {createNpcSlots.length > 0 && (
                <ul className="space-y-1">
                  {createNpcSlots.map((n, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-text">
                      <span>{n.role}</span>
                      <button type="button" onClick={() => setCreateNpcSlots((p) => p.filter((_, j) => j !== i))} className="text-coc-faint hover:text-red-400 transition-colors"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Handout count */}
            <div>
              <label className={labelClass}>ハンドアウト枚数</label>
              <input
                type="number"
                min={0}
                value={createHandoutCount}
                onChange={(e) => setCreateHandoutCount(Number(e.target.value))}
                className="w-24 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
              />
            </div>

            {/* Creature slots */}
            <div>
              <label className={labelClass}>クリーチャー枠</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={creatureInput}
                  onChange={(e) => setCreatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && creatureInput.trim()) {
                      setCreateCreatureSlots((p) => [...p, { role: creatureInput.trim() }]);
                      setCreatureInput("");
                    }
                  }}
                  placeholder="役割（例: ボス）"
                  className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (creatureInput.trim()) {
                      setCreateCreatureSlots((p) => [...p, { role: creatureInput.trim() }]);
                      setCreatureInput("");
                    }
                  }}
                  className="flex items-center rounded-lg border border-coc-border px-3 py-2 text-coc-muted hover:text-coc-gold hover:border-coc-gold transition-colors"
                >
                  <PlusCircle size={16} />
                </button>
              </div>
              {createCreatureSlots.length > 0 && (
                <ul className="space-y-1">
                  {createCreatureSlots.map((c, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-text">
                      <span>{c.role}</span>
                      <button type="button" onClick={() => setCreateCreatureSlots((p) => p.filter((_, j) => j !== i))} className="text-coc-faint hover:text-red-400 transition-colors"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-public"
                checked={createPublic}
                onChange={(e) => setCreatePublic(e.target.checked)}
                className="rounded border-coc-border"
              />
              <label htmlFor="create-public" className="text-xs text-coc-muted cursor-pointer">
                コミュニティに公開する
              </label>
            </div>

            {saveError && (
              <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {saveError}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !createTitle.trim()}
              className="rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2.5 disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {saving ? "保存中…" : "テンプレートを作成"}
            </button>
          </div>
        )}

        {/* Template list */}
        {loading ? (
          <p className="text-sm text-coc-muted text-center py-8">読み込み中…</p>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
            <BookMarked size={32} className="mx-auto mb-3 text-coc-faint" />
            <p className="text-sm text-coc-muted">テンプレートがまだありません</p>
            <p className="text-xs text-coc-faint mt-1">
              シナリオ詳細ページの「テンプレートとして保存」ボタンか、上のフォームから作成できます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              マイテンプレート ({templates.length}件)
            </h2>
            {templates.map((t) => {
              const td = t.template_data as ScenarioTemplateData;
              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-cinzel font-semibold text-coc-text text-sm">{t.title}</p>
                        {t.is_public ? (
                          <span className="flex items-center gap-0.5 text-xs text-coc-gold">
                            <Globe size={11} />公開
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-xs text-coc-faint">
                            <Lock size={11} />非公開
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-coc-muted mb-2">{t.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-coc-faint">
                        {td.scenes.length > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            シーン {td.scenes.length}
                          </span>
                        )}
                        {td.npc_slots.length > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            NPC枠 {td.npc_slots.length}
                          </span>
                        )}
                        {td.handout_count > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            ハンドアウト {td.handout_count}枚
                          </span>
                        )}
                        {td.creature_slots.length > 0 && (
                          <span className="rounded-full border border-coc-border px-2 py-0.5">
                            クリーチャー枠 {td.creature_slots.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCreateScenario(t)}
                        disabled={creatingFrom === t.id}
                        className="rounded-lg border border-coc-gold-dim bg-coc-gold/10 px-3 py-1.5 text-xs font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
                      >
                        {creatingFrom === t.id ? "作成中…" : "このテンプレートでシナリオ作成"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="text-coc-faint hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
