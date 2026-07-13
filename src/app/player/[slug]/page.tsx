export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase, isSupabaseConfigured, CharacterStatus } from "@/lib/supabase";
import StatusBadge from "@/app/_components/StatusBadge";

type Props = { params: Promise<{ slug: string }> };

export default async function PlayerPortfolioPage({ params }: Props) {
  const { slug } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, name, occupation, status, portrait_url, public_slug, created_at")
    .eq("is_public", true)
    .eq("player_name", slug)
    .order("created_at", { ascending: false });

  if (!characters || characters.length === 0) notFound();

  const total = characters.length;
  const alive = characters.filter((c) => c.status === "alive").length;

  return (
    <div className="min-h-screen coc-bg py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-widest text-coc-muted font-cinzel">
            Player Portfolio
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-coc-gold tracking-wide">
            {slug}
          </h1>
          <p className="text-sm text-coc-muted">
            {total}体のキャラクター&ensp;/&ensp;生存中 {alive}体
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <CharacterCard key={char.id} char={char} />
          ))}
        </div>
      </div>
    </div>
  );
}

type CardChar = {
  id: string;
  name: string;
  occupation: string | null;
  status: CharacterStatus;
  portrait_url: string | null;
  public_slug: string | null;
  created_at: string;
};

function CharacterCard({ char }: { char: CardChar }) {
  const href = char.public_slug ? `/c/${char.public_slug}` : `/characters/${char.id}`;

  return (
    <Link
      href={href}
      className="group block rounded-lg border border-coc-border coc-card-bg overflow-hidden hover:border-coc-gold/50 transition-colors"
    >
      <div className="relative h-40 bg-coc-surface flex items-center justify-center">
        {char.portrait_url ? (
          <Image
            src={char.portrait_url}
            alt={char.name}
            fill
            className="object-cover object-top"
          />
        ) : (
          <span className="text-4xl opacity-20 select-none">👤</span>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={char.status} />
        </div>
      </div>
      <div className="p-3 space-y-0.5">
        <p className="font-cinzel text-sm font-bold text-coc-text group-hover:text-coc-gold transition-colors truncate">
          {char.name}
        </p>
        {char.occupation && (
          <p className="text-xs text-coc-muted truncate">{char.occupation}</p>
        )}
      </div>
    </Link>
  );
}
