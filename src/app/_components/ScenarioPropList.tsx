"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, ScenarioProp } from "@/lib/supabase";
import { Package, Plus, Trash2 } from "lucide-react";

type Props = {
  scenarioId: string;
  initialProps: ScenarioProp[];
};

export default function ScenarioPropList({ scenarioId, initialProps }: Props) {
  const [props, setProps] = useState<ScenarioProp[]>(initialProps);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [acquisitionCondition, setAcquisitionCondition] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function addProp() {
    if (!name.trim() || !isSupabaseConfigured) return;
    setAdding(true);
    const { data, error } = await supabase
      .from("scenario_props")
      .insert({
        scenario_id: scenarioId,
        name: name.trim(),
        description: description.trim() || null,
        acquisition_condition: acquisitionCondition.trim() || null,
        is_distributed: false,
      })
      .select()
      .single();
    if (!error && data) {
      setProps((prev) => [...prev, data as ScenarioProp]);
      setName("");
      setDescription("");
      setAcquisitionCondition("");
      setShowForm(false);
    }
    setAdding(false);
  }

  async function toggleDistributed(prop: ScenarioProp) {
    if (!isSupabaseConfigured) return;
    const newVal = !prop.is_distributed;
    const { error } = await supabase
      .from("scenario_props")
      .update({ is_distributed: newVal })
      .eq("id", prop.id);
    if (!error) {
      setProps((prev) =>
        prev.map((p) => (p.id === prop.id ? { ...p, is_distributed: newVal } : p))
      );
    }
  }

  async function deleteProp(id: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("scenario_props")
      .delete()
      .eq("id", id);
    if (!error) {
      setProps((prev) => prev.filter((p) => p.id !== id));
    }
  }

  const undistributed = props.filter((p) => !p.is_distributed);
  const distributed = props.filter((p) => p.is_distributed);

  return (
    <div>
      {props.length > 0 && (
        <div className="flex items-center gap-3 mb-4 text-sm">
          <span className="text-coc-text font-medium">{props.length}件</span>
          {undistributed.length > 0 && (
            <span className="rounded-full border border-yellow-700 bg-yellow-950/30 px-2 py-0.5 text-xs text-yellow-300">
              未配布 {undistributed.length}件
            </span>
          )}
          {distributed.length > 0 && (
            <span className="rounded-full border border-green-800 bg-green-950/30 px-2 py-0.5 text-xs text-green-300">
              配布済み {distributed.length}件
            </span>
          )}
        </div>
      )}

      <ul className="space-y-3 mb-4">
        {props.map((prop) => (
          <li
            key={prop.id}
            className={`rounded-xl border bg-coc-surface px-4 py-3 ${
              prop.is_distributed ? "border-green-800/50 opacity-70" : "border-coc-border"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Package size={14} className="text-coc-gold flex-shrink-0" />
                  <span
                    className={`font-semibold text-sm ${
                      prop.is_distributed ? "line-through text-coc-muted" : "text-coc-text"
                    }`}
                  >
                    {prop.name}
                  </span>
                  {prop.is_distributed && (
                    <span className="rounded-full border border-green-800 bg-green-950/40 px-1.5 py-0.5 text-xs text-green-300">
                      配布済み
                    </span>
                  )}
                </div>
                {prop.description && (
                  <p className="text-xs text-coc-muted mt-1 ml-5">{prop.description}</p>
                )}
                {prop.acquisition_condition && (
                  <p className="text-xs text-coc-muted mt-0.5 ml-5">
                    <span className="text-coc-gold/70">入手条件: </span>
                    {prop.acquisition_condition}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleDistributed(prop)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    prop.is_distributed
                      ? "border-coc-border text-coc-muted hover:border-yellow-700 hover:text-yellow-300"
                      : "border-green-800 text-green-300 hover:bg-green-950/40"
                  }`}
                >
                  {prop.is_distributed ? "未配布に戻す" : "配布済み"}
                </button>
                <button
                  onClick={() => deleteProp(prop.id)}
                  className="text-coc-muted hover:text-red-400 transition-colors"
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
        {props.length === 0 && (
          <li className="text-sm text-coc-muted py-2">
            物証・道具がまだ登録されていません
          </li>
        )}
      </ul>

      {showForm ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-4 py-4 space-y-3">
          <h3 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            物証・道具を追加
          </h3>
          <div>
            <label className="block text-xs text-coc-muted mb-1">名前 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 血染めの日記"
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="物証の説明・見た目など"
              rows={2}
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">入手条件</label>
            <input
              type="text"
              value={acquisitionCondition}
              onChange={(e) => setAcquisitionCondition(e.target.value)}
              placeholder="例: 図書館で調査成功時"
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addProp}
              disabled={!name.trim() || adding}
              className="flex-1 rounded-lg bg-coc-gold/20 border border-coc-gold px-4 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-40"
            >
              {adding ? "追加中..." : "追加"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setName("");
                setDescription("");
                setAcquisitionCondition("");
              }}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-text transition-colors w-full"
        >
          <Plus size={16} />
          物証・道具を追加
        </button>
      )}
    </div>
  );
}
