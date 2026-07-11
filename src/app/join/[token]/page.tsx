"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Users } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ScenarioInfo = {
  id: string;
  title: string;
  synopsis: string | null;
};

type CharacterOption = {
  id: string;
  name: string;
  player_name: string | null;
  occupation: string | null;
};

export default function JoinByTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [scenario, setScenario] = useState<ScenarioInfo | null>(null);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    async function load() {
      const { data: scenarioRow } = await supabase
        .from("scenarios")
        .select("id, title, synopsis")
        .eq("recruit_token", token)
        .single();

      if (!scenarioRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setScenario(scenarioRow);

      const { data: charRows } = await supabase
        .from("characters")
        .select("id, name, player_name, occupation")
        .order("name", { ascending: true });

      setCharacters(charRows ?? []);
      setLoading(false);
    }

    load();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !scenario || !selectedCharacterId) return;

    setSaving(true);
    setError(null);

    // Check if already participating
    const { data: existing } = await supabase
      .from("scenario_participants")
      .select("id")
      .eq("scenario_id", scenario.id)
      .eq("character_id", selectedCharacterId)
      .single();

    if (existing) {
      setAlreadyJoined(true);
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("scenario_participants")
      .insert({
        scenario_id: scenario.id,
        character_id: selectedCharacterId,
        attendance_status: "unconfirmed",
      });

    if (insertError) {
      setError("参加申請に失敗しました。もう一度お試しください。");
      setSaving(false);
      return;
    }

    setSaving(false);
    setDone(true);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-coc-muted mb-2">招待リンクが見つかりません</p>
        <p className="text-xs text-coc-muted/60">URLが正しいか、KPに確認してください。</p>
        <Link href="/" className="mt-6 inline-block text-sm text-coc-gold hover:underline">
          トップへ戻る
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">参加申請を送りました！</h1>
        <p className="text-sm text-coc-muted mb-1">
          「{scenario?.title}」へのキャラクター参加申請が完了しました。
        </p>
        <p className="text-xs text-coc-muted/70 mb-8">
          KPが参加を確認次第、ステータスが更新されます。
        </p>
        <Link href="/" className="text-sm text-coc-gold hover:underline">
          トップへ戻る
        </Link>
      </div>
    );
  }

  if (alreadyJoined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <CheckCircle size={40} className="text-coc-gold mx-auto mb-4" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">すでに参加申請済みです</h1>
        <p className="text-sm text-coc-muted mb-8">
          選択したキャラクターはすでに「{scenario?.title}」に参加登録されています。
        </p>
        <Link href="/" className="text-sm text-coc-gold hover:underline">
          トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-xl px-4 py-8">
      <div className="rounded-2xl border border-coc-border bg-coc-surface px-6 py-6 mb-6">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">
          シナリオ参加招待
        </p>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-3">
          {scenario?.title}
        </h1>
        {scenario?.synopsis && (
          <p className="text-sm text-coc-muted leading-relaxed whitespace-pre-wrap">
            {scenario.synopsis}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-coc-border bg-coc-surface px-6 py-6 flex flex-col gap-5"
      >
        <div>
          <label className="flex items-center gap-1.5 text-xs text-coc-muted mb-2">
            <Users size={12} />
            参加するキャラクターを選択
          </label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            required
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
          >
            <option value="">キャラクターを選択してください</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.player_name ? ` (${c.player_name})` : ""}
                {c.occupation ? ` — ${c.occupation}` : ""}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-xs text-red-400 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !selectedCharacterId}
          className="w-full rounded-lg bg-coc-gold px-4 py-2.5 text-sm font-semibold text-coc-bg hover:bg-coc-gold/90 disabled:opacity-40 transition-colors"
        >
          {saving ? "申請中..." : "参加申請する"}
        </button>

        <p className="text-xs text-coc-muted/60 text-center">
          申請後はKPによる確認が行われます
        </p>
      </form>
    </div>
  );
}
