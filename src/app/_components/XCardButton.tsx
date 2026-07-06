"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
};

export default function XCardButton({ scenarioId }: Props) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`x-card-${scenarioId}`)
      .on("broadcast", { event: "x_card" }, () => {
        setShowOverlay(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scenarioId]);

  const handleXCard = async () => {
    if (!isSupabaseConfigured) {
      setShowOverlay(true);
      return;
    }
    await supabase.channel(`x-card-${scenarioId}`).send({
      type: "broadcast",
      event: "x_card",
      payload: {},
    });
    setShowOverlay(true);
  };

  return (
    <>
      <button
        onClick={handleXCard}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-red-600 bg-red-950/30 px-5 py-4 text-red-400 font-bold text-lg hover:bg-red-900/40 transition-colors"
      >
        <X size={24} />
        X — シーンを中断する
      </button>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-700 animate-pulse">
          <div className="text-white text-center px-8">
            <X size={64} className="mx-auto mb-6" />
            <p className="text-4xl font-bold mb-4">シーンを一時中断します</p>
            <p className="text-lg opacity-90 mb-8">
              X-Card が使われました。<br />
              全員で立ち止まり、安全を確認してください。
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="rounded-lg border-2 border-white bg-white/20 px-8 py-3 text-white font-bold text-lg hover:bg-white/30 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
