// src/components/ProjectionView.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import ClientCombo, { ClientOption } from "./ClientCombo";
import { useRunProjection } from "@/hooks/useProjections";
import { useSimulationsOfClient, SimulationRow } from "@/hooks/useSimulations";

type LifeStatus = "ALIVE" | "DEAD" | "INVALID";

export default function ProjectionView({
  presetClient,
}: {
  presetClient: ClientOption | null;
}) {
  const [client, setClient] = useState<ClientOption | null>(
    presetClient ?? null
  );
  const [rate, setRate] = useState(4);
  const [life, setLife] = useState<LifeStatus>("ALIVE");

  const { data: sims } = useSimulationsOfClient(client?.id ?? undefined);

  const activeSim = useMemo(() => {
    const list = sims ?? [];
    const fromLS =
      typeof window !== "undefined"
        ? localStorage.getItem("activeSimulationId")
        : null;
    return (
      (fromLS && list.find((s) => s.simulationId === fromLS)) || list[0] || null
    );
  }, [sims]);

  const simId = activeSim?.simulationId ?? null;

  const run = useRunProjection();
  console.log("run", run);

  // auto-run quando já vier client pela URL e existir uma simulação
  useEffect(() => {
    if (!client || !simId || run.isPending || run.data) return;
    run.mutate({
      simulationId: simId,
      lifeStatus: life,
      baseRateReal: rate / 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, simId]);

  // depois do const run = useRunProjection();
  const normalizedPoints = useMemo(
    () =>
      (run.data?.points ?? []).map((p) => ({
        year: Number(p.year),
        financialAssets: Number(p.financialAssets) || 0,
        realEstateAssets: Number(p.realEstateAssets) || 0,
        totalAssets: Number(p.totalAssets) || 0,
        totalWithoutInsurances: Number(p.totalWithoutInsurances) || 0,
      })),
    [run.data?.points]
  );

  const points = normalizedPoints;

  // depois (qualquer ponto já é dado)
  const hasData = (points?.length ?? 0) > 0;

  return (
    <div className="card p-4 space-y-4">
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
            disabled={!client || !simId || run.isPending}
            onClick={() => {
              if (!simId) return;
              run.mutate({
                simulationId: simId,
                lifeStatus: life,
                baseRateReal: rate / 100,
              });
            }}
          >
            {run.isPending ? "Rodando..." : "Rodar projeção"}
          </button>

          {/* Mensagens auxiliares */}
          {!client && (
            <div className="text-sm text-[rgb(var(--muted))] mt-2">
              Selecione um cliente para habilitar a projeção.
            </div>
          )}
          {client && !simId && (
            <div className="text-sm text-[rgb(var(--muted))] mt-2">
              Nenhuma simulação para este cliente. Crie uma em{" "}
              <a
                className="underline"
                href={`/clients/${client?.id}/simulations`}
              >
                Simulações
              </a>
              .
            </div>
          )}
          {run.isError && (
            <div className="text-sm text-rose-300 mt-2">
              {(run.error as any)?.response?.data?.message ??
                (run.error as Error).message ??
                "Erro ao rodar projeção"}
            </div>
          )}
        </div>
      </div>

      {/* KPIs + gráfico iguais aos seus */}
      {/* ... */}

      {run.isError && (
        <div className="text-sm text-rose-300 mt-2">
          {(run.error as any)?.response?.data?.message ||
            "Erro ao rodar projeção"}
        </div>
      )}

      <div className="card-muted rounded-xl p-4 h-[360px]">
        {!hasData ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-[rgb(var(--muted))]">
            Sem dados para projetar…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.6)" />
                <YAxis
                  domain={[
                    (dataMin: number) =>
                      Number.isFinite(dataMin) ? Math.min(0, dataMin) : 0,
                    (dataMax: number) =>
                      Number.isFinite(dataMax) ? Math.max(1, dataMax) : 1,
                  ]}
                  stroke="rgba(255,255,255,0.6)"
                />

                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="financialAssets"
                  name="Financeiro"
                  stackId="1"
                  stroke="#38bdf8"
                  fill="rgba(56,189,248,.25)"
                />
                <Area
                  type="monotone"
                  dataKey="realEstateAssets"
                  name="Imobilizado"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="rgba(245,158,11,.25)"
                />
                <Line
                  type="monotone"
                  dataKey="totalWithoutInsurances"
                  name="Total s/ Seguros"
                  dot={false}
                  stroke="#a78bfa"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
