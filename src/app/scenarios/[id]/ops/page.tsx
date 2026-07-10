"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  ListChecks,
  StickyNote,
  Dices,
  MessageCircle,
  Radio,
  Send,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  CharacterSkill,
  ScenarioParticipant,
  SessionAgendaItem,
  ScenarioNote,
  SuccessLevel,
} from "@/lib/supabase";
import PartyMemberCard from "@/app/_components/PartyMemberCard";
import PartySanCheck from "@/app/_components/PartySanCheck";
import SessionAgendaChecklist from "@/app/_components/SessionAgendaChecklist";
import ScenarioNoteList from "@/app/_components/ScenarioNoteList";

type Tab = "status" | "agenda" | "notes" | "roll" | "chat";

const TAB_IDS: Tab[] = ["status", "agenda", "notes", "roll", "chat"];

const TAB_CONFIG: { id: Tab; label: string }[] = [
  { id: "status", label: "ステータス" },
  { id: "agenda", label: "アジェンダ" },
  { id: "notes", label: "メモ" },
  { id: "roll", label: "ロール" },
  { id: "chat", label: "チャット" },
];

type ChatMessage = {
  author: string;
  text: string;
  timestamp: string;
};

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: Character & { character_skills: CharacterSkill[] };
};

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";

type RollResult = {
  characterId: string;
  characterName: string;
  skillValue: number;
  rollValue: number;
  degree: SuccessDegree;
};

function judge(roll: number, skillValue: number): SuccessDegree {
  const isFumble = skillValue < 50 ? roll >= 96 : roll === 100;
  if (isFumble) return "致命的失敗";
  if (roll <= Math.floor(skillValue / 5)) return "決定的成功";
  if (roll <= skillValue) return "通常成功";
  return "失敗";
}

const DEGREE_TO_LEVEL: Record<SuccessDegree, SuccessLevel> = {
  "決定的成功": "critical_success",
  "通常成功": "success",
  "失敗": "failure",
  "致命的失敗": "fumble",
};

const DEGREE_STYLE: Record<
  SuccessDegree,
  { border: string; text: string; bg: string }
> = {
  "決定的成功": {
    border: "border-yellow-400",
    text: "text-yellow-400",
    bg: "bg-yellow-400/5",
  },
  "通常成功": {
    border: "border-green-500",
    text: "text-green-400",
    bg: "bg-green-500/5",
  },
  "失敗": {
    border: "border-coc-border",
    text: "text-coc-muted",
    bg: "bg-coc-raised",
  },
  "致命的失敗": {
    border: "border-red-600",
    text: "text-red-500",
    bg: "bg-red-600/5",
  },
};

const DEGREE_ORDER: SuccessDegree[] = [
  "決定的成功",
  "通常成功",
  "失敗",
  "致命的失敗",
];

