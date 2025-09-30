// src/components/HistoryList.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock3, GitBranch, ChevronRight } from "lucide-react";

export type HistoryItem = {
  id: string;
  name: string;                  // ex: "Projeção 3"
  date: string;                  // ISO
  version: number;               // número da versão
  kind: "legacy" | "original" | "whatif";
  retirementAge?: number;        // opcional
};

type Props = {
  items: HistoryItem[];
  className?: string;
  onOpen?: (id: string) => void;
};

const KIND_BADGE: Record<
  HistoryItem["kind"],
  { label: string; cls: string }
> = {
  legacy:   { label: "legado",   cls: "bg-amber-400/15 text-amber-300 border-amber-300/20" },
  original: { label: "original", cls: "bg-emerald-400/15 text-emerald-300 border-emerald-300/20" },
  whatif:   { label: "corrente", cls: "bg-cyan-400/15 text-cyan-300 border-cyan-300/20" },
};

export default function HistoryList({ items, className, onOpen }: Props) {
  const ordered = React.useMemo(
    () =>
      [...items].sort(
        (a, b) => +new Date(b.date) - +new Date(a.date)
      ),
    [items]
  );

  return (
    <div className={cn("card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
          <GitBranch className="h-4 w-4 opacity-80" />
          Histórico de projeções
        </div>
      </div>

      {ordered.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {ordered.map((it) => (
            <li
              key={it.id}
              className="
                group rounded-xl border border-[rgb(var(--stroke))]/40
                bg-[rgb(var(--panel-2))] p-3 hover:border-[rgb(var(--stroke))]/70
                transition
              "
            >
              <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                {/* bolota com versão */}
                <div
                  className="
                    h-8 w-8 rounded-full bg-white/5 border border-white/10
                    flex items-center justify-center text-sm font-semibold
                  "
                >
                  {it.version}
                </div>

                {/* título + meta */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{it.name}</div>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        KIND_BADGE[it.kind].cls
                      )}
                    >
                      {KIND_BADGE[it.kind].label}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgb(var(--muted))]">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 opacity-70" />
                      {formatDateTime(it.date)}
                    </span>
                    {typeof it.retirementAge === "number" && (
                      <span>Idade na aposentadoria: {it.retirementAge} anos</span>
                    )}
                  </div>
                </div>

                {/* ação */}
                <button
                  className="
                    btn h-8 px-3 gap-1
                    bg-white/5 hover:bg-white/10 border border-white/10
                  "
                  onClick={() => onOpen?.(it.id)}
                >
                  Abrir
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[rgb(var(--stroke))]/40 p-6 text-center">
      <div className="text-sm text-[rgb(var(--muted))]">
        Nenhuma versão ainda. Gere uma projeção para começar.
      </div>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  // data + hora local pt-BR
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
