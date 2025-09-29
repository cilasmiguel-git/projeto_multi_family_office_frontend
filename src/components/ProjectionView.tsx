"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, Legend,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import ClientCombo, { ClientOption } from "./ClientCombo";
import { useRunProjection } from "@/hooks/useProjections";
import { useSimulationsOfClient } from "@/hooks/useSimulations";

type LifeStatus = "ALIVE" | "DEAD" | "INVALID";

export default function ProjectionView({
  presetClient,
}: { presetClient: ClientOption | null }) {
  const [client, setClient] = useState<ClientOption | null>(presetClient ?? null);
  const [rate, setRate] = useState(4);
  const [life, setLife] = useState<LifeStatus>("ALIVE");

  // carrega simulações do cliente selecionado
  const { data: sims } = useSimulationsOfClient(client?.id ?? undefined);
  const activeSim = useMemo(() => sims?.[0] ?? null, [sims]); // mais recente

  const run = useRunProjection();
  const points = run.data?.points ?? [];

  const kpiTotal = points.at(-1)?.totalAssets ?? 0;

  // se veio cliente na URL, opcionalmente já roda ao entrar:
  useEffect(() => {
    if (client && activeSim && !run.isPending && !run.data) {
      run.mutate({
        simulationId: activeSim.id,
        lifeStatus: life,
        baseRateReal: rate / 100,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, activeSim]);

  return (
    <div className="card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 justify-between">
        <ClientCombo value={client} onChange={setClient} />
        <div className="flex items-center gap-2">
          <select
            className="h-9 px-3 rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40 w-[140px]"
            value={life}
            onChange={(e) => setLife(e.target.value as LifeStatus)}
          >
            <option value="ALIVE">Vivo</option>
            <option value="DEAD">Falecido</option>
            <option value="INVALID">Inválido</option>
          </select>
          <input
            type="number"
            className="h-9 px-3 w-[120px] rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40"
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            placeholder="Taxa real (%)"
          />
          <button
            className="btn btn-primary"
            disabled={!client || !activeSim || run.isPending}
            onClick={() =>
              client &&
              activeSim &&
              run.mutate({
                simulationId: activeSim.id, // ⚠️ usa a simulação, não o cliente
                lifeStatus: life,
                baseRateReal: rate / 100,
              })
            }
          >
            {run.isPending ? "Rodando..." : "Rodar projeção"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-muted rounded-xl p-4">
          <div className="text-xs text-[rgb(var(--muted))]">Patrimônio projetado</div>
          <div className="text-2xl font-semibold mt-1">
            {kpiTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="card-muted rounded-xl p-4">
          <div className="text-xs text-[rgb(var(--muted))]">% Investido</div>
          <div className="text-2xl font-semibold mt-1">
            {points.length
              ? Math.round((points.at(-1)!.financialAssets / points.at(-1)!.totalAssets) * 100)
              : 0}%</div>
        </div>
        <div className="card-muted rounded-xl p-4">
          <div className="text-xs text-[rgb(var(--muted))]">% Imobilizado</div>
          <div className="text-2xl font-semibold mt-1">
            {points.length
              ? Math.round((points.at(-1)!.realEstateAssets / points.at(-1)!.totalAssets) * 100)
              : 0}%</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="card-muted rounded-xl p-4 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="financialAssets" stackId="1" name="Financeiro" />
            <Area type="monotone" dataKey="realEstateAssets" stackId="1" name="Imobilizado" />
            <Line type="monotone" dataKey="totalWithoutInsurances" name="Total s/ Seguros" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <button className="btn">Plano Original</button>
        <button className="btn">Situação Atual</button>
        <button className="btn">Editar</button>
        <button className="btn">Salvar Versão</button>
      </div>
    </div>
  );
}
