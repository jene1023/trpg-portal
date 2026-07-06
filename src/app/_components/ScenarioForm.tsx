"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured, ScenarioStatus, ScenarioDifficulty, ScenarioPlaytimeType } from "@/lib/supabase";

export default function ScenarioForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    synopsis: "",
    gm_notes: "",
    status: "planning" as ScenarioStatus,
    played_at: "",
    next_session_at: "",
    vtt_type: "",
    vtt_url: "",
    discord_webhook_url: "",
    difficulty: "" as ScenarioDifficulty | "",
    playtime_type: "" as ScenarioPlaytimeType | "",
    min_players: "",
    max_players: "",
    content_tags: "",
    remind_enabled: false,
    remind_email: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("タイトルは必須です。");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase が設定されていません。");
      return;
    }
    setSaving(true);
    setError(null);
    const rawTags = form.content_tags.trim();
    const contentTagsArray = rawTags
      ? rawTags.split(/[,、]/).map((t) => t.trim()).filter(Boolean)
      : null;

    const { error: err } = await supabase.from("scenarios").insert({
      title: form.title.trim(),
      synopsis: form.synopsis.trim() || null,
      gm_notes: form.gm_notes.trim() || null,
      status: form.status,
      played_at: form.played_at || null,
      next_session_at: form.next_session_at
        ? new Date(form.next_session_at).toISOString()
        : null,
      vtt_type: form.vtt_type || null,
      vtt_url: form.vtt_url.trim() || null,
      discord_webhook_url: form.discord_webhook_url.trim() || null,
      difficulty: form.difficulty || null,
      playtime_type: form.playtime_type || null,
      min_players: form.min_players ? parseInt(form.min_players) : null,
      max_players: form.max_players ? parseInt(form.max_players) : null,
      content_tags: contentTagsArray,
      remind_enabled: form.remind_enabled,
      remind_email: form.remind_email.trim() || null,
    });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    router.push("/scenarios");
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
  const labelClass = "block text-xs font-medium text-coc-muted mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className={labelClass}>
          タイトル <span className="text-coc-gold">*</span>
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="例: インスマスを覆う影"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          進行状態
        </label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className={fieldClass}
        >
          <option value="planning">準備中</option>
          <option value="ongoing">進行中</option>
          <option value="completed">完了</option>
        </select>
      </div>

      <div>
        <label htmlFor="played_at" className={labelClass}>
          プレイ日
        </label>
        <input
          id="played_at"
          name="played_at"
          type="date"
          value={form.played_at}
          onChange={handleChange}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="next_session_at" className={labelClass}>
          次回セッション予定日時
        </label>
        <input
          id="next_session_at"
          name="next_session_at"
          type="datetime-local"
          value={form.next_session_at}
          onChange={handleChange}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="vtt_type" className={labelClass}>
          VTT / 通話ツール
        </label>
        <select
          id="vtt_type"
          name="vtt_type"
          value={form.vtt_type}
          onChange={handleChange}
          className={fieldClass}
        >
          <option value="">-- 選択してください --</option>
          <option value="ユドナリウム">ユドナリウム</option>
          <option value="ここフォリア">ここフォリア</option>
          <option value="Roll20">Roll20</option>
          <option value="Discord">Discord</option>
          <option value="Zoom">Zoom</option>
          <option value="その他">その他</option>
        </select>
      </div>

      <div>
        <label htmlFor="vtt_url" className={labelClass}>
          卓URL
        </label>
        <input
          id="vtt_url"
          name="vtt_url"
          type="url"
          value={form.vtt_url}
          onChange={handleChange}
          placeholder="https://example.com/room/..."
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="discord_webhook_url" className={labelClass}>
          Discord Webhook URL（通知連携）
        </label>
        <input
          id="discord_webhook_url"
          name="discord_webhook_url"
          type="url"
          value={form.discord_webhook_url}
          onChange={handleChange}
          placeholder="https://discord.com/api/webhooks/..."
          className={fieldClass}
        />
        <p className="text-xs text-coc-faint mt-1">
          設定するとSANチェック・セッションログ追加時にDiscordへ自動通知されます
        </p>
      </div>

      <div className="rounded-lg border border-coc-border bg-coc-raised px-4 py-4 flex flex-col gap-3">
        <p className="text-xs font-medium text-coc-muted uppercase tracking-wider">前日リマインドメール（任意）</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="remind_enabled"
            checked={form.remind_enabled}
            onChange={handleChange}
            className="rounded border-coc-border accent-coc-gold"
          />
          <span className="text-sm text-coc-text">前日リマインドを有効にする</span>
        </label>
        {form.remind_enabled && (
          <div>
            <label htmlFor="remind_email" className={labelClass}>
              リマインド先メールアドレス
            </label>
            <input
              id="remind_email"
              name="remind_email"
              type="email"
              value={form.remind_email}
              onChange={handleChange}
              placeholder="kp@example.com"
              className={fieldClass}
            />
            <p className="text-xs text-coc-faint mt-1">
              次回セッション予定の前日 JST 9:00 に自動メールが送信されます
            </p>
          </div>
        )}
      </div>

      {/* メタ情報セクション */}
      <div className="rounded-lg border border-coc-border bg-coc-raised px-4 py-4 flex flex-col gap-4">
        <p className="text-xs font-medium text-coc-muted uppercase tracking-wider">メタ情報（任意）</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="difficulty" className={labelClass}>
              難易度
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="">-- 未設定 --</option>
              <option value="beginner">初心者向け</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
          </div>

          <div>
            <label htmlFor="playtime_type" className={labelClass}>
              推定プレイ時間
            </label>
            <select
              id="playtime_type"
              name="playtime_type"
              value={form.playtime_type}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="">-- 未設定 --</option>
              <option value="short">短編（〜3時間）</option>
              <option value="medium">中編（3〜6時間）</option>
              <option value="long">長編（6時間〜）</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="min_players" className={labelClass}>
              推奨人数（最小）
            </label>
            <input
              id="min_players"
              name="min_players"
              type="number"
              min="1"
              max="10"
              value={form.min_players}
              onChange={handleChange}
              placeholder="例: 2"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="max_players" className={labelClass}>
              推奨人数（最大）
            </label>
            <input
              id="max_players"
              name="max_players"
              type="number"
              min="1"
              max="10"
              value={form.max_players}
              onChange={handleChange}
              placeholder="例: 4"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="content_tags" className={labelClass}>
            コンテンツ警告タグ（カンマ区切り）
          </label>
          <input
            id="content_tags"
            name="content_tags"
            value={form.content_tags}
            onChange={handleChange}
            placeholder="例: ホラー, 流血, 精神的描写"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="synopsis" className={labelClass}>
          概要
        </label>
        <textarea
          id="synopsis"
          name="synopsis"
          value={form.synopsis}
          onChange={handleChange}
          placeholder="シナリオの概要・あらすじ"
          rows={4}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="gm_notes" className={labelClass}>
          GMメモ
        </label>
        <textarea
          id="gm_notes"
          name="gm_notes"
          value={form.gm_notes}
          onChange={handleChange}
          placeholder="KP用の秘密メモ・攻略ヒント・注意事項など"
          rows={5}
          className={fieldClass}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push("/scenarios")}
          className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-muted transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
        >
          {saving ? "登録中..." : "シナリオを登録"}
        </button>
      </div>
    </form>
  );
}
