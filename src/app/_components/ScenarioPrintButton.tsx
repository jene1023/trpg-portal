"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

type Props = {
  scenarioId: string;
};

export default function ScenarioPrintButton({ scenarioId }: Props) {
  return (
    <Link
      href={`/scenarios/${scenarioId}/print`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
    >
      <Printer size={14} />
      印刷/PDF
    </Link>
  );
}
