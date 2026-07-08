"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { supabase, isSupabaseConfigured, Npc, Scenario } from "@/lib/supabase";

const FACTION_COLORS = [
  "#c9a96e",
  "#7eb8f7",
  "#f87171",
  "#34d399",
  "#a78bfa",
  "#fb923c",
  "#f472b6",
  "#94a3b8",
];

function getFactionColor(faction: string | null, factionList: string[]): string {
  if (!faction) return "#4b5563";
  const idx = factionList.indexOf(faction);
  return FACTION_COLORS[idx % FACTION_COLORS.length];
}

const CARD_W = 144;
const CARD_H = 76;
const GAP_X = 40;
const GAP_Y = 60;
const PADDING = 32;

type NpcWithPos = Npc & { x: number; y: number };

function arrangeNpcs(npcs: Npc[]): NpcWithPos[] {
  const factions = [...new Set(npcs.map((n) => n.faction ?? "__none__"))];
  const groups: Npc[][] = factions.map((f) =>
    npcs.filter((n) => (n.faction ?? "__none__") === f)
  );

  const positioned: NpcWithPos[] = [];
  let groupX = PADDING;

  for (const group of groups) {
    const cols = Math.ceil(Math.sqrt(group.length));
    group.forEach((npc, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positioned.push({
        ...npc,
        x: groupX + col * (CARD_W + GAP_X),
        y: PADDING + row * (CARD_H + GAP_Y),
      });
    });
    const maxCol = Math.min(group.length, cols);
    groupX += maxCol * (CARD_W + GAP_X) + GAP_X * 2;
  }

  return positioned;
}

export default function NpcMapPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [npcs, setNpcs] = useState<NpcWithPos[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      const { data: scenarioData } = await supabase
        .from("scenarios")
        .select("*")
        .eq("id", scenarioId)
        .single();

      if (!scenarioData) {
        setLoading(false);
        return;
      }
      setScenario(scenarioData);

      const { data: npcData } = await supabase
        .from("npcs")
        .select("*")
        .eq("scenario_name", scenarioData.title);

      setNpcs(arrangeNpcs(npcData ?? []));
      setLoading(false);
    }
    fetchData();
  }, [scenarioId]);

  const factions = [...new Set(npcs.map((n) => n.faction).filter(Boolean) as string[])];

  const mapWidth = Math.max(
    640,
    npcs.reduce((m, n) => Math.max(m, n.x + CARD_W + PADDING), 0)
  );
  const mapHeight = Math.max(
    320,
    npcs.reduce((m, n) => Math.max(m, n.y + CARD_H + PADDING), 0)
  );

  const factionGroups = factions.map((faction) => ({
    faction,
    color: getFactionColor(faction, factions),
    members: npcs.filter((n) => n.faction === faction),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオに戻る
        </Link>
      </div>

      <div className="mb-5">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">NPC相関マップ</h1>
        {scenario && (
          <p className="text-sm text-coc-muted mt-1">{scenario.title}</p>
        )}
      </div>

      {factions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {factionGroups.map(({ faction, color }) => (
            <div key={faction} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-coc-muted">{faction}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4b5563" }} />
            <span className="text-xs text-coc-muted">陣営なし</span>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-coc-muted">読み込み中...</p>
      ) : npcs.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
          <Users size={32} className="text-coc-muted mx-auto mb-3" />
          <p className="text-sm text-coc-muted mb-3">NPCが登録されていません</p>
          <Link
            href={`/scenarios/${scenarioId}/npcs`}
            className="text-xs text-coc-gold hover:underline"
          >
            NPCを登録する →
          </Link>
        </div>
      ) : (
        <div
          className="relative rounded-xl border border-coc-border bg-coc-surface overflow-auto"
          style={{ maxHeight: 560 }}
        >
          <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
            <svg
              className="absolute inset-0 pointer-events-none"
              width={mapWidth}
              height={mapHeight}
            >
              {factionGroups.map(({ faction, color, members }) =>
                members.slice(0, -1).map((npc, i) => {
                  const next = members[i + 1];
                  return (
                    <line
                      key={`${faction}-${i}`}
                      x1={npc.x + CARD_W / 2}
                      y1={npc.y + CARD_H / 2}
                      x2={next.x + CARD_W / 2}
                      y2={next.y + CARD_H / 2}
                      stroke={color}
                      strokeWidth={2}
                      strokeOpacity={0.45}
                      strokeDasharray="6 3"
                    />
                  );
                })
              )}
            </svg>

            {npcs.map((npc) => {
              const color = getFactionColor(npc.faction, factions);
              const isHovered = hoveredId === npc.id;
              const hasTooltip = !!(npc.purpose || npc.faction || npc.notes);

              return (
                <div
                  key={npc.id}
                  className="absolute rounded-lg border px-3 py-2 cursor-default select-none"
                  style={{
                    left: npc.x,
                    top: npc.y,
                    width: CARD_W,
                    height: CARD_H,
                    backgroundColor: "var(--coc-raised, #1a1a1a)",
                    borderColor: color,
                    boxShadow: isHovered ? `0 0 0 2px ${color}40` : undefined,
                    zIndex: isHovered ? 10 : 1,
                  }}
                  onMouseEnter={() => setHoveredId(npc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <p className="text-xs font-semibold text-coc-text truncate leading-tight">
                    {npc.name}
                  </p>
                  {npc.faction && (
                    <p className="text-xs mt-0.5 truncate leading-tight" style={{ color }}>
                      {npc.faction}
                    </p>
                  )}

                  {isHovered && hasTooltip && (
                    <div
                      className="absolute left-0 rounded-lg border border-coc-border shadow-lg px-3 py-2 text-xs"
                      style={{
                        top: CARD_H + 6,
                        minWidth: 180,
                        maxWidth: 260,
                        backgroundColor: "var(--coc-bg, #111)",
                        zIndex: 20,
                      }}
                    >
                      {npc.purpose && (
                        <p className="text-coc-text mb-1">
                          <span className="text-coc-muted">目的: </span>
                          {npc.purpose}
                        </p>
                      )}
                      {npc.faction && (
                        <p className="text-coc-text mb-1">
                          <span className="text-coc-muted">陣営: </span>
                          {npc.faction}
                        </p>
                      )}
                      {npc.notes && (
                        <p className="text-coc-muted line-clamp-3">{npc.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-coc-muted">
        同じ陣営のNPCを点線で結んでいます。カードにカーソルを合わせると詳細が表示されます。
      </p>
    </div>
  );
}
