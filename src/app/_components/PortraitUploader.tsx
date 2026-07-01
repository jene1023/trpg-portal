"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  characterId: string;
  portraitUrl: string | null;
  characterName: string;
};

export default function PortraitUploader({
  characterId,
  portraitUrl,
  characterName,
}: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(portraitUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("画像は5MB以下にしてください");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase が設定されていません");
      return;
    }
    setError("");
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${characterId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("portraits")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("portraits")
        .getPublicUrl(path);

      const { error: updateErr } = await supabase
        .from("characters")
        .update({ portrait_url: urlData.publicUrl })
        .eq("id", characterId);
      if (updateErr) throw updateErr;

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      setPreviewUrl(portraitUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="absolute inset-0">
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt={characterName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-coc-surface text-coc-muted">
          <span className="font-cinzel text-4xl select-none opacity-40">
            {characterName.charAt(0)}
          </span>
        </div>
      )}

      {/* ホバー時のアップロードオーバーレイ */}
      <label className="absolute inset-0 flex items-end justify-center pb-3 cursor-pointer group">
        <div
          className={`flex items-center gap-1.5 rounded-md border border-coc-border bg-black/70 px-2.5 py-1.5 text-xs text-white transition-opacity ${
            uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              アップロード中…
            </>
          ) : (
            <>
              <Upload size={12} />
              画像をアップロード
            </>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {error && (
        <div className="absolute top-2 left-0 right-0 mx-2 rounded border border-red-800 bg-red-950/90 p-1.5 text-center text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