export default function OpsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [activeTab, setActiveTab] = useState<Tab>("status");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [participants, setParticipants] = useState<ParticipantWithCharacter[]>(
    []
  );
  const [agendaItems, setAgendaItems] = useState<SessionAgendaItem[]>([]);
  const [notes, setNotes] = useState<ScenarioNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [skillName, setSkillName] = useState("");
  const [rollResults, setRollResults] = useState<RollResult[]>([]);
  const [rolling, setRolling] = useState(false);
  const [lastSkill, setLastSkill] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatAuthor, setChatAuthor] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncHash = () => {
      const h = window.location.hash.slice(1) as Tab;
      if (TAB_IDS.includes(h)) setActiveTab(h);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const [
        { data: scenario },
        { data: pData },
        { data: aData },
        { data: nData },
      ] = await Promise.all([
        supabase
          .from("scenarios")
          .select("title")
          .eq("id", id)
          .single(),
        supabase
          .from("scenario_participants")
          .select("*, characters(*, character_skills(*))")
          .eq("scenario_id", id),
        supabase
          .from("session_agenda_items")
          .select("*")
          .eq("scenario_id", id)
          .order("order_index", { ascending: true }),
        supabase
          .from("scenario_notes")
          .select("*")
          .eq("scenario_id", id)
          .order("created_at", { ascending: false }),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      setParticipants((pData ?? []) as ParticipantWithCharacter[]);
      setAgendaItems((aData ?? []) as SessionAgendaItem[]);
      setNotes((nData ?? []) as ScenarioNote[]);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel(`chat-${id}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "message" }, ({ payload }: { payload: any }) => {
        setChatMessages((prev) => [...prev, payload as ChatMessage].slice(-100));
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((status: any) => {
        setChatConnected(status === "SUBSCRIBED");
      });
    chatChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      chatChannelRef.current = null;
      setChatConnected(false);
    };
  }, [id]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }

  async function handleChatSend() {
    if (!chatAuthor.trim() || !chatText.trim() || chatSending || !chatChannelRef.current) return;
    setChatSending(true);
    await chatChannelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: {
        author: chatAuthor.trim(),
        text: chatText.trim(),
        timestamp: new Date().toISOString(),
      },
    });
    setChatText("");
    setChatSending(false);
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  }

  function formatChatTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const chars = participants
    .map((p) => p.characters)
    .filter(Boolean) as (Character & { character_skills: CharacterSkill[] })[];

  const allSkillNames = Array.from(
    new Set(
      participants.flatMap((p) =>
        (p.characters?.character_skills ?? []).map((s) => s.skill_name)
      )
    )
  ).sort();

  async function rollAll() {
    if (!skillName.trim() || rolling) return;
    setRolling(true);
    const now = new Date().toISOString();
    const newResults: RollResult[] = [];
    const insertRows: {
      character_id: string;
      skill_name: string;
      skill_value: number;
      roll_value: number;
      success_level: SuccessLevel;
      rolled_at: string;
    }[] = [];

    for (const p of participants) {
      const char = p.characters;
      if (!char) continue;
      const skill = (char.character_skills ?? []).find(
        (s) => s.skill_name === skillName.trim()
      );
      const skillValue = skill?.current_value ?? 0;
      const roll = Math.floor(Math.random() * 100) + 1;
      const degree = judge(roll, skillValue);
      newResults.push({
        characterId: char.id,
        characterName: char.name,
        skillValue,
        rollValue: roll,
        degree,
      });
      insertRows.push({
        character_id: char.id,
        skill_name: skillName.trim(),
        skill_value: skillValue,
        roll_value: roll,
        success_level: DEGREE_TO_LEVEL[degree],
        rolled_at: now,
      });
    }

    if (isSupabaseConfigured && insertRows.length > 0) {
      await supabase.from("dice_rolls").insert(insertRows);
    }
    setLastSkill(skillName.trim());
    setRollResults(newResults);
    setRolling(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          KPオペレーション
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          セッション中の主要ツールを一画面で管理
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-coc-border bg-coc-surface p-1 mb-6">
        {TAB_CONFIG.map(({ id: tabId, label }) => (
          <button
            key={tabId}
            onClick={() => switchTab(tabId)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === tabId
                ? "bg-coc-gold text-black"
                : "text-coc-muted hover:text-coc-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-coc-muted text-center py-8">読み込み中...</p>
      ) : (
        <>
          {activeTab === "status" && (
            <div className="space-y-4">
              {chars.length === 0 ? (
                <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
                  <Shield
                    size={32}
                    className="text-coc-muted mx-auto mb-3 opacity-40"
                  />
                  <p className="text-coc-muted text-sm">
                    参加キャラクターが登録されていません。
                  </p>
                  <Link
                    href={`/scenarios/${id}/participants`}
                    className="mt-3 inline-block text-xs text-coc-gold hover:underline"
                  >
                    参加キャラクターを追加 →
                  </Link>
                </div>
              ) : (
                <>
                  {chars.map((char) => (
                    <PartyMemberCard key={char.id} char={char} />
                  ))}
                  <PartySanCheck
                    characters={chars.map((c) => ({
                      id: c.id,
                      name: c.name,
                      sanCurrent: c.san_current,
                      sanMax: c.san_max,
                    }))}
                  />
                  <div className="mt-2 text-xs text-coc-muted text-center">
                    <span className="inline-flex items-center gap-3">
                      <span className="text-green-400">■</span> 50%超
                      <span className="text-yellow-400">■</span> 25〜50%
                      <span className="text-red-400">■</span> 25%以下
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "agenda" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ListChecks size={18} className="text-coc-gold" />
                <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest">
                  進行チェックリスト
                </h2>
              </div>
              <SessionAgendaChecklist
                scenarioId={id}
                initialItems={agendaItems}
              />
            </div>
          )}

          {activeTab === "notes" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <StickyNote size={18} className="text-coc-gold" />
                <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest">
                  共有メモ
                </h2>
              </div>
              <ScenarioNoteList scenarioId={id} initialNotes={notes} />
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-coc-gold" />
                  <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest">
                    セッションチャット
                  </h2>
                </div>
                <span
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                    chatConnected
                      ? "border-green-700 bg-green-900/20 text-green-400"
                      : "border-coc-border text-coc-muted"
                  }`}
                >
                  <Radio size={10} className={chatConnected ? "animate-pulse" : ""} />
                  {chatConnected ? "接続中" : "接続待機中"}
                </span>
              </div>
              {!isSupabaseConfigured ? (
                <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
                  Supabase が設定されていないため利用できません。
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-coc-border bg-coc-surface overflow-y-auto max-h-[45vh] px-4 py-4 flex flex-col gap-3">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <MessageCircle size={28} className="text-coc-muted opacity-30 mb-2" />
                        <p className="text-sm text-coc-muted">メッセージなし</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3"
                        >
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-coc-gold">
                              {msg.author}
                            </span>
                            <span className="text-xs text-coc-muted flex-shrink-0">
                              {formatChatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </p>
                        </div>
                      ))
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                  <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 flex flex-col gap-3">
                    <input
                      type="text"
                      value={chatAuthor}
                      onChange={(e) => setChatAuthor(e.target.value)}
                      placeholder="名前（例: KP / 探索者名）"
                      maxLength={30}
                      className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <textarea
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={handleChatKeyDown}
                        placeholder="メッセージ… (Enter で送信 / Shift+Enter で改行)"
                        rows={2}
                        className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                      />
                      <button
                        onClick={handleChatSend}
                        disabled={!chatAuthor.trim() || !chatText.trim() || chatSending || !chatConnected}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end"
                      >
                        <Send size={15} />
                        送信
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "roll" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Dices size={18} className="text-coc-gold" />
                <h2 className="font-cinzel text-xs font-semibold text-coc-gold uppercase tracking-widest">
                  グループロール
                </h2>
              </div>
              {participants.length === 0 ? (
                <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
                  <p className="text-coc-muted text-sm">
                    参加キャラクターが登録されていません。
                  </p>
                  <Link
                    href={`/scenarios/${id}/participants`}
                    className="mt-3 inline-block text-xs text-coc-gold hover:underline"
                  >
                    参加キャラクターを追加 →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
                    <p className="text-xs text-coc-muted mb-3">判定する技能</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          list="ops-skill-list"
                          value={skillName}
                          onChange={(e) => setSkillName(e.target.value)}
                          placeholder="技能名を入力または選択..."
                          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
                        />
                        <datalist id="ops-skill-list">
                          {allSkillNames.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </div>
                      <button
                        onClick={rollAll}
                        disabled={!skillName.trim() || rolling}
                        className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Dices size={16} />
                        全員ロール
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-coc-muted mb-4">
                    参加者: {participants.length}名
                  </p>

                  {rollResults.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                        判定結果 — {lastSkill}
                      </p>
                      {DEGREE_ORDER.map((degree) => {
                        const group = rollResults.filter(
                          (r) => r.degree === degree
                        );
                        if (group.length === 0) return null;
                        const style = DEGREE_STYLE[degree];
                        return (
                          <div
                            key={degree}
                            className={`rounded-xl border ${style.border} ${style.bg} px-5 py-4`}
                          >
                            <p
                              className={`text-xs font-semibold ${style.text} mb-3`}
                            >
                              {degree}（{group.length}名）
                            </p>
                            <div className="flex flex-col gap-2">
                              {group.map((r) => (
                                <div
                                  key={r.characterId}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-coc-text font-medium">
                                    {r.characterName}
                                  </span>
                                  <div className="flex items-center gap-3 text-xs text-coc-muted">
                                    <span>技能値: {r.skillValue}</span>
                                    <span
                                      className={`font-bold tabular-nums ${style.text}`}
                                    >
                                      出目: {r.rollValue}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
