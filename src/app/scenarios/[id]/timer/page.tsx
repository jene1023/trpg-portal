"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag, Pause, Play, RotateCcw, TimerIcon } from "lucide-react";
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

export default function SessionTimerPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;
  const storageKey = `session_timer_${scenarioId}`;

  const [scenarioTitle, setScenarioTitle] = useState("");
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

  // Restore state from localStorage on mount
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

  // Interval tick
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

  // Fetch scenario title
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("scenarios")
      .select("title")
      .eq("id", scenarioId)
      .single()
      .then(({ data }) => {
        setScenarioTitle(data?.title ?? "");
      });
  }, [scenarioId]);

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
          セッションタイマー
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          経過時間はページリロード後も保持されます（ブラウザの localStorage に保存）
        </p>
      </div>

      {/* Main timer display */}
      <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-6 py-8 text-center">
        <p
          className={`font-cinzel text-6xl font-bold tabular-nums tracking-widest transition-colors ${
            running ? "text-coc-gold" : "text-coc-text"
          }`}
        >
          {formatTime(elapsed)}
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
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
    </div>
  );
}
