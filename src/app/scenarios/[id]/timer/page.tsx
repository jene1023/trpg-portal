"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import {
  AlarmClock,
  ArrowLeft,
  Flag,
  Pause,
  Play,
  Radio,
  RotateCcw,
  TimerIcon,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type LapEntry = {
  id: string;
  label: string;
  duration: number;
  total: number;
};

type StoredState = {
  running: boolean;
  startedAt: number | null;
  baseElapsed: number;
  elapsed: number;
  laps: LapEntry[];
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Props = { params: Promise<{ id: string }> };

export default function SessionTimerPage({ params }: Props) {
  const { id: scenarioId } = use(params);
  const storageKey = `session_timer_${scenarioId}`;

  const [scenarioTitle, setScenarioTitle] = useState("");

  // ── Countdown timer state ───────────────────────────────────────────────
  const [cdSceneLabel, setCdSceneLabel] = useState("");
  const [cdDurationSec, setCdDurationSec] = useState(60);
  const [cdRemaining, setCdRemaining] = useState<number | null>(null);
  const [cdTimedOut, setCdTimedOut] = useState(false);
  const [cdConnected, setCdConnected] = useState(false);
  const [cdActiveLabel, setCdActiveLabel] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const cdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Stopwatch state ─────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<LapEntry[]>([]);
  const [lapLabel, setLapLabel] = useState("");

  const runningRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0);
  const lapsRef = useRef<LapEntry[]>([]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    lapsRef.current = laps;
  }, [laps]);

  // Restore stopwatch state from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved: StoredState = JSON.parse(raw);
      const savedLaps = saved.laps ?? [];
      lapsRef.current = savedLaps;
      setLaps(savedLaps);

      if (saved.running && saved.startedAt) {
        const additional = Math.floor((Date.now() - saved.startedAt) / 1000);
        const restored = (saved.baseElapsed ?? 0) + additional;
        baseElapsedRef.current = saved.baseElapsed ?? 0;
        startedAtRef.current = saved.startedAt;
        setElapsed(restored);
        setRunning(true);
        runningRef.current = true;
      } else {
        const savedElapsed = saved.elapsed ?? 0;
        baseElapsedRef.current = savedElapsed;
        setElapsed(savedElapsed);
      }
    } catch {
      // ignore corrupt data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stopwatch interval tick
  useEffect(() => {
    if (!running) return;
    const startedAt = startedAtRef.current ?? Date.now();
    startedAtRef.current = startedAt;

    const interval = setInterval(() => {
      const newElapsed = baseElapsedRef.current + Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(newElapsed);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          running: true,
          startedAt,
          baseElapsed: baseElapsedRef.current,
          elapsed: newElapsed,
          laps: lapsRef.current,
        } satisfies StoredState)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [running, storageKey]);

  // Supabase Realtime — countdown broadcast channel
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ch = supabase
      .channel(`timer-${scenarioId}`)
      .on("broadcast", { event: "timer_start" }, (msg: { payload: { sceneLabel: string; durationSec: number; startedAt: number } }) => {
        const { sceneLabel, durationSec, startedAt } = msg.payload;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const rem = Math.max(0, durationSec - elapsed);
        setCdActiveLabel(sceneLabel);
        startCdCountdown(rem);
      })
      .subscribe((status: string) => {
        setCdConnected(status === "SUBSCRIBED");
      });

    channelRef.current = ch;

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
      setCdConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  // Fetch scenario title
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("scenarios")
      .select("title")
      .eq("id", scenarioId)
      .single()
      .then(({ data }: { data: { title: string } | null }) => {
        setScenarioTitle(data?.title ?? "");
      });
  }, [scenarioId]);

  function startCdCountdown(fromSec: number) {
    if (cdIntervalRef.current) {
      clearInterval(cdIntervalRef.current);
      cdIntervalRef.current = null;
    }
    setCdTimedOut(false);
    setCdRemaining(fromSec);

    if (fromSec <= 0) {
      setCdTimedOut(true);
      return;
    }

    const endAt = Date.now() + fromSec * 1000;
    cdIntervalRef.current = setInterval(() => {
      const rem = Math.round((endAt - Date.now()) / 1000);
      if (rem <= 0) {
        setCdRemaining(0);
        setCdTimedOut(true);
        clearInterval(cdIntervalRef.current!);
        cdIntervalRef.current = null;
      } else {
        setCdRemaining(rem);
      }
    }, 100);
  }

  function handleCdStart() {
    if (!isSupabaseConfigured || !channelRef.current) return;
    const startedAt = Date.now();
    const label = cdSceneLabel.trim() || "シーン";
    channelRef.current.send({
      type: "broadcast",
      event: "timer_start",
      payload: { sceneLabel: label, durationSec: cdDurationSec, startedAt },
    });
    setCdActiveLabel(label);
    startCdCountdown(cdDurationSec);
  }

  function resetCd() {
    if (cdIntervalRef.current) {
      clearInterval(cdIntervalRef.current);
      cdIntervalRef.current = null;
    }
    setCdRemaining(null);
    setCdTimedOut(false);
    setCdActiveLabel("");
  }

  // ── Stopwatch helpers ───────────────────────────────────────────────────
  function start() {
    startedAtRef.current = Date.now();
    baseElapsedRef.current = elapsed;
    setRunning(true);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        running: true,
        startedAt: startedAtRef.current,
        baseElapsed: elapsed,
        elapsed,
        laps: lapsRef.current,
      } satisfies StoredState)
    );
  }

  function pause() {
    setRunning(false);
    baseElapsedRef.current = elapsed;
    startedAtRef.current = null;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        running: false,
        startedAt: null,
        baseElapsed: elapsed,
        elapsed,
        laps: lapsRef.current,
      } satisfies StoredState)
    );
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    baseElapsedRef.current = 0;
    startedAtRef.current = null;
    lapsRef.current = [];
    localStorage.removeItem(storageKey);
  }

  function addLap() {
    if (elapsed === 0) return;
    const lastTotal = laps.length > 0 ? laps[laps.length - 1].total : 0;
    const newLap: LapEntry = {
      id: crypto.randomUUID(),
      label: lapLabel.trim() || `ラップ ${laps.length + 1}`,
      duration: elapsed - lastTotal,
      total: elapsed,
    };
    const newLaps = [...laps, newLap];
    lapsRef.current = newLaps;
    setLaps(newLaps);
    setLapLabel("");
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        running: runningRef.current,
        startedAt: startedAtRef.current,
        baseElapsed: baseElapsedRef.current,
        elapsed,
        laps: newLaps,
      } satisfies StoredState)
    );
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
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <TimerIcon size={20} className="text-coc-gold" />
          タイマー
        </h1>
      </div>

      {/* ── Countdown Timer (Realtime) ───────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
        <div className="flex items-center gap-2 mb-4">
          <AlarmClock size={16} className="text-coc-gold" />
          <p className="text-sm font-medium text-coc-text">カウントダウンタイマー</p>
          <span
            className={`ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
              cdConnected
                ? "border-green-700 bg-green-900/20 text-green-400"
                : "border-coc-border text-coc-muted"
            }`}
          >
            <Radio size={10} className={cdConnected ? "animate-pulse" : ""} />
            {cdConnected ? "同期中" : "接続中…"}
          </span>
        </div>

        {!isSupabaseConfigured && (
          <p className="text-sm text-coc-muted text-center py-4">
            Supabase が設定されていないため、リアルタイム機能は利用できません。
          </p>
        )}

        {isSupabaseConfigured && cdRemaining === null && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-coc-muted block mb-1">シーン名</label>
              <input
                type="text"
                placeholder="例: 脱出制限時間・暗号解読"
                value={cdSceneLabel}
                onChange={(e) => setCdSceneLabel(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
              />
            </div>
            <div>
              <label className="text-xs text-coc-muted block mb-1">制限時間（秒）</label>
              <input
                type="number"
                min={1}
                value={cdDurationSec}
                onChange={(e) => setCdDurationSec(Math.max(1, Number(e.target.value)))}
                className="w-32 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
              />
            </div>
            <button
              onClick={handleCdStart}
              className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
            >
              <Play size={14} />
              カウントダウン開始（全員に同期）
            </button>
          </div>
        )}

        {isSupabaseConfigured && cdRemaining !== null && (
          <div className="text-center">
            {cdActiveLabel && (
              <p className="text-sm text-coc-muted mb-2">{cdActiveLabel}</p>
            )}
            <p
              className={`font-cinzel text-6xl font-bold tabular-nums tracking-widest transition-colors ${
                cdRemaining <= 10 ? "text-red-400 animate-pulse" : "text-coc-gold"
              }`}
            >
              {formatCountdown(cdRemaining)}
            </p>
            <button
              onClick={resetCd}
              className="mt-4 flex items-center gap-2 mx-auto rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            >
              <RotateCcw size={14} />
              リセット
            </button>
          </div>
        )}
      </div>

      {/* ── Stopwatch ───────────────────────────────────────────────────── */}
      <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="text-xs font-medium text-coc-muted mb-4 flex items-center gap-1.5">
          <TimerIcon size={13} />
          セッションストップウォッチ
        </p>

        <div className="text-center mb-5">
          <p
            className={`font-cinzel text-6xl font-bold tabular-nums tracking-widest transition-colors ${
              running ? "text-coc-gold" : "text-coc-text"
            }`}
          >
            {formatTime(elapsed)}
          </p>
          <p className="text-xs text-coc-muted mt-1">
            経過時間はページリロード後も保持されます
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          {!running ? (
            <button
              onClick={start}
              className="flex items-center gap-2 rounded-lg border border-green-700 bg-green-950/30 px-6 py-2.5 text-sm font-medium text-green-400 hover:bg-green-950/50 transition-colors"
            >
              <Play size={16} />
              {elapsed > 0 ? "再開" : "開始"}
            </button>
          ) : (
            <button
              onClick={pause}
              className="flex items-center gap-2 rounded-lg border border-yellow-700 bg-yellow-950/30 px-6 py-2.5 text-sm font-medium text-yellow-400 hover:bg-yellow-950/50 transition-colors"
            >
              <Pause size={16} />
              一時停止
            </button>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg border border-coc-border px-4 py-2.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
          >
            <RotateCcw size={14} />
            リセット
          </button>
        </div>
      </div>

      {/* Lap input */}
      <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
        <p className="text-xs font-medium text-coc-muted mb-3">ラップを記録</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="場面名（例: 導入シーン、図書館調査...）"
            value={lapLabel}
            onChange={(e) => setLapLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLap()}
            className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold"
          />
          <button
            onClick={addLap}
            disabled={elapsed === 0}
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Flag size={14} />
            ラップ
          </button>
        </div>
      </div>

      {/* Laps list */}
      {laps.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-coc-muted">ラップ記録</p>
          {laps.map((lap, i) => (
            <div
              key={lap.id}
              className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-coc-muted w-5 text-right">{i + 1}</span>
                <span className="text-sm text-coc-text">{lap.label}</span>
              </div>
              <div className="text-right">
                <p className="font-cinzel text-sm font-bold text-coc-gold tabular-nums">
                  {formatTime(lap.duration)}
                </p>
                <p className="text-xs text-coc-muted">{formatTime(lap.total)} 経過</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-raised px-4 py-3">
            <span className="text-xs text-coc-muted">現在の合計経過時間</span>
            <span className="font-cinzel text-sm font-bold text-coc-text tabular-nums">
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      )}

      {/* Timeout modal */}
      {cdTimedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-2xl border border-red-600 bg-red-950/90 px-8 py-8 text-center shadow-2xl">
            <p className="text-5xl mb-4">⏰</p>
            <p className="font-cinzel text-2xl font-bold text-red-400">タイムアップ！</p>
            {cdActiveLabel && (
              <p className="mt-2 text-sm text-red-300/70">{cdActiveLabel}</p>
            )}
            <button
              onClick={() => {
                setCdTimedOut(false);
                setCdRemaining(null);
                setCdActiveLabel("");
              }}
              className="mt-6 rounded-lg border border-red-700 bg-red-900/50 px-6 py-2 text-sm font-medium text-red-300 hover:bg-red-900/80 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
