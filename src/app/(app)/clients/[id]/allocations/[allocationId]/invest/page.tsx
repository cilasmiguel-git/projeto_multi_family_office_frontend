// src/app/clients/[id]/allocations/[allocationId]/invest/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import { useAllocationHistory, useAppendAllocationRecord } from "@/hooks/useAllocations";
import { cn } from "@/lib/utils";

type AllocationDTO = {
  id: string;
  name: string;
  type: "REAL_ESTATE" | "FINANCIAL";
  createdAt: string;
  updatedAt: string;
};

export default function AllocationInvestPage() {
  const { id: clientId, allocationId } = useParams<{ id: string; allocationId: string }>();

  // pegar dados básicos da alocação (pra exibir nome no topo)
  const { data: allocation } = useQuery({
    queryKey: ["allocation", allocationId],
    queryFn: async () => {
      const { data } = await api.get<AllocationDTO>(routes.allocations.byId(allocationId));
      return data;
    },
    enabled: !!allocationId,
    staleTime: 30_000,
  });

  // histórico dessa alocação
  const { data: records = [], isFetching } = useAllocationHistory(allocationId);

  // formulário de lançamento
  const appendRec = useAppendAllocationRecord();
  const [recDate, setRecDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [recValue, setRecValue] = useState<string>("");

  const canSubmit = useMemo(
    () => !!allocationId && recValue !== "" && !appendRec.isPending,
    [allocationId, recValue, appendRec.isPending]
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    appendRec.mutate(
      {
        allocationId,
        date: recDate,
        value: Number(recValue),
      },
      {
        onSuccess: () => {
          setRecValue("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-[rgb(var(--muted))]">Cliente</div>
            <div className="text-2xl font-semibold">
              Investir {allocation?.name ? `— ${allocation.name}` : ""}
            </div>
            <div className="text-xs text-[rgb(var(--muted))] mt-1">
              <Link
                href={`/clients/${clientId}/allocations`}
                className="underline hover:opacity-80"
              >
                Voltar para Alocações
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de lançamento */}
      <div className="card p-4">
        <div className="text-sm text-[rgb(var(--muted))] mb-2">Novo lançamento</div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            className="h-9 px-3 w-[150px] rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40"
            value={recDate}
            onChange={(e) => setRecDate(e.target.value)}
          />

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            className="h-9 px-3 w-[200px] rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40"
            placeholder="Valor (R$)"
            value={recValue}
            onChange={(e) => setRecValue(e.target.value)}
          />

          <button
            className={cn("btn btn-primary", appendRec.isPending && "opacity-70 cursor-wait")}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {appendRec.isPending ? "Lançando..." : "Lançar"}
          </button>
        </div>
      </div>

      {/* Histórico da alocação */}
      <div className="card p-4">
        <div className="text-sm text-[rgb(var(--muted))] mb-2">
          Histórico de alocação
        </div>

        <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
          {isFetching && records.length === 0 ? (
            <li className="text-sm text-[rgb(var(--muted))]">Carregando…</li>
          ) : records.length === 0 ? (
            <li className="text-sm text-[rgb(var(--muted))]">Sem lançamentos.</li>
          ) : (
            records.map((r) => (
              <li
                key={r.id}
                className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div className="text-xs text-[rgb(var(--muted))]">
                  {new Date(r.date).toLocaleDateString("pt-BR")}
                </div>
                <div className="text-sm font-medium">
                  {Number(r.value).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
