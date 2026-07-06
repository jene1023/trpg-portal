"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, AttendanceStatus } from "@/lib/supabase";

type Props = {
  participantId: string;
  initialStatus: AttendanceStatus;
};

const OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  {
    value: "attending",
    label: "参加",
    activeClass: "bg-green-950/40 border-green-800 text-green-400",
  },
  {
    value: "absent",
    label: "欠席",
    activeClass: "bg-red-950/40 border-red-900 text-red-400",
  },
  {
    value: "unconfirmed",
    label: "未定",
    activeClass: "bg-coc-raised border-coc-border text-coc-muted",
  },
];

export default function AttendanceToggle({ participantId, initialStatus }: Props) {
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus ?? "unconfirmed");
  const [updating, setUpdating] = useState(false);

  async function handleChange(newStatus: AttendanceStatus) {
    if (!isSupabaseConfigured || updating || newStatus === status) return;
    setUpdating(true);
    const { error } = await supabase
      .from("scenario_participants")
      .update({ attendance_status: newStatus })
      .eq("id", participantId);
    if (!error) setStatus(newStatus);
    setUpdating(false);
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-coc-muted mr-0.5">出欠:</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          disabled={updating}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all disabled:opacity-50 ${
            status === opt.value
              ? opt.activeClass
              : "border-coc-border/60 text-coc-faint hover:border-coc-gold hover:text-coc-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
