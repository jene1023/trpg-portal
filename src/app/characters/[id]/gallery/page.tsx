"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Star, ChevronUp, ChevronDown } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  CharacterGalleryImage,
} from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export default function GalleryPage({ params }: Props) {
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [images, setImages] = useState<CharacterGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name").eq("id", id).single(),
        supabase
          .from("character_gallery_images")
          .select("*")
          .eq("character_id", id)
          .order("order_index", { ascending: true }),
      ]).then(([charRes, imagesRes]) => {
        if (charRes.data) setCharacterName(charRes.data.name);
        setImages(imagesRes.data ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  async function addImage() {
    if (!newUrl.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const nextIndex = images.length > 0 ? Math.max(...images.map((i) => i.order_index)) + 1 : 0;
    const { data } = await supabase
      .from("character_gallery_images")
      .insert({
        character_id: characterId,
        image_url: newUrl.trim(),
        caption: newCaption.trim() || null,
        is_main: false,
        order_index: nextIndex,
      })
      .select()
      .single();
    if (data) {
      setImages((prev) => [...prev, data]);
    }
    setNewUrl("");
    setNewCaption("");
    setAdding(false);
    setSaving(false);
  }

  async function deleteImage(img: CharacterGalleryImage) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_gallery_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  }

  async function setAsMain(img: CharacterGalleryImage) {
    if (!isSupabaseConfigured) return;
    // Reset all is_main flags
    await supabase
      .from("character_gallery_images")
      .update({ is_main: false })
      .eq("character_id", characterId);
    // Set selected image as main
    await supabase
      .from("character_gallery_images")
      .update({ is_main: true })
      .eq("id", img.id);
    // Update character portrait_url
    await supabase
      .from("characters")
      .update({ portrait_url: img.image_url })
      .eq("id", characterId);
    setImages((prev) =>
      prev.map((i) => ({ ...i, is_main: i.id === img.id }))
    );
  }

  async function moveImage(index: number, direction: -1 | 1) {
    if (!isSupabaseConfigured) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const current = images[index];
    const target = images[targetIndex];
    const newImages = [...images];
    newImages[index] = { ...target, order_index: current.order_index };
    newImages[targetIndex] = { ...current, order_index: target.order_index };
    setImages(newImages);
    await Promise.all([
      supabase
        .from("character_gallery_images")
        .update({ order_index: current.order_index })
        .eq("id", target.id),
      supabase
        .from("character_gallery_images")
        .update({ order_index: target.order_index })
        .eq("id", current.id),
    ]);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName || "キャラクター詳細"}
        </Link>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors motion-safe:active:scale-[0.97]"
        >
          <Plus size={14} />
          画像を追加
        </button>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">
        ポートレートギャラリー
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        複数の参考画像URLを登録・管理できます。「メインに設定」でポートレートを変更できます。
      </p>

      {adding && (
        <div className="mb-6 rounded-lg border border-coc-gold/40 bg-coc-gold/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-coc-gold">画像を追加</h2>
            <button
              onClick={() => { setAdding(false); setNewUrl(""); setNewCaption(""); }}
              className="text-coc-muted hover:text-coc-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="画像URL（https://...）*"
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60"
            onKeyDown={(e) => e.key === "Enter" && addImage()}
          />
          <input
            type="text"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="キャプション（任意）"
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60"
          />
          <button
            onClick={addImage}
            disabled={saving || !newUrl.trim()}
            className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "追加"}
          </button>
        </div>
      )}

      {images.length === 0 ? (
        <div className="rounded-lg border border-coc-border coc-card-bg p-8 text-center">
          <p className="text-coc-muted text-sm">画像がまだありません。</p>
          <p className="text-xs text-coc-muted mt-1">
            右上の「画像を追加」からURLを登録できます。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="group rounded-lg border border-coc-border coc-card-bg overflow-hidden"
            >
              <div className="relative aspect-[3/4] bg-coc-void">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.caption ?? "ギャラリー画像"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {img.is_main && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded border border-coc-gold/70 bg-coc-gold/20 px-1.5 py-0.5">
                    <Star size={10} className="text-coc-gold fill-coc-gold" />
                    <span className="text-xs text-coc-gold font-semibold">メイン</span>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-2">
                {img.caption && (
                  <p className="text-xs text-coc-muted leading-tight truncate">{img.caption}</p>
                )}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="rounded border border-coc-border p-1 text-coc-muted hover:text-coc-text hover:border-coc-border-glow disabled:opacity-30 transition-colors"
                      title="上へ"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      className="rounded border border-coc-border p-1 text-coc-muted hover:text-coc-text hover:border-coc-border-glow disabled:opacity-30 transition-colors"
                      title="下へ"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {!img.is_main && (
                      <button
                        onClick={() => setAsMain(img)}
                        className="rounded border border-coc-gold/40 px-1.5 py-0.5 text-xs text-coc-gold hover:bg-coc-gold/10 transition-colors"
                        title="メインに設定"
                      >
                        <Star size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteImage(img)}
                      className="rounded border border-coc-border px-1.5 py-0.5 text-xs text-coc-muted hover:text-red-400 hover:border-red-800 transition-colors"
                      title="削除"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
