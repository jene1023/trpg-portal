"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Square, CheckCircle, ClipboardCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DEFAULT_PREFLIGHT_ITEMS = [
  "VTTツールURLをPLへ共有した",
  "Discord/VCへの接続テスト完了",
  "全ハンドアウトの配布完了",
  "シナリオ資料PDFの準備完了",
  "BGM・効果音の設定完了",
  "参加PLの出欠確認完了",
  "セッション開始時刻をPLへ通知",
];

type PreflightItem = {
  id: string;
  session_id: string;
  label: string;
  is_checked: boolean;
  order: number;
};

export default function PreflightPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [sessionTitle, setSessionTitle] = useState("");
  const [items, setItems] = useState<PreflightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readyNotified, setReadyNotified] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: session }, { data: rows }] = await Promise.all([
        supabase
          .from("sessions")
          .select("title, session_number, characters(name)")
          .eq("id", sessionId)
          .single(),
        supabase
          .from("session_preflight_items")
          .select("*")
          .eq("session_id", sessionId)
          .order("order", { ascending: true }),
      ]);

      if (session) {
        const char = session.characters as unknown as { name: string } | null;
        setSessionTitle(
          `${char?.name ?? ""} — セッション #${session.session_number} ${session.title}`
        );
      }

      if (rows && rows.length > 0) {
        setItems(rows as PreflightItem[]);
      } else {
        const defaultItems = DEFAULT_PREFLIGHT_ITEMS.map((label, i) => ({
          session_id: sessionId,
          label,
          is_checked: false,
          order: i,
        }));
        const { data: inserted } = await supabase
          .from("session_preflight_items")
          .insert(defaultItems)
          .select("*");
        setItems((inserted ?? []) as PreflightItem[]);
      }

      setLoading(false);
    })();
  }, [sessionId]);

  useEffect(() => {
    if (items.length === 0 || readyNotified) return;
    const allChecked = items.every((item) => item.is_checked);
    if (!allChecked) return;

    const channel = supabase.channel(`session_preflight_${sessionId}`);
    channel.subscribe(() => {
      channel
        .send({
          type: "broadcast",
          event: "session_ready",
          payload: { session_id: sessionId },
        })
        .then(() => {
          supabase.removeChannel(channel);
          setReadyNotified(true);
        });
    });
  }, [items, readyNotified, sessionId]);

  async function toggleItem(item: PreflightItem) {
    if (!isSupabaseConfigured) return;
    const newChecked = !item.is_checked;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_checked: newChecked } : i))
    );
    await supabase
      .from("session_preflight_items")
      .update({ is_checked: newChecked })
      .eq("id", item.id);
  }

  const checkedCount = items.filter((i) => i.is_checked).length;
  const allChecked = items.length > 0 && checkedCount === items.length;
  const progressPct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/sessions/${sessionId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          セッション詳細
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <ClipboardCheck size={20} className="text-coc-gold" />
          プレフライトチェック
        </h1>
        {sessionTitle && (
          <p className="text-xs text-coc-muted mt-1">{sessionTitle}</p>
        )}
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {allChecked && (
            <div className="rounded-xl border border-green-700 bg-green-950/20 px-5 py-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">セッション準備完了！</p>
                <p className="text-xs text-coc-muted">
                  全チェック項目が完了しました。PLのダッシュボードへ通知しました。
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                チェックリスト
              </p>
              <span className="text-xs text-coc-muted">
                {checkedCount} / {items.length}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-coc-raised w-full"
                >
                  {item.is_checked ? (
                    <CheckSquare size={18} className="text-coc-gold flex-shrink-0" />
                  ) : (
                    <Square size={18} className="text-coc-muted flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      item.is_checked ? "text-coc-muted line-through" : "text-coc-text"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {items.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-coc-muted">進捗</span>
                <span className="text-xs text-coc-muted">{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-coc-raised overflow-hidden">
                <div
                  className="h-full rounded-full bg-coc-gold transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
