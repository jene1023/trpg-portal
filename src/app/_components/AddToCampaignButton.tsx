"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { supabase, isSupabaseConfigured, Campaign } from "@/lib/supabase";

type Props = { scenarioId: string };

export default function AddToCampaignButton({ scenarioId }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !open) return;
    async function load() {
      const [{ data: cs }, { data: links }] = await Promise.all([
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("campaign_scenarios").select("campaign_id").eq("scenario_id", scenarioId),
      ]);
      if (cs) {
        setCampaigns(cs as Campaign[]);
        if (cs.length > 0) setSelected(cs[0].id);
      }
      if (links) setLinkedIds(new Set(links.map((l) => l.campaign_id)));
    }
    load();
  }, [open, scenarioId]);

  async function handleAdd() {
    if (!isSupabaseConfigured || !selected) return;
    setSaving(true);
    const maxRes = await supabase
      .from("campaign_scenarios")
      .select("order_index")
      .eq("campaign_id", selected)
      .order("order_index", { ascending: false })
      .limit(1);
    const nextIndex = ((maxRes.data?.[0]?.order_index as number | undefined) ?? -1) + 1;
    await supabase.from("campaign_scenarios").insert({
      campaign_id: selected,
      scenario_id: scenarioId,
      order_index: nextIndex,
    });
    setLinkedIds((prev) => new Set([...prev, selected]));
    setDone(true);
    setSaving(false);
    setTimeout(() => {
      setDone(false);
      setOpen(false);
    }, 1500);
  }

  const available = campaigns.filter((c) => !linkedIds.has(c.id));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
      >
        <BookOpen size={14} />
        キャンペーンに追加
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-10 w-72 rounded-xl border border-coc-border bg-coc-surface shadow-lg px-4 py-3">
          {done ? (
            <p className="text-sm text-green-400 text-center py-2">✓ 追加しました</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-coc-muted text-center py-2">
              {campaigns.length === 0
                ? "キャンペーンが登録されていません"
                : "すべてのキャンペーンに追加済みです"}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-coc-muted">追加先キャンペーン</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
              >
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
                >
                  {saving ? "追加中…" : "追加"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
