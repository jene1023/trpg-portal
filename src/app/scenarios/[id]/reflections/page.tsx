"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionReflection, ReflectionRole, SessionLog } from "@/lib/supabase";

type SessionOption = Pick<SessionLog, "id" | "session_number" | "title" | "character_id"> & {
  character_name: string;
};

const ROLE_LABELS: Record<ReflectionRole, string> = {
  kp: "KP",
  pl: "PL",
  other: "その他",
};

const ROLE_COLORS: Record<ReflectionRole, string> = {
  kp: "text-coc-gold bg-coc-gold/10 border-coc-gold-dim",
  pl: "text-blue-400 bg-blue-400/10 border-blue-800",
  other: "text-coc-muted bg-coc-raised border-coc-border",
};

export default function ReflectionsPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [reflections, setReflections] = useState<SessionReflection[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [authorName, setAuthorName] = useState("");
  const [role, setRole] = useState<ReflectionRole>("pl");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function load() {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("title")
        .eq("id", scenarioId)
        .single();
      setScenarioTitle(scenario?.title ?? "");

      const { data: participants } = await supabase
        .from("scenario_participants")
        .select("character_id, characters(id, name)")
        .eq("scenario_id", scenarioId);

      const characterMap: Record<string, string> = {};
      const characterIds: string[] = [];
      for (const p of participants ?? []) {
        const char = p.characters as { id: string; name: string } | null;
        if (char) {
          characterMap[char.id] = char.name;
          characterIds.push(char.id);
        }
      }

      if (characterIds.length > 0) {
        const { data: sessionRows } = await supabase
          .from("sessions")
          .select("id, session_number, title, character_id")
          .in("character_id", characterIds)
          .order("session_number", { ascending: true });

        const sessionOptions: SessionOption[] = (sessionRows ?? []).map((s) => ({
          ...s,
          character_name: characterMap[s.character_id] ?? "",
        }));
        setSessions(sessionOptions);

        const sessionIds = sessionRows?.map((s) => s.id) ?? [];
        if (sessionIds.length > 0) {
          const { data: rows } = await supabase
            .from("session_reflections")
            .select("*")
            .in("session_id", sessionIds)
            .order("created_at", { ascending: false });
          setReflections((rows ?? []) as SessionReflection[]);
        }
      }

      setLoading(false);
    }

    load();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !content.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("session_reflections")
      .insert({
        session_id: selectedSessionId || null,
        author_name: authorName.trim() || null,
        role,
        content: content.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setReflections((prev) => [data as SessionReflection, ...prev]);
      setContent("");
      setAuthorName("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("session_reflections").delete().eq("id", id);
    setReflections((prev) => prev.filter((r) => r.id !== id));
  }

  function getSessionLabel(sessionId: string | null) {
    if (!sessionId) return null;
    const s = sessions.find((s) => s.id === sessionId);
    if (!s) return null;
    return `Session ${s.session_number}: ${s.title}（${s.character_name}）`;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        {scenarioTitle && (
          <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        )}
        <h1 className="font-cinzel text-xl font-bold text-coc-text">合同振り返り</h1>
        <p className="text-xs text-coc-muted mt-1">
          KP・PL双方がセッションの感想・印象に残った場面・改善提案を自由に投稿できます
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-3 mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-coc-muted mb-1">対象セッション（省略可）</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
            >
              <option value="">指定なし</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.session_number}: {s.title}（{s.character_name}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">役割</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ReflectionRole)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
            >
              <option value="pl">PL</option>
              <option value="kp">KP</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-coc-muted mb-1">投稿者名（省略可）</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
            placeholder="例: 田中"
          />
        </div>

        <div>
          <label className="block text-xs text-coc-muted mb-1">振り返り内容 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            required
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
            placeholder="印象に残った場面・良かった演出・次回への期待・改善提案など"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-coc-gold px-4 py-2 text-sm font-semibold text-coc-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          {saving ? "投稿中..." : "振り返りを投稿"}
        </button>
      </form>

      {loading ? (
        <p className="text-center text-coc-muted text-sm py-8">読み込み中...</p>
      ) : reflections.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          振り返りはまだありません
        </p>
      ) : (
        <div className="space-y-3">
          {reflections.map((r) => {
            const sessionLabel = getSessionLabel(r.session_id);
            return (
              <div
                key={r.id}
                className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[r.role as ReflectionRole]}`}
                    >
                      {ROLE_LABELS[r.role as ReflectionRole]}
                    </span>
                    {r.author_name && (
                      <span className="text-sm font-medium text-coc-text">{r.author_name}</span>
                    )}
                    <span className="text-xs text-coc-muted">
                      {new Date(r.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-coc-faint hover:text-red-400 transition-colors shrink-0"
                    title="削除"
                  >
                    <X size={15} />
                  </button>
                </div>
                {sessionLabel && (
                  <p className="text-xs text-coc-muted">{sessionLabel}</p>
                )}
                <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-border pl-3">
                  {r.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
