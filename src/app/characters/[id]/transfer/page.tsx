"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function TransferPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;

  const [toEmail, setToEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (!toEmail.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMsg("ログインが必要です。");
      setStatus("error");
      return;
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("character_transfer_requests")
      .insert({
        character_id: characterId,
        from_user_id: session.user.id,
        to_email: toEmail.trim(),
        token,
        status: "pending",
        expires_at: expiresAt,
      });

    if (insertError) {
      setErrorMsg(insertError.message);
      setStatus("error");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

    const edgeFnUrl = `${supabaseUrl}/functions/v1/send-transfer-email`;
    const appBaseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "";

    const res = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        to_email: toEmail.trim(),
        token,
        character_id: characterId,
        accept_url: `${appBaseUrl}/characters/transfer/accept?token=${token}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn("Edge function returned error:", body);
    }

    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link
        href={`/characters/${characterId}`}
        className="mb-6 flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
      >
        <ArrowLeft size={16} />
        キャラクター詳細へ戻る
      </Link>

      <div className="rounded-lg border border-coc-border coc-card-bg p-6 space-y-6">
        <div>
          <h1 className="font-cinzel text-xl font-bold text-coc-text">別ユーザーに譲渡</h1>
          <p className="mt-2 text-sm text-coc-muted leading-relaxed">
            このキャラクターの所有権を別のユーザーアカウントに移譲します。<br />
            相手のメールアドレスを入力すると確認メールが送信されます。<br />
            相手が承認リンクを踏むと譲渡が完了します（有効期限: 7日間）。
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-lg border border-coc-gold/40 bg-coc-gold/5 p-4 text-sm text-coc-text">
            <p className="font-semibold text-coc-gold mb-1">譲渡リクエストを送信しました</p>
            <p className="text-coc-muted">
              <strong className="text-coc-text">{toEmail}</strong>{" "}
              宛に確認メールを送信しました。相手が承認するまでキャラクターはあなたのアカウントに残ります。
            </p>
            <button
              onClick={() => router.push(`/characters/${characterId}`)}
              className="mt-4 rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
            >
              キャラクター詳細に戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-coc-muted mb-1.5" htmlFor="to-email">
                譲渡先のメールアドレス
              </label>
              <input
                id="to-email"
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:border-coc-border-glow focus:outline-none transition-colors"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending" || !toEmail.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2.5 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors motion-safe:active:scale-[0.98]"
            >
              <Send size={14} />
              {status === "sending" ? "送信中..." : "譲渡リクエストを送信"}
            </button>

            <p className="text-xs text-coc-muted">
              ※ 相手がリクエストを承認すると、あなたはこのキャラクターにアクセスできなくなります。
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
