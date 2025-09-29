"use client";

import { ChevronRight } from "lucide-react";

export type HistoryItem = {
  id: string;
  name: string;
  date: string; // ISO
  retirementAge?: number; // “Data de aposentadoria” no Figma
  version: number;
  kind?: "original" | "whatif" | "legacy";
};

type Props = {
  items: HistoryItem[];
  onOpen?: (id: string) => void;
};

export default function HistoryList({ items, onOpen }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[rgb(var(--muted))]">
          Histórico de simulações
        </span>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 rounded-xl p-3 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{
                    background:
                      it.kind === "original"
                        ? "linear-gradient(135deg, #60a5fa, #8b5cf6)"
                        : it.kind === "whatif"
                        ? "linear-gradient(135deg, #22d3ee, #34d399)"
                        : "linear-gradient(135deg, #d1d5db, #6b7280)",
                  }}
                />
                <span className="font-medium">{it.name}</span>
              </div>
              <div className="text-xs text-[rgb(var(--muted))] mt-1">
                {new Date(it.date).toLocaleDateString()} • Versão {it.version}
                {typeof it.retirementAge === "number" && (
                  <> • Aposentadoria: {it.retirementAge}</>
                )}
              </div>
            </div>

            <button className="btn" onClick={() => onOpen?.(it.id)}>
              Ver no gráfico <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
