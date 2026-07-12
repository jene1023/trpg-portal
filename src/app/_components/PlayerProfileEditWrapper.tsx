"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabase, isSupabaseConfigured, PlayerProfile } from "@/lib/supabase";
import PlayerProfileForm from "./PlayerProfileForm";
import Link from "next/link";

export default function PlayerProfileEditWrapper() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("player_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile((data as PlayerProfile | null) ?? null);
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-sm text-coc-muted">読み込み中...</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-coc-muted">
        プロフィールを編集するには
        <Link href="/login" className="ml-1 text-coc-gold hover:underline">
          ログイン
        </Link>
        が必要です。
      </p>
    );
  }

  return <PlayerProfileForm userId={user.id} profile={profile} />;
}
