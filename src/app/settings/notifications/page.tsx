"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured, UserNotificationPrefs } from "@/lib/supabase";
import { useAuth } from "@/app/_components/AuthProvider";
import { Bell, BellOff, CheckCircle, XCircle } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type SubscriptionStatus = "idle" | "loading" | "subscribed" | "unsubscribed" | "unsupported" | "denied";

type PrefKey = "session_reminder" | "message_received" | "handout_distributed" | "bgm_broadcast";

const PREF_LABELS: { key: PrefKey; label: string; description: string }[] = [
  { key: "session_reminder", label: "セッションリマインダー", description: "次回セッション予定日時の前日・直前に通知" },
  { key: "message_received", label: "メッセージ受信", description: "他のキャラクターからメッセージが届いた時に通知" },
  { key: "handout_distributed", label: "ハンドアウト配布", description: "KPがハンドアウトを配布した時に通知" },
  { key: "bgm_broadcast", label: "BGMブロードキャスト", description: "KPがBGMキューを送信した時に通知" },
];

const DEFAULT_PREFS: Pick<UserNotificationPrefs, PrefKey> = {
  session_reminder: true,
  message_received: true,
  handout_distributed: true,
  bgm_broadcast: false,
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 ${
        checked ? "bg-coc-gold" : "bg-coc-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Pick<UserNotificationPrefs, PrefKey>>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);

  const checkCurrentSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    setStatus("loading");
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    setStatus(existing ? "subscribed" : "unsubscribed");
  }, []);

  const loadPrefs = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;
    const { data } = await supabase
      .from("user_notification_prefs")
      .select("session_reminder,message_received,handout_distributed,bgm_broadcast")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setPrefs({
        session_reminder: data.session_reminder,
        message_received: data.message_received,
        handout_distributed: data.handout_distributed,
        bgm_broadcast: data.bgm_broadcast,
      });
    }
    setPrefsLoaded(true);
  }, [user]);

  useEffect(() => {
    checkCurrentSubscription();
  }, [checkCurrentSubscription]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  async function handlePrefChange(key: PrefKey, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (!isSupabaseConfigured || !user) return;
    setPrefsSaving(true);
    setPrefMessage(null);
    const { error } = await supabase.from("user_notification_prefs").upsert(
      { user_id: user.id, ...next },
      { onConflict: "user_id" }
    );
    setPrefsSaving(false);
    if (error) {
      setPrefMessage("保存に失敗しました");
    } else {
      setPrefMessage("設定を保存しました");
      setTimeout(() => setPrefMessage(null), 2000);
    }
  }

  async function subscribe() {
    if (!isSupabaseConfigured || !user) {
      setMessage("ログインが必要です");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setMessage("VAPID公開鍵が設定されていません（管理者にお問い合わせください）");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("通知が拒否されました。ブラウザの設定から通知を許可してください。");
        setSaving(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      const keys = subJson.keys as { p256dh: string; auth: string } | undefined;

      if (!keys) throw new Error("サブスクリプションキーの取得に失敗しました");

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;

      setStatus("subscribed");
      setMessage("プッシュ通知を有効にしました");
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function unsubscribe() {
    setSaving(true);
    setMessage(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        if (isSupabaseConfigured && user) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", sub.endpoint);
        }
      }
      setStatus("unsubscribed");
      setMessage("プッシュ通知を無効にしました");
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <h1 className="font-cinzel text-2xl text-coc-gold">通知設定</h1>

      {/* 通知種別ごとのON/OFF */}
      <section className="rounded-xl border border-coc-border bg-coc-surface p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-coc-text">受け取る通知の種類</h2>
          {prefsSaving && <span className="text-xs text-coc-muted">保存中…</span>}
          {prefMessage && !prefsSaving && (
            <span className="text-xs text-green-400">{prefMessage}</span>
          )}
        </div>

        {!prefsLoaded ? (
          <p className="text-sm text-coc-muted">読み込み中…</p>
        ) : (
          <ul className="space-y-4">
            {PREF_LABELS.map(({ key, label, description }) => (
              <li key={key} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-coc-text">{label}</p>
                  <p className="text-xs text-coc-muted mt-0.5">{description}</p>
                </div>
                <Toggle
                  checked={prefs[key]}
                  onChange={(v) => handlePrefChange(key, v)}
                  disabled={prefsSaving}
                />
              </li>
            ))}
          </ul>
        )}

        {!user && (
          <p className="text-xs text-coc-muted">設定を保存するにはログインが必要です。</p>
        )}
      </section>

      {/* Webプッシュ通知 */}
      <section className="rounded-xl border border-coc-border bg-coc-surface p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Bell className="text-coc-gold" size={20} />
          <h2 className="text-lg font-medium text-coc-text">Webプッシュ通知</h2>
        </div>

        <p className="text-sm text-coc-muted leading-relaxed">
          スケジュール済みセッションの<strong className="text-coc-text">前日 19:00</strong>と
          <strong className="text-coc-text">当日 2時間前</strong>にデスクトップ・Android端末へプッシュ通知を送ります。
          メールリマインダーを補完し、見逃しを防ぎます。
        </p>

        {status === "unsupported" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            <XCircle size={16} />
            このブラウザはWeb Push通知に対応していません
          </div>
        )}

        {status === "denied" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            <XCircle size={16} />
            通知がブラウザ設定でブロックされています。ブラウザのサイト設定から通知を許可してください。
          </div>
        )}

        {status === "subscribed" && (
          <div className="flex items-center gap-2 rounded-lg border border-green-800/50 bg-green-900/20 px-4 py-3 text-sm text-green-300">
            <CheckCircle size={16} />
            プッシュ通知は有効です
          </div>
        )}

        {status === "unsubscribed" && (
          <div className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-raised px-4 py-3 text-sm text-coc-muted">
            <BellOff size={16} />
            プッシュ通知は無効です
          </div>
        )}

        {message && (
          <p className="text-sm text-coc-muted">{message}</p>
        )}

        <div className="flex gap-3 pt-2">
          {(status === "unsubscribed" || status === "idle") && (
            <button
              onClick={subscribe}
              disabled={saving || status === "loading"}
              className="flex items-center gap-2 rounded-md border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40"
            >
              <Bell size={15} />
              {saving ? "処理中…" : "プッシュ通知を有効にする"}
            </button>
          )}

          {status === "subscribed" && (
            <button
              onClick={unsubscribe}
              disabled={saving}
              className="flex items-center gap-2 rounded-md border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-text transition-colors disabled:opacity-40"
            >
              <BellOff size={15} />
              {saving ? "処理中…" : "通知を無効にする"}
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-coc-border bg-coc-surface p-6 space-y-3">
        <h2 className="text-base font-medium text-coc-text">通知タイミング</h2>
        <ul className="space-y-2 text-sm text-coc-muted">
          <li className="flex items-start gap-2">
            <span className="text-coc-gold mt-0.5">✦</span>
            <span><strong className="text-coc-text">セッション前日 19:00（JST）</strong> — 翌日のセッションを通知</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coc-gold mt-0.5">✦</span>
            <span><strong className="text-coc-text">セッション当日 2時間前</strong> — 直前リマインド</span>
          </li>
        </ul>
        <p className="text-xs text-coc-muted pt-1">
          通知はシナリオの「次回セッション予定日時」に基づいて送信されます。
          Supabase Edge Function（send-push-reminder）が pg_cron で定期実行されます。
        </p>
      </section>
    </div>
  );
}
