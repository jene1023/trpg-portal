"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, Material } from "@/lib/supabase";
import { Image, Link2, Music, Map, Plus, Trash2, ExternalLink } from "lucide-react";

type MaterialType = Material["type"];

const TYPE_LABELS: Record<MaterialType, string> = {
  portrait: "ポートレート",
  background: "背景・マップ",
  other: "その他（BGM・リンク等）",
};

const TYPE_ICONS = {
  portrait: <Image size={14} className="text-coc-gold" />,
  background: <Map size={14} className="text-coc-gold" />,
  other: <Music size={14} className="text-coc-gold" />,
} as const;

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".avif")
  );
}

type Props = {
  scenarioId: string;
  initialMaterials: Material[];
};

export default function ScenarioMaterialList({ scenarioId, initialMaterials }: Props) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [name, setName] = useState("");
  const [type, setType] = useState<MaterialType>("other");
  const [storageUrl, setStorageUrl] = useState("");
  const [extraTags, setExtraTags] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<MaterialType | "all">("all");

  async function addMaterial() {
    if (!name.trim() || !storageUrl.trim() || !isSupabaseConfigured) return;
    setAdding(true);
    const additionalTags = extraTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tags = [scenarioId, ...additionalTags];
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name: name.trim(),
        type,
        storage_url: storageUrl.trim(),
        tags,
      })
      .select()
      .single();
    if (!error && data) {
      setMaterials((prev) => [...prev, data as Material]);
      setName("");
      setType("other");
      setStorageUrl("");
      setExtraTags("");
      setShowForm(false);
    }
    setAdding(false);
  }

  async function deleteMaterial(id: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (!error) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  }

  const filtered =
    filterType === "all" ? materials : materials.filter((m) => m.type === filterType);

  const typeGroups: Record<MaterialType, number> = {
    portrait: materials.filter((m) => m.type === "portrait").length,
    background: materials.filter((m) => m.type === "background").length,
    other: materials.filter((m) => m.type === "other").length,
  };

  return (
    <div>
      {materials.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
              filterType === "all"
                ? "border-coc-gold bg-coc-gold/20 text-coc-gold"
                : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-text"
            }`}
          >
            すべて ({materials.length})
          </button>
          {(["portrait", "background", "other"] as MaterialType[]).map((t) =>
            typeGroups[t] > 0 ? (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  filterType === t
                    ? "border-coc-gold bg-coc-gold/20 text-coc-gold"
                    : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-text"
                }`}
              >
                {TYPE_LABELS[t]} ({typeGroups[t]})
              </button>
            ) : null
          )}
        </div>
      )}

      <ul className="space-y-3 mb-4">
        {filtered.map((material) => {
          const showImage =
            (material.type === "portrait" || material.type === "background") &&
            isImageUrl(material.storage_url);
          return (
            <li
              key={material.id}
              className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden"
            >
              {showImage && (
                <div className="w-full h-40 bg-coc-bg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={material.storage_url}
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {TYPE_ICONS[material.type]}
                      <span className="font-semibold text-sm text-coc-text">
                        {material.name}
                      </span>
                      <span className="rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                        {TYPE_LABELS[material.type]}
                      </span>
                    </div>
                    {showImage ? (
                      <a
                        href={material.storage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-coc-gold hover:underline mt-1"
                      >
                        <ExternalLink size={11} />
                        画像を開く
                      </a>
                    ) : (
                      <a
                        href={material.storage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-coc-gold hover:underline mt-1 truncate max-w-full"
                      >
                        <Link2 size={11} />
                        <span className="truncate">{material.storage_url}</span>
                      </a>
                    )}
                    {material.tags.filter((t) => t !== scenarioId).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {material.tags
                          .filter((t) => t !== scenarioId)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-coc-border px-1.5 py-0.5 text-xs text-coc-muted"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMaterial(material.id)}
                    className="text-coc-muted hover:text-red-400 transition-colors flex-shrink-0"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="text-sm text-coc-muted py-2">
            {filterType === "all"
              ? "素材がまだ登録されていません"
              : `${TYPE_LABELS[filterType]}の素材がありません`}
          </li>
        )}
      </ul>

      {showForm ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-4 py-4 space-y-3">
          <h3 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            素材を追加
          </h3>
          <div>
            <label className="block text-xs text-coc-muted mb-1">名前 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: オープニングBGM、地下室マップ"
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">種別 *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MaterialType)}
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            >
              <option value="other">その他（BGM・リンク等）</option>
              <option value="portrait">ポートレート</option>
              <option value="background">背景・マップ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">URL *</label>
            <input
              type="url"
              value={storageUrl}
              onChange={(e) => setStorageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
            />
            <p className="text-xs text-coc-muted mt-1">
              画像URL（.jpg/.png等）はプレビュー表示されます
            </p>
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">
              追加タグ（カンマ区切り、省略可）
            </label>
            <input
              type="text"
              value={extraTags}
              onChange={(e) => setExtraTags(e.target.value)}
              placeholder="例: 序盤, 地下室, ボスBGM"
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addMaterial}
              disabled={!name.trim() || !storageUrl.trim() || adding}
              className="flex-1 rounded-lg bg-coc-gold/20 border border-coc-gold px-4 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-40"
            >
              {adding ? "追加中..." : "追加"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setName("");
                setType("other");
                setStorageUrl("");
                setExtraTags("");
              }}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-text transition-colors w-full"
        >
          <Plus size={16} />
          素材を追加
        </button>
      )}
    </div>
  );
}
