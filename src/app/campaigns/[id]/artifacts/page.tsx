"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  Sword,
  Gem,
  Key,
  HelpCircle,
  User,
  Flame,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  CampaignArtifact,
  ArtifactType,
  ArtifactRarity,
} from "@/lib/supabase";

const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  tome: "魔術書",
  weapon: "武器",
  relic: "遺物",
  key_item: "重要アイテム",
  other: "その他",
};

const RARITY_LABELS: Record<ArtifactRarity, string> = {
  common: "コモン",
  rare: "レア",
  legendary: "レジェンダリー",
};

const RARITY_BORDER: Record<ArtifactRarity, string> = {
  common: "border-coc-border",
  rare: "border-blue-600",
  legendary: "border-coc-gold",
};

const RARITY_BADGE: Record<ArtifactRarity, string> = {
  common: "text-coc-muted border-coc-border",
  rare: "text-blue-400 border-blue-700",
  legendary: "text-coc-gold border-coc-gold-dim",
};

function ArtifactIcon({ type, size = 14 }: { type: ArtifactType; size?: number }) {
  const cls = "text-coc-muted";
  if (type === "tome") return <BookOpen size={size} className={cls} />;
  if (type === "weapon") return <Sword size={size} className={cls} />;
  if (type === "relic") return <Gem size={size} className={cls} />;
  if (type === "key_item") return <Key size={size} className={cls} />;
  return <HelpCircle size={size} className={cls} />;
}

type ArtifactWithHolder = CampaignArtifact & {
  characters: { name: string } | null;
};

type Props = { params: Promise<{ id: string }> };

