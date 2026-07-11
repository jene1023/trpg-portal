"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type TransferInfo = {
  id: string;
  character_id: string;
  to_email: string;
  expires_at: string;
  status: string;
  character_name: string;
};

export default function TransferAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<TransferInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionStatus, setActionStatus] = useState<"idle" | "processing" | "done">("idle");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token || !isSupabaseConfigured) {
      setErrorMsg("無効なリンクです。");
      setLoading(false);
      return;
    }

    (async () => {
      const { data: req, error } = await supabase
        .from("character_transfer_requests")
        .select("id, character_id, to_email, expires_at, status")
        .eq("token", token)
        .maybeSingle();

      if (error || !req) {
        setErrorMsg("譲渡リクエストが見つかりません。");
        setLoading(false);
        return;
      }

      if (req.status !== "pending") {
        setErrorMsg(
          req.status === "accepted"
            ? "このリクエストはすでに承認済みです。"
            : "このリクエストはすでに拒否されています。"
        );
        setLoading(false);
        return;
      }

      if (new Date(req.expires_at) < new Date()) {
        setErrorMsg("このリクエストは有効期限切れです。");
        setLoading(false);
        return;
      }

      const { data: char } = await supabase
        .from("characters")
        .select("name")
        .eq("id", req.character_id)
        .maybeSingle();

      setInfo({
        ...req,
        character_name: char?.name ?? "（不明）",
      });
      setLoading(false);
    })();
  }, [token]);

  async function handleAccept() {
    if (!info || !isSupabaseConfigured) return;
    setActionStatus("processing");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMsg("承認するにはログインが必要です。");
      setActionStatus("idle");
      return;
    }

    const { error: updateCharErr } = await supabase
      .from("characters")
      .update({ user_id: session.user.id })
      .eq("id", info.character_id);

    if (updateCharErr) {
      setErrorMsg(updateCharErr.message);
      setActionStatus("idle");
      return;
    }

    await supabase
      .from("character_transfer_requests")
      .update({ status: "accepted" })
      .eq("id", info.id);

    setAccepted(true);
    setActionStatus("done");
  }

  async function handleReject() {
    if (!info || !isSupabaseConfigured) return;
    setActionStatus("processing");

    await supabase
      .from("character_transfer_requests")
      .update({ status: "rejected" })
      .eq("id", info.id);

    setActionStatus("done");
    setAccepted(false);
    setErrorMsg("譲渡リクエストを拒否しました。");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-lg border border-coc-border coc-card-bg p-6 space-y-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">キャラクター譲渡の確認</h1>

        {actionStatus === "done" ? (
          <div className="space-y-4">
            {accepted ? (
              <>
                <div className="rounded-lg border border-coc-gold/40 bg-coc-gold/5 p-4 text-sm">
                  <p className="font-semibold text-coc-gold mb-1">譲渡を承認しました</p>
                  <p className="text-coc-muted">
                    <strong className="text-coc-text">{info?.character_name}</strong>{" "}
                    があなたのアカウントに追加されました。
                  </p>
                </div>
                <Link
                  href="/characters"
                  className="flex items-center justify-center rounded-lg border border-coc-border bg-coc-surface px-4 py-2.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
                >
                  キャラクター一覧へ
                </Link>
              </>
            ) : (
              <p className="text-sm text-coc-muted">{errorMsg}</p>
            )}
          </div>
        ) : errorMsg && !info ? (
          <div className="space-y-4">
            <p className="text-sm text-red-400">{errorMsg}</p>
            <Link
              href="/characters"
              className="flex items-center justify-center rounded-lg border border-coc-border bg-coc-surface px-4 py-2.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
            >
              キャラクター一覧へ
            </Link>
          </div>
        ) : info ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-coc-border bg-coc-raised p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-coc-muted">キャラクター</span>
                <span className="text-coc-text font-semibold">{info.character_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coc-muted">宛先メール</span>
                <span className="text-coc-text">{info.to_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coc-muted">有効期限</span>
                <span className="text-coc-text">
                  {new Date(info.expires_at).toLocaleDateString("ja-JP")}
                </span>
              </div>
            </div>

            <p className="text-sm text-coc-muted leading-relaxed">
              このキャラクターの所有権があなたに譲渡されようとしています。
              承認するとキャラクターがあなたのアカウントに移動します。
            </p>

            {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReject}
                disabled={actionStatus === "processing"}
                className="rounded-lg border border-coc-border bg-coc-surface px-4 py-2.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow disabled:opacity-50 transition-colors"
              >
                拒否する
              </button>
              <button
                onClick={handleAccept}
                disabled={actionStatus === "processing"}
                className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors motion-safe:active:scale-[0.98]"
              >
                {actionStatus === "processing" ? "処理中..." : "承認して引き受ける"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
