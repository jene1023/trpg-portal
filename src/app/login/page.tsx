"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase が設定されていません。");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    const client = createSupabaseBrowserClient();

    try {
      if (mode === "login") {
        const { error: err } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError(err.message === "Invalid login credentials"
            ? "メールアドレスまたはパスワードが正しくありません。"
            : err.message);
        } else {
          router.push(redirect);
          router.refresh();
        }
      } else {
        const { error: err } = await client.auth.signUp({
          email,
          password,
        });
        if (err) {
          setError(err.message);
        } else {
          setMessage(
            "確認メールを送信しました。メールのリンクをクリックしてアカウントを有効化してください。"
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="coc-card p-8">
          <div className="mb-8 text-center">
            <span className="text-4xl coc-star-twinkle select-none">✦</span>
            <h1 className="mt-3 font-cinzel text-2xl font-bold text-coc-text">
              CoC Portal
            </h1>
            <p className="mt-1 text-sm text-coc-muted">
              {mode === "login" ? "アカウントにサインイン" : "新規アカウントを作成"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-coc-text mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coc-text mb-1">
                パスワード
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors"
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-coc-muted">6文字以上</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-700 bg-green-900/20 px-3 py-2 text-sm text-green-400">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-coc-gold py-2.5 text-sm font-semibold text-coc-void hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {loading
                ? "処理中..."
                : mode === "login"
                ? "サインイン"
                : "アカウントを作成"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-coc-muted">
            {mode === "login" ? (
              <>
                アカウントをお持ちでない方は{" "}
                <button
                  onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
                  className="text-coc-gold hover:underline"
                >
                  新規登録
                </button>
              </>
            ) : (
              <>
                すでにアカウントをお持ちの方は{" "}
                <button
                  onClick={() => { setMode("login"); setError(null); setMessage(null); }}
                  className="text-coc-gold hover:underline"
                >
                  サインイン
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
