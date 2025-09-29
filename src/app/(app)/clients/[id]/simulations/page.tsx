// src/app/(app)/clients/[id]/simulations/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useSimulationsOfClient, useSimulationVersions, useCreateSimulation, Simulation } from "@/hooks/useSimulations";
import { cn } from "@/lib/utils";

export default function ClientSimulationsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id!;
  const { data: sims, isLoading } = useSimulationsOfClient(clientId);

  const [selected, setSelected] = useState<Simulation | null>(null);

  const { data: versions } = useSimulationVersions(selected?.id ?? null);

  // form novo
  const [name, setName] = useState("");
  const [ratePct, setRatePct] = useState(4); // em %

  const create = useCreateSimulation();

  const orderedSims = useMemo(
    () => (sims ?? []).slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [sims]
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho + form de criação */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-[rgb(var(--muted))]">Simulações do cliente</div>
            <div className="text-2xl font-semibold">Simulações</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              className="h-9 px-3 w-[220px] rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40"
              placeholder="Nome da simulação"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="number"
              step={0.1}
              className="h-9 px-3 w-[140px] rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40"
              value={ratePct}
              onChange={(e) => setRatePct(Number(e.target.value))}
              placeholder="Taxa real (%)"
            />
            <button
              className={cn("btn btn-primary", create.isPending && "opacity-70 cursor-wait")}
              onClick={() =>
                name &&
                create.mutate({
                  clientId,
                  name,
                  baseRateReal: ratePct / 100, // envia em fração
                }, {
                  onSuccess: (s) => {
                    setName("");
                    setRatePct(4);
                    setSelected(s);
                  }
                })
              }
              disabled={!name || create.isPending}
            >
              {create.isPending ? "Criando..." : "Criar simulação"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de simulações */}
      <div className="card p-4">
        {isLoading ? (
          <div className="text-sm text-[rgb(var(--muted))]">Carregando…</div>
        ) : orderedSims.length === 0 ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhuma simulação ainda. Use o formulário acima para criar a primeira.
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-4">
            {/* Tabela simples */}
            <div className="rounded-xl border border-[rgb(var(--stroke))]/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-3 py-2">Nome</th>
                    <th className="text-right px-3 py-2">Taxa real</th>
                    <th className="text-right px-3 py-2">Criada em</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {orderedSims.map((s) => (
                    <tr
                      key={s.id}
                      className={cn(
                        "border-t border-[rgb(var(--stroke))]/20 hover:bg-white/5 cursor-pointer",
                        selected?.id === s.id && "bg-white/7"
                      )}
                      onClick={() => setSelected(s)}
                    >
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2 text-right">
                        {(s.baseRateReal * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href={`/clients/${clientId}/projection`}
                          className="btn h-8"
                          onClick={(e) => {
                            // opcional: guardar sim ativa/localStorage se você quiser usar depois
                            localStorage.setItem("activeSimulationId", s.id);
                          }}
                        >
                          Ir para projeção
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Painel lateral de versões */}
            <div className="rounded-xl border border-[rgb(var(--stroke))]/40 p-3 bg-[rgb(var(--panel-2))]">
              <div className="text-sm text-[rgb(var(--muted))] mb-2">Versões</div>
              {!selected ? (
                <div className="text-sm text-[rgb(var(--muted))]">Selecione uma simulação.</div>
              ) : !versions || versions.length === 0 ? (
                <div className="text-sm text-[rgb(var(--muted))]">Sem versões ainda.</div>
              ) : (
                <ul className="space-y-2">
                  {versions
                    .slice()
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                      <li
                        key={v.id}
                        className="rounded-lg px-3 py-2 bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Projeção {v.version}</div>
                          {v.isCurrentSnapshot && (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                              corrente
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[rgb(var(--muted))] mt-1">
                          {new Date(v.createdAt).toLocaleString("pt-BR")} • {v.lifeStatus}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
              {/* Aqui você pode adicionar ações: "Criar versão", "Marcar como corrente", etc. */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