export default function CampaignArtifactsPage({ params }: Props) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [artifacts, setArtifacts] = useState<ArtifactWithHolder[]>([]);
  const [scenarios, setScenarios] = useState<{ id: string; title: string }[]>([]);
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [transferValue, setTransferValue] = useState<string>("");

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<ArtifactType>("other");
  const [newRarity, setNewRarity] = useState<ArtifactRarity>("common");
  const [newScenarioId, setNewScenarioId] = useState("");
  const [newDiscoveredAt, setNewDiscoveredAt] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newHolderId, setNewHolderId] = useState("");

  useEffect(() => {
    params.then(({ id }) => setCampaignId(id));
  }, [params]);

  const load = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const [{ data: campaign }, { data: arts }, { data: links }] = await Promise.all([
      supabase.from("campaigns").select("title").eq("id", id).single(),
      supabase
        .from("campaign_artifacts")
        .select("*, characters(name)")
        .eq("campaign_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("campaign_scenarios")
        .select("scenario_id, scenarios(id, title)")
        .eq("campaign_id", id)
        .order("order_index", { ascending: true }),
    ]);

    if (campaign) setCampaignTitle((campaign as { title: string }).title);
    if (arts) setArtifacts(arts as ArtifactWithHolder[]);

    if (links) {
      const scenarioList = links
        .filter((l) => l.scenarios)
        .map((l) => l.scenarios as unknown as { id: string; title: string });
      setScenarios(scenarioList);

      const scenarioIds = scenarioList.map((s) => s.id);
      if (scenarioIds.length > 0) {
        const { data: participants } = await supabase
          .from("scenario_participants")
          .select("character_id, characters(id, name)")
          .in("scenario_id", scenarioIds);
        if (participants) {
          const seen = new Set<string>();
          const chars: { id: string; name: string }[] = [];
          for (const p of participants) {
            const c = p.characters as unknown as { id: string; name: string } | null;
            if (c && !seen.has(c.id)) {
              seen.add(c.id);
              chars.push(c);
            }
          }
          setCharacters(chars);
        }
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId) load(campaignId);
  }, [campaignId, load]);

  async function handleAdd() {
    if (!newName.trim() || !isSupabaseConfigured || !campaignId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("campaign_artifacts")
      .insert({
        campaign_id: campaignId,
        scenario_id: newScenarioId || null,
        name: newName.trim(),
        description: newDescription.trim() || null,
        artifact_type: newType,
        rarity: newRarity,
        current_holder_character_id: newHolderId || null,
        is_destroyed: false,
        discovered_at: newDiscoveredAt.trim() || null,
        notes: newNotes.trim() || null,
      })
      .select("*, characters(name)")
      .single();
    if (!error && data) {
      setArtifacts((prev) => [...prev, data as ArtifactWithHolder]);
      setNewName("");
      setNewDescription("");
      setNewType("other");
      setNewRarity("common");
      setNewScenarioId("");
      setNewDiscoveredAt("");
      setNewNotes("");
      setNewHolderId("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("campaign_artifacts").delete().eq("id", id);
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleToggleDestroyed(artifact: ArtifactWithHolder) {
    if (!isSupabaseConfigured) return;
    const next = !artifact.is_destroyed;
    await supabase.from("campaign_artifacts").update({ is_destroyed: next }).eq("id", artifact.id);
    setArtifacts((prev) =>
      prev.map((a) => (a.id === artifact.id ? { ...a, is_destroyed: next } : a))
    );
  }

  async function handleTransfer(artifact: ArtifactWithHolder, characterId: string) {
    if (!isSupabaseConfigured) return;
    const newHolder = characterId || null;
    const { data } = await supabase
      .from("campaign_artifacts")
      .update({ current_holder_character_id: newHolder })
      .eq("id", artifact.id)
      .select("*, characters(name)")
      .single();
    if (data) {
      setArtifacts((prev) =>
        prev.map((a) => (a.id === artifact.id ? (data as ArtifactWithHolder) : a))
      );
    }
    setTransferringId(null);
    setTransferValue("");
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
        読み込んでいます...
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/campaigns/${campaignId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          {campaignTitle || "キャンペーン詳細"}
        </Link>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">アーティファクト</h1>
        <p className="text-sm text-coc-muted">キャンペーンを通して入手した重要アイテム・遺物の記録</p>
      </div>

      {/* 凡例 */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(Object.keys(RARITY_LABELS) as ArtifactRarity[]).map((r) => (
          <span
            key={r}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${RARITY_BADGE[r]}`}
          >
            {RARITY_LABELS[r]}
          </span>
        ))}
      </div>

      {/* カードグリッド */}
      {artifacts.length === 0 && !adding ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center text-coc-muted text-sm mb-6">
          まだアーティファクトが記録されていません
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-6">
          {artifacts.map((artifact) => (
            <div
              key={artifact.id}
              className={`rounded-xl border-2 bg-coc-surface px-5 py-4 ${RARITY_BORDER[artifact.rarity]} ${
                artifact.is_destroyed ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <ArtifactIcon type={artifact.artifact_type} size={14} />
                    <span
                      className={`text-xs font-medium rounded-full border px-2 py-0.5 ${RARITY_BADGE[artifact.rarity]}`}
                    >
                      {RARITY_LABELS[artifact.rarity]}
                    </span>
                    <span className="text-xs text-coc-muted">
                      {ARTIFACT_TYPE_LABELS[artifact.artifact_type]}
                    </span>
                    {artifact.discovered_at && (
                      <span className="text-xs text-coc-muted">{artifact.discovered_at}</span>
                    )}
                  </div>

                  <h3
                    className={`font-medium text-coc-text text-base ${
                      artifact.is_destroyed ? "line-through decoration-red-500 decoration-2" : ""
                    }`}
                  >
                    {artifact.name}
                    {artifact.is_destroyed && (
                      <span className="ml-2 text-xs text-red-400 no-underline">[消滅]</span>
                    )}
                  </h3>

                  {artifact.description && (
                    <p className="mt-1 text-sm text-coc-muted whitespace-pre-wrap">
                      {artifact.description}
                    </p>
                  )}

                  {artifact.notes && (
                    <p className="mt-1 text-xs text-coc-muted italic whitespace-pre-wrap">
                      {artifact.notes}
                    </p>
                  )}

                  {/* 所持者 */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <User size={13} className="text-coc-muted shrink-0" />
                    {transferringId === artifact.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={transferValue}
                          onChange={(e) => setTransferValue(e.target.value)}
                          className="rounded-lg border border-coc-border bg-coc-bg px-2 py-1 text-xs text-coc-text focus:border-coc-gold focus:outline-none"
                        >
                          <option value="">（なし）</option>
                          {characters.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleTransfer(artifact, transferValue)}
                          className="text-xs rounded px-2 py-1 bg-coc-gold text-black hover:opacity-90 transition-opacity"
                        >
                          移譲
                        </button>
                        <button
                          onClick={() => { setTransferringId(null); setTransferValue(""); }}
                          className="text-xs text-coc-muted hover:text-coc-text transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTransferringId(artifact.id);
                          setTransferValue(artifact.current_holder_character_id ?? "");
                        }}
                        className="text-xs text-coc-muted hover:text-coc-gold transition-colors"
                      >
                        {artifact.characters
                          ? `所持者: ${artifact.characters.name}`
                          : "所持者なし"}
                        　（変更）
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleDestroyed(artifact)}
                    title={artifact.is_destroyed ? "復元" : "消滅済みにする"}
                    className="p-1.5 rounded hover:bg-coc-raised text-coc-muted hover:text-red-400 transition-colors"
                  >
                    <Flame size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(artifact.id)}
                    title="削除"
                    className="p-1.5 rounded hover:bg-coc-raised text-coc-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 追加フォーム */}
      <div>
        {adding ? (
          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
            <input
              type="text"
              placeholder="アーティファクト名（例: ネクロノミコン）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ArtifactType)}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
              >
                {(Object.keys(ARTIFACT_TYPE_LABELS) as ArtifactType[]).map((t) => (
                  <option key={t} value={t}>{ARTIFACT_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <select
                value={newRarity}
                onChange={(e) => setNewRarity(e.target.value as ArtifactRarity)}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
              >
                {(Object.keys(RARITY_LABELS) as ArtifactRarity[]).map((r) => (
                  <option key={r} value={r}>{RARITY_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="説明（任意）"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              {scenarios.length > 0 && (
                <select
                  value={newScenarioId}
                  onChange={(e) => setNewScenarioId(e.target.value)}
                  className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
                >
                  <option value="">発見シナリオ（任意）</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                placeholder="発見日時（例: 1920年3月）"
                value={newDiscoveredAt}
                onChange={(e) => setNewDiscoveredAt(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              />
            </div>
            {characters.length > 0 && (
              <select
                value={newHolderId}
                onChange={(e) => setNewHolderId(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
              >
                <option value="">現在の所持者（任意）</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <textarea
              placeholder="KPメモ・追記（任意）"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || saving}
                className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? "保存中..." : "追加"}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewName("");
                  setNewDescription("");
                  setNewType("other");
                  setNewRarity("common");
                  setNewScenarioId("");
                  setNewDiscoveredAt("");
                  setNewNotes("");
                  setNewHolderId("");
                }}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
          >
            <Plus size={16} />
            アーティファクトを追加
          </button>
        )}
      </div>
    </div>
  );
}
