"use client";

import { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured, CharacterMythosEncounter, MythosEntityType } from "@/lib/supabase";

const ENTITY_TYPE_OPTIONS: { value: MythosEntityType; label: string }[] = [
  { value: "creature", label: "クリーチャー" },
  { value: "deity", label: "神格" },
  { value: "artifact", label: "遺物・アーティファクト" },
  { value: "spell", label: "呪文・魔術" },
  { value: "other", label: "その他" },
];

function entityTypeLabel(type: MythosEntityType) {
  return ENTITY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function entityTypeBadgeClass(type: MythosEntityType) {
  switch (type) {
    case "creature": return "border-green-800/60 bg-green-950/20 text-green-300";
    case "deity": return "border-purple-800/60 bg-purple-950/20 text-purple-300";
    case "artifact": return "border-yellow-800/60 bg-yellow-950/20 text-yellow-300";
    case "spell": return "border-blue-800/60 bg-blue-950/20 text-blue-300";
    default: return "border-coc-border bg-coc-raised text-coc-muted";
  }
}

type EntitySummary = {
  entity_name: string;
  entity_type: MythosEntityType;
  total_san_lost: number;
  encounter_count: number;
  encounters: CharacterMythosEncounter[];
};

type Props = {
  characterId: string;
  initialEncounters: CharacterMythosEncounter[];
  creatures: { id: string; name: string }[];
};

export default function MythosClient({ characterId, initialEncounters, creatures }: Props) {
  const [encounters, setEncounters] = useState<CharacterMythosEncounter[]>(initialEncounters);
  const [saving, setSaving] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  const [entityName, setEntityName] = useState("");
  const [useCreatureRef, setUseCreatureRef] = useState(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState("");
  const [entityType, setEntityType] = useState<MythosEntityType>("creature");
  const [sessionLabel, setSessionLabel] = useState("");
  const [sanLost, setSanLost] = useState(0);
  const [notes, setNotes] = useState("");
  const [encounteredAt, setEncounteredAt] = useState("");

  const addEncounter = useCallback(async () => {
    const name = useCreatureRef
      ? (creatures.find((c) => c.id === selectedCreatureId)?.name ?? "").trim()
      : entityName.trim();
    if (!name || !isSupabaseConfigured) return;
    setSaving(true);
    const { data } = await supabase
      .from("character_mythos_encounters")
      .insert({
        character_id: characterId,
        entity_name: name,
        entity_type: entityType,
        session_label: sessionLabel.trim() || null,
        san_lost: sanLost,
        notes: notes.trim() || null,
        encountered_at: encounteredAt || null,
      })
      .select()
      .single();
    if (data) setEncounters((prev) => [data, ...prev]);
    setEntityName("");
    setSelectedCreatureId("");
    setSessionLabel("");
    setSanLost(0);
    setNotes("");
    setEncounteredAt("");
    setSaving(false);
  }, [characterId, useCreatureRef, creatures, selectedCreatureId, entityName, entityType, sessionLabel, sanLost, notes, encounteredAt]);

  const removeEncounter = useCallback(async (encId: string) => {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("character_mythos_encounters").delete().eq("id", encId);
    setEncounters((prev) => prev.filter((e) => e.id !== encId));
    setSaving(false);
  }, []);

  const entitySummaries: EntitySummary[] = encounters.reduce<EntitySummary[]>((acc, enc) => {
    const existing = acc.find((s) => s.entity_name === enc.entity_name);
    if (existing) {
      existing.total_san_lost += enc.san_lost;
      existing.encounter_count += 1;
      existing.encounters.push(enc);
    } else {
      acc.push({
        entity_name: enc.entity_name,
        entity_type: enc.entity_type,
        total_san_lost: enc.san_lost,
        encounter_count: 1,
        encounters: [enc],
      });
    }
    return acc;
  }, []);

  const totalSanLost = encounters.reduce((sum, e) => sum + e.san_lost, 0);

  return (
    <div className="space-y-6">
      {encounters.length > 0 && (
        <div className="rounded-lg border border-purple-800/50 bg-purple-950/10 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-coc-muted">
            遭遇エンティティ数: <span className="text-coc-text font-semibold">{entitySummaries.length}</span>
            　総遭遇回数: <span className="text-coc-text font-semibold">{encounters.length}</span>
          </div>
          <div className="text-sm">
            累計SAN喪失:
            <span className="ml-2 text-red-400 font-bold tabular-nums text-base">−{totalSanLost}</span>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
          遭遇エンティティ
          {entitySummaries.length > 0 && (
            <span className="ml-2 rounded bg-purple-900/40 border border-purple-700/60 px-1.5 py-0.5 text-xs text-purple-300 normal-case font-normal">
              {entitySummaries.length}体
            </span>
          )}
        </h2>
        {entitySummaries.length === 0 ? (
          <p className="text-sm text-coc-muted">遭遇記録なし</p>
        ) : (
          <div className="space-y-2">
            {entitySummaries.map((summary) => (
              <div key={summary.entity_name} className="rounded-lg border border-coc-border bg-coc-raised overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-coc-surface/50 transition-colors"
                  onClick={() =>
                    setExpandedEntity(expandedEntity === summary.entity_name ? null : summary.entity_name)
                  }
                >
                  <div className="flex items-center gap-2 text-left min-w-0">
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-semibold ${entityTypeBadgeClass(summary.entity_type)}`}>
                      {entityTypeLabel(summary.entity_type)}
                    </span>
                    <span className="text-sm font-semibold text-coc-text truncate">{summary.entity_name}</span>
                    <span className="text-xs text-coc-muted shrink-0">{summary.encounter_count}回</span>
                  </div>
                  <div className="flex items-center gap-3 ml-2 shrink-0">
                    <span className="text-sm text-red-400 font-bold tabular-nums">−{summary.total_san_lost}</span>
                    <span className="text-coc-muted text-xs">
                      {expandedEntity === summary.entity_name ? "▲" : "▼"}
                    </span>
                  </div>
                </button>
                {expandedEntity === summary.entity_name && (
                  <div className="border-t border-coc-border px-3 pb-3 space-y-2 pt-2">
                    {summary.encounters.map((enc) => (
                      <div
                        key={enc.id}
                        className="flex items-start justify-between rounded border border-coc-border bg-coc-void/40 px-3 py-2"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          {enc.session_label && (
                            <p className="text-xs text-coc-muted">セッション: {enc.session_label}</p>
                          )}
                          {enc.encountered_at && (
                            <p className="text-xs text-coc-muted">
                              {new Date(enc.encountered_at).toLocaleDateString("ja-JP")}
                            </p>
                          )}
                          {enc.notes && (
                            <p className="text-xs text-coc-text/80 break-words leading-relaxed">{enc.notes}</p>
                          )}
                          <p className="text-xs">
                            SAN喪失: <span className="text-red-400 font-semibold">−{enc.san_lost}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeEncounter(enc.id)}
                          disabled={saving}
                          className="ml-3 shrink-0 rounded border border-coc-border px-2 py-1 text-xs text-coc-muted hover:text-red-300 hover:border-red-800 transition-colors disabled:opacity-40"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-4">
        <h2 className="coc-section-title font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
          新規遭遇を記録
        </h2>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-coc-muted cursor-pointer">
              <input
                type="checkbox"
                checked={useCreatureRef}
                onChange={(e) => {
                  setUseCreatureRef(e.target.checked);
                  setEntityName("");
                  setSelectedCreatureId("");
                }}
                className="accent-coc-gold"
              />
              既存クリーチャーから選択
            </label>
          </div>
          {useCreatureRef ? (
            <select
              value={selectedCreatureId}
              onChange={(e) => setSelectedCreatureId(e.target.value)}
              className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-border-glow"
            >
              <option value="">クリーチャーを選択...</option>
              {creatures.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="エンティティ名（例: クトゥルフ、ハスター）..."
              className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-border-glow"
            />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-coc-muted">種別</label>
          <div className="flex flex-wrap gap-2">
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEntityType(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  entityType === opt.value
                    ? entityTypeBadgeClass(opt.value) + " ring-1 ring-inset ring-current/30"
                    : "border-coc-border bg-coc-raised text-coc-muted hover:border-coc-border-glow hover:text-coc-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-coc-muted">SAN喪失</label>
            <input
              type="number"
              min={0}
              value={sanLost}
              onChange={(e) => setSanLost(Math.max(0, Number(e.target.value)))}
              className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-border-glow"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-coc-muted">遭遇日</label>
            <input
              type="date"
              value={encounteredAt}
              onChange={(e) => setEncounteredAt(e.target.value)}
              className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-border-glow"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-coc-muted">セッション名（任意）</label>
          <input
            type="text"
            value={sessionLabel}
            onChange={(e) => setSessionLabel(e.target.value)}
            placeholder="例: 深きものどもの呼び声 第2話..."
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-border-glow"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-coc-muted">メモ（任意）</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="遭遇の詳細・影響・気づきなど..."
            rows={2}
            className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-border-glow resize-none"
          />
        </div>

        <button
          onClick={addEncounter}
          disabled={saving || (useCreatureRef ? !selectedCreatureId : !entityName.trim())}
          className="rounded-lg border border-coc-gold/50 bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold/70 transition-colors disabled:opacity-50"
        >
          遭遇を記録
        </button>
      </section>
    </div>
  );
}
