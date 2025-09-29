"use client";

import { MoreHorizontal, Pencil, RefreshCw } from "lucide-react";
import { useAppendAllocationRecord } from "../hooks/useAllocations";
import { cn } from "../lib/utils";

export type Allocation = {
  id: string;
  name: string;
  kind: "FINANCIAL" | "REAL_ESTATE";
  financed?: boolean;
  lastValue: number;
  lastUpdate: string; // ISO
  startDate?: string;
  installments?: number;
  progressPct?: number; // 0..100
};

type Props = {
  data: Allocation[];
  onEdit?: (id: string) => void;
  onMore?: (id: string) => void;
};

export default function AllocationsTimeline({ data, onEdit, onMore }: Props) {
  const append = useAppendAllocationRecord();

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm text-[rgb(var(--muted))]">Timeline de alocações manuais</h3>
        <button className="btn btn-primary">+ Adicionar</button>
      </div>

      <div className="space-y-3">
        {data.map((a) => (
          <div key={a.id} className="border border-[rgb(var(--stroke))]/40 rounded-xl p-3 bg-[rgb(var(--panel-2))]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.name}</span>
                  <span className={cn("badge", a.kind === "FINANCIAL" ? "badge-good" : "badge-soft")}>
                    {a.kind === "FINANCIAL" ? "Financeira" : "Imobilizado"}
                  </span>
                  {a.financed && <span className="badge badge-soft">Financiado</span>}
                </div>

                {typeof a.progressPct === "number" && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-white/40" style={{ width: `${a.progressPct}%` }} />
                    </div>
                  </div>
                )}

                <div className="text-xs text-[rgb(var(--muted))] mt-2">
                  {a.startDate && <>Início: {new Date(a.startDate).toLocaleDateString()} • </>}
                  Última atualização: {new Date(a.lastUpdate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="btn"
                  onClick={() => onEdit?.(a.id)}
                  aria-label="Editar"
                  title="Editar"
                >
                  <Pencil size={16} />
                  Atualizar
                </button>

                <button
                  className="btn"
                  onClick={() =>
                    append.mutate({
                      allocationId: a.id,
                      date: new Date().toISOString(),
                      value: a.lastValue,
                    })
                  }
                  aria-label="Novo registro hoje"
                  title="Novo registro hoje"
                >
                  <RefreshCw size={16} />
                </button>

                <button className="btn" onClick={() => onMore?.(a.id)} aria-label="Mais">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            <div className="mt-2 text-right font-semibold">
              R$ {a.lastValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
