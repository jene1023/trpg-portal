"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { supabase, isSupabaseConfigured, PartyTemplateMember } from "@/lib/supabase";

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

const ROLE_OPTIONS = ["探索者", "KP助手", "サブKP", "ゲスト", "その他"];

export default function PartyTemplateCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<PartyTemplateMember[]>([]);
  const [memberCharId, setMemberCharId] = useState("");
  const [memberRole, setMemberRole] = useState("探索者");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addMember() {
    if (!memberCharId.trim()) return;
    setMembers((prev) => [...prev, { character_id: memberCharId.trim(), role: memberRole }]);
    setMemberCharId("");
    setMemberRole("探索者");
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!isSupabaseConfigured || !name.trim()) return;
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("party_templates").insert({
      name: name.trim(),
      description: description.trim() || null,
      members,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setName("");
    setDescription("");
    setMembers([]);
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-coc-border bg-coc-surface px-5 py-4 w-full text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
      >
        <Plus size={16} />
        新しいテンプレートを作成
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-coc-border bg-coc-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-sm font-semibold text-coc-text">新しいテンプレート</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-coc-faint hover:text-coc-text transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div>
        <label className={labelClass}>テンプレート名 *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: レギュラーメンバー卓"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>説明（任意）</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: 毎月第一土曜日の固定メンバー"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>メンバー</label>
        <div className="flex gap-2 mb-2">
          <input
            value={memberCharId}
            onChange={(e) => setMemberCharId(e.target.value)}
            placeholder="キャラクターID"
            className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
          />
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addMember}
            disabled={!memberCharId.trim()}
            className="flex items-center gap-1 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
          </button>
        </div>

        {members.length > 0 && (
          <ul className="space-y-1.5">
            {members.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-xs text-coc-text"
              >
                <span>
                  <span className="font-mono text-coc-muted">{m.character_id}</span>
                  <span className="ml-2 text-coc-gold">[{m.role}]</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeMember(i)}
                  className="text-coc-faint hover:text-red-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving || !name.trim()}
        className="rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2.5 disabled:opacity-50 hover:brightness-110 transition-all"
      >
        {saving ? "保存中…" : "テンプレートを保存"}
      </button>
    </div>
  );
}
