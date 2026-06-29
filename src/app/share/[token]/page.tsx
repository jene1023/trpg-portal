export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ token: string }> };

export default async function ShareHandoutPage({ params }: Props) {
  const { token } = await params;

  if (!isSupabaseConfigured) notFound();

  const now = new Date().toISOString();

  const { data } = await supabase
    .from("share_tokens")
    .select("*, handouts(*)")
    .eq("token", token)
    .gt("expires_at", now)
    .single();

  if (!data) notFound();

  const handout = data.handouts as {
    title: string;
    content: string | null;
    recipient_name: string | null;
    is_secret: boolean;
  } | null;

  if (!handout || handout.is_secret) notFound();

  const expiresAt = new Date(data.expires_at).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen coc-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="font-cinzel text-xs tracking-widest text-coc-muted uppercase">
            Handout
          </p>
        </div>

        <div className="rounded-xl border border-coc-border bg-coc-surface p-6 space-y-4">
          <h1 className="font-cinzel text-xl font-bold text-coc-text">
            {handout.title}
          </h1>

          {handout.recipient_name && (
            <p className="text-sm text-coc-muted">
              宛先:{" "}
              <span className="text-coc-text font-medium">
                {handout.recipient_name}
              </span>
            </p>
          )}

          {handout.content ? (
            <div className="border-l-2 border-coc-gold pl-4">
              <p className="font-crimson text-coc-text text-base leading-relaxed whitespace-pre-wrap">
                {handout.content}
              </p>
            </div>
          ) : (
            <p className="text-coc-muted text-sm italic">（本文なし）</p>
          )}

          <p className="text-xs text-coc-faint pt-2">
            このリンクの有効期限: {expiresAt}
          </p>
        </div>
      </div>
    </div>
  );
}
