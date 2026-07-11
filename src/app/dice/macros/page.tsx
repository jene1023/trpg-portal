"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Dice6, Trash2, Plus, Globe, Lock, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured, createSupabaseBrowserClient, DiceMacro, Character, Campaign } from "@/lib/supabase";
import { evaluateDiceExpression } from "@/lib/diceExpression";

type RollResult = {
  macroId: string;
  name: string;
  expression: string;
  resolvedExpression: string;
  total: number;
  detail: string;
};

function resolveExpression(expression: string, character: Character | null): string {
  if (!character) return expression;
  const map: Record<string, number> = {
    STR: character.str,
    CON: character.con,
    POW: character.pow,
    DEX: character.dex,
    APP: character.app,
    SIZ: character.siz,
    INT: character.int_stat,
    EDU: character.edu,
    HP: character.hp_current,
    MP: character.mp_current,
    SAN: character.san_current,
    LUCK: character.luck,
  };
  return expression.replace(/\{([A-Z_]+)\}/g, (_, key) =>
    key in map ? String(map[key]) : `{${key}}`
  );
}

export default function DiceMacrosPage() {
  const [macros, setMacros] = useState<DiceMacro[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [formCampaignId, setFormCampaignId] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [rolling, setRolling] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const client = createSupabaseBrowserClient();
    client.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadMacros(data.user.id);
      }
    });
    supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setCampaigns(data); });
    supabase
      .from("characters")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data }) => { if (data) setCharacters(data); });
  }, []);

  function loadMacros(uid: string) {
    supabase
      .from("dice_macros")
      .select("*")
      .or(`owner_id.eq.${uid},is_public.eq.true`)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMacros(data); });
  }

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) ?? null;

  const filteredMacros = macros.filter((m) => {
    if (selectedCampaignId) return m.campaign_id === selectedCampaignId || m.campaign_id === null;
    return true;
  });

  async function addMacro(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !expression.trim()) return;
    if (!isSupabaseConfigured || !userId) return;

    try {
      evaluateDiceExpression(
        resolveExpression(expression.trim(), selectedCharacter)
          .replace(/\{[A-Z_]+\}/g, "1")
      );
    } catch {
      setError("無効なダイス式です（例: 2d6, 1d4+{STR}）");
      return;
    }

    setSaving(true);
    setError(null);
    const { data, error: dbErr } = await supabase
      .from("dice_macros")
      .insert({
        owner_id: userId,
        campaign_id: formCampaignId || null,
        name: name.trim(),
        expression: expression.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      })
      .select()
      .single();

    setSaving(false);
    if (dbErr) {
      setError("保存に失敗しました");
      return;
    }
    if (data) {
      setMacros((prev) => [...prev, data]);
      setName("");
      setExpression("");
      setDescription("");
      setIsPublic(false);
      setFormCampaignId("");
    }
  }

  async function deleteMacro(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("dice_macros").delete().eq("id", id);
    setMacros((prev) => prev.filter((m) => m.id !== id));
    if (lastResult?.macroId === id) setLastResult(null);
  }

  function roll(macro: DiceMacro) {
    if (rolling) return;
    setRolling(macro.id);
    setLastResult(null);
    setTimeout(() => {
      const resolved = resolveExpression(macro.expression, selectedCharacter);
      const evaluated = evaluateDiceExpression(resolved);
      setLastResult({
        macroId: macro.id,
        name: macro.name,
        expression: macro.expression,
        resolvedExpression: resolved !== macro.expression ? resolved : "",
        total: evaluated.total,
        detail: evaluated.detail,
      });
      setRolling(null);
    }, 300);
  }

  const ownMacros = filteredMacros.filter((m) => m.owner_id === userId);
  const publicMacros = filteredMacros.filter((m) => m.owner_id !== userId && m.is_public);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          ホームへ
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">カスタムダイスマクロ</h1>
        <p className="text-sm text-coc-muted mt-1">
          複合ダイス式をマクロとして保存し、セッション中にワンクリックで実行できます。
          <code className="text-xs font-mono bg-coc-raised px-1 rounded">{"{STR}"}</code> 等でキャラクター能力値を参照可能。
        </p>
      </div>

      {/* キャラクター選択（パラメータ置換用） */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-coc-muted block mb-1">キャラクター（能力値参照用）</label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          >
            <option value="">（選択なし）</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-coc-muted block mb-1">キャンペーンで絞り込み</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          >
            <option value="">すべて表示</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ロール結果 */}
      {lastResult && (
        <div className="rounded-lg border border-coc-gold/40 bg-coc-gold/5 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-coc-muted mb-0.5">
              {lastResult.name}（{lastResult.expression}
              {lastResult.resolvedExpression ? ` → ${lastResult.resolvedExpression}` : ""}）
            </p>
            <p className="text-sm text-coc-muted font-mono">{lastResult.detail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-coc-muted mb-0.5">合計</p>
            <p className="font-cinzel text-3xl font-bold text-coc-gold">{lastResult.total}</p>
          </div>
        </div>
      )}

      {/* マクロ追加フォーム */}
      {userId && (
        <form
          onSubmit={addMacro}
          className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">新しいマクロを追加</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-coc-muted block mb-1">マクロ名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: ファイト！コンボ"
                className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-1.5 focus:outline-none focus:border-coc-gold"
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-xs text-coc-muted block mb-1">ダイス式</label>
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="例: 1d6+{STR}, 2d6+3"
                className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-1.5 focus:outline-none focus:border-coc-gold font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-coc-muted block mb-1">説明（任意）</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 近接攻撃の2連撃ダメージ"
              className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-1.5 focus:outline-none focus:border-coc-gold"
              maxLength={100}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-coc-muted block mb-1">キャンペーンに紐付け（任意）</label>
              <select
                value={formCampaignId}
                onChange={(e) => setFormCampaignId(e.target.value)}
                className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
              >
                <option value="">紐付けなし</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-coc-muted cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-500"
              />
              <Globe size={13} />
              キャンペーン全体に公開
            </label>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving || !name.trim() || !expression.trim() || !userId}
            className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-4 py-1.5 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            マクロを保存
          </button>
        </form>
      )}

      {/* マイマクロ */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">マイマクロ</h2>
        {ownMacros.length === 0 ? (
          <p className="text-sm text-coc-muted text-center py-6">
            {userId ? "マクロがありません。上のフォームから追加してください。" : "ログインが必要です。"}
          </p>
        ) : (
          <div className="space-y-2">
            {ownMacros.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-lg border border-coc-border coc-card-bg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-coc-text truncate">{m.name}</p>
                    {m.is_public ? (
                      <span className="flex items-center gap-0.5 text-xs text-coc-gold border border-coc-gold/40 rounded px-1.5 py-0.5 shrink-0">
                        <Globe size={10} />公開
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-xs text-coc-muted border border-coc-border rounded px-1.5 py-0.5 shrink-0">
                        <Lock size={10} />非公開
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-coc-muted font-mono">{m.expression}</p>
                  {m.description && <p className="text-xs text-coc-muted mt-0.5">{m.description}</p>}
                  {selectedCharacter && m.expression.includes("{") && (
                    <p className="text-xs text-coc-muted/60 font-mono mt-0.5">
                      → {resolveExpression(m.expression, selectedCharacter)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => roll(m)}
                    disabled={!!rolling}
                    className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-1.5 text-xs font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Dice6 size={13} className={rolling === m.id ? "animate-spin" : ""} />
                    ロール
                  </button>
                  <button
                    onClick={() => deleteMacro(m.id)}
                    className="text-coc-muted hover:text-red-400 transition-colors p-1"
                    aria-label="削除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 公開マクロ */}
      {publicMacros.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            <Globe size={13} className="inline mr-1" />
            キャンペーン共有マクロ
          </h2>
          <div className="space-y-2">
            {publicMacros.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-lg border border-coc-border/60 bg-coc-surface/50 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coc-text truncate">{m.name}</p>
                  <p className="text-xs text-coc-muted font-mono">{m.expression}</p>
                  {m.description && <p className="text-xs text-coc-muted mt-0.5">{m.description}</p>}
                  {selectedCharacter && m.expression.includes("{") && (
                    <p className="text-xs text-coc-muted/60 font-mono mt-0.5">
                      → {resolveExpression(m.expression, selectedCharacter)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => roll(m)}
                  disabled={!!rolling}
                  className="flex items-center gap-1.5 rounded-md border border-coc-border text-coc-muted px-3 py-1.5 text-xs font-medium hover:text-coc-gold hover:border-coc-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <RefreshCw size={12} className={rolling === m.id ? "animate-spin" : ""} />
                  ロール
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ダイス式ヘルプ */}
      <div className="rounded-md border border-coc-border bg-coc-raised p-3 text-xs text-coc-muted space-y-1">
        <p className="font-semibold text-coc-text">ダイス式の書き方</p>
        <p>• <code className="font-mono">2d6</code> — 6面ダイスを2個</p>
        <p>• <code className="font-mono">1d6+{"{STR}"}</code> — ダイス＋STR能力値（キャラクター選択時に置換）</p>
        <p>• <code className="font-mono">{"{DEX}"}+2</code> — DEX＋修正値</p>
        <p>• 利用できるパラメータ: <code className="font-mono">STR CON POW DEX APP SIZ INT EDU HP MP SAN LUCK</code></p>
      </div>
    </div>
  );
}
