"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, PartyTemplate, PartyTemplateMember } from "@/lib/supabase";

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

const ROLE_OPTIONS = ["探索者", "KP助手", "サブKP", "ゲスト", "その他"];

type Props = { template: PartyTemplate };

export default function PartyTemplateEditor({ template }: Props) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [members, setMembers] = useState<PartyTemplateMember[]>(template.members);
  const [memberCharId, setMemberCharId] = useState("");
  const [memberRole, setMemberRole] = useState("探索者");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function addMember() {
    if (!memberCharId.trim()) return;
    setMembers((prev) => [...prev, { character_id: memberCharId.trim(), role: memberRole }]);
    setMemberCharId("");
    setMemberRole("探索者");
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!isSupabaseConfigured || !name.trim()) return;
    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from("party_templates")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        members,
      })
      .eq("id", template.id);

    if (err) {
      setError(err.message);
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!isSupabaseConfigured) return;
    setDeleting(true);
    await supabase.from("party_templates").delete().eq("id", template.id);
    router.push("/kp/party-templates");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-coc-border bg-coc-surface p-5 space-y-4">
        <h2 className="font-cinzel text-sm font-semibold text-coc-text">テンプレート編集</h2>

        <div>
          <label className={labelClass}>テンプレート名 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>説明（任意）</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="このテンプレートの用途や概要"
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

          {members.length === 0 ? (
            <p className="text-xs text-coc-faint py-2">メンバーがいません</p>
          ) : (
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
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2.5 disabled:opacity-50 hover:brightness-110 transition-all"
        >
          <Save size={14} />
          {saving ? "保存中…" : "変更を保存"}
        </button>
      </div>

      <div className="rounded-xl border border-red-900/40 bg-coc-surface px-5 py-4">
        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">
          危険な操作
        </h3>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-lg border border-red-700 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
            このテンプレートを削除
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-coc-text">
              本当に削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deleting ? "削除中…" : "削除する"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
