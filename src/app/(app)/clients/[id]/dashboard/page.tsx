// src/app/(app)/clients/[id]/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import { useClient } from "@/hooks/useClients";
import {
  useSimulationsOfClient,
  useSimulationVersions,
} from "@/hooks/useSimulations";
import { useRunProjection, ProjectionResponse } from "@/hooks/useProjections";
import AllocationsTimelinePro from "@/components/AllocationsTimelinePro";
import HistoryList, { HistoryItem } from "@/components/HistoryList";
import ClientPicker from "@/components/ClientPicker";
import { useRouter, useParams } from "next/navigation";
import { useAllocationsOfVersion } from "@/hooks/useAllocations";
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
import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import DiscoveryPanel from "@/components/DiscoveryPanel";

export default function ClientDashboardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clientId = params?.id;
  const currentYear = new Date().getFullYear();

  // 1) Cliente + simulações
  const { data: client } = useClient(clientId);
  const { data: sims } = useSimulationsOfClient(clientId);

  // simulação principal (a mais recente)
  const activeSim = useMemo(() => sims?.[0] ?? null, [sims]);

  // 2) Versões da simulação
  const { data: versions } = useSimulationVersions(
    activeSim?.simulationId ?? null
  );

  // Estados controlados
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [lifeStatus, setLifeStatus] = useState<"ALIVE" | "DEAD" | "INVALID">(
    "ALIVE"
  );

  // versão corrente — respeita a seleção do usuário
  const currentVersion = useMemo(() => {
    if (!versions || versions.length === 0) return null;
    if (selectedVersionId) {
      return versions.find((v) => v.id === selectedVersionId) ?? null;
    }
    const snap = versions.find((v) => v.isCurrentSnapshot);
    return snap ?? versions.reduce((a, b) => (a.version > b.version ? a : b));
  }, [versions, selectedVersionId]);

  // Sincroniza lifeStatus ao trocar de versão
  useEffect(() => {
    if (currentVersion?.lifeStatus) {
      setLifeStatus(currentVersion.lifeStatus as "ALIVE" | "DEAD" | "INVALID");
    }
  }, [currentVersion?.id]);

  // 3) Projeção (auto-run + manual)
  const run = useRunProjection();
  const [projection, setProjection] = useState<ProjectionResponse | null>(null);
  const lastRunKeyRef = useRef<string | null>(null);

  // Auto-rodar quando simulação/versão/vida mudarem
  useEffect(() => {
    if (!activeSim || run.isPending) return;

    const baseRateReal =
      typeof activeSim.baseRateReal === "number"
        ? activeSim.baseRateReal
        : 0.04;

    const key = `${activeSim.simulationId}|${
      currentVersion?.id ?? "nover"
    }|${lifeStatus}|${baseRateReal}`;
    if (lastRunKeyRef.current === key) return; // já rodou para esse estado

    lastRunKeyRef.current = key;
    run.mutate(
      {
        simulationId: activeSim.simulationId,
        lifeStatus,
        baseRateReal,
      },
      { onSuccess: (res) => setProjection(res) }
    );
  }, [activeSim?.simulationId, currentVersion?.id, lifeStatus]); // deps importantes

  // Botão para reprocessar manualmente
  const onRunProjection = async () => {
    if (!activeSim) return;
    const baseRateReal =
      typeof activeSim.baseRateReal === "number"
        ? activeSim.baseRateReal
        : 0.04;
    const res = await run.mutateAsync({
      simulationId: activeSim.simulationId,
      lifeStatus,
      baseRateReal,
    });
    setProjection(res);
    lastRunKeyRef.current = `${activeSim.simulationId}|${
      currentVersion?.id ?? "nover"
    }|${lifeStatus}|${baseRateReal}`;
  };

  // 4) KPIs / net worth / milestones
  const { netWorth, deltaPct, kpis, milestones } = useMemo(() => {
    const empty = {
      netWorth: 0,
      deltaPct: 0,
      kpis: { patrimonioProjetado: 0, pctInvestido: 0, pctImobilizado: 0 },
      milestones: [] as {
        year: number;
        caption?: string;
        age: number;
        value: number;
        deltaPct?: number;
      }[],
    };
    if (!projection || projection.points.length === 0) return empty;

    const pts = projection.points;
    const first = pts[0];
    const last = pts[pts.length - 1];

    const netWorth = last.totalAssets;
    const deltaPct = first.totalAssets
      ? ((last.totalAssets - first.totalAssets) / first.totalAssets) * 100
      : 0;

    const totalNow = last.totalAssets || 1;
    const pctInvestido = (last.financialAssets / totalNow) * 100;
    const pctImobilizado = (last.realEstateAssets / totalNow) * 100;

    const wantYears = [
      new Date().getFullYear(),
      new Date().getFullYear() + 10,
      new Date().getFullYear() + 20,
    ];

    const milestones = wantYears.map((y, idx) => {
      const near = nearestByYear(pts, y);
      return {
        year: y,
        caption: idx === 0 ? "Hoje" : "",
        age: estimateAgeFromVersion(currentVersion, y, client, currentYear),
        value: near?.totalAssets ?? 0,
        deltaPct: first.totalAssets
          ? (((near?.totalAssets ?? 0) - first.totalAssets) /
              first.totalAssets) *
            100
          : 0,
      };
    });

    return {
      netWorth,
      deltaPct,
      kpis: {
        patrimonioProjetado: last.totalAssets,
        pctInvestido: Math.max(0, Math.min(100, pctInvestido)),
        pctImobilizado: Math.max(0, Math.min(100, pctImobilizado)),
      },
      milestones,
    };
  }, [projection, currentVersion]);

  // 5) Histórico (a partir das versões)
  const historyItems: HistoryItem[] = useMemo(() => {
    if (!versions) return [];
    const sorted = [...versions].sort((a, b) => b.version - a.version);
    return sorted.map((v) => ({
      id: v.id,
      name: `Projeção ${v.version}`,
      date: v.createdAt,
      version: v.version,
      kind: v.isLegacy
        ? "legacy"
        : v.version === (currentVersion?.version ?? 0)
        ? "whatif"
        : "original",
      retirementAge: undefined,
    }));
  }, [versions, currentVersion]);

  // ------ Dados do gráfico (sempre a partir de "projection") ------
  const normalizedPoints = useMemo(
    () =>
      (projection?.points ?? []).map((p) => ({
        year: Number(p.year),
        financialAssets: Number(p.financialAssets) || 0,
        realEstateAssets: Number(p.realEstateAssets) || 0,
        totalAssets: Number(p.totalAssets) || 0,
        totalWithoutInsurances: Number(p.totalWithoutInsurances) || 0,
      })),
    [projection?.points]
  );

  const points = normalizedPoints;
  const hasData = (points?.length ?? 0) > 0;

  // Alocações da versão atualmente selecionada
  const { data: allocations = [] } = useAllocationsOfVersion(
    currentVersion?.id ?? null
  );

  // Históricos das alocações
  const histories = useQueries({
    queries: allocations.map((a) => ({
      queryKey: ["alloc-history", a.id],
      queryFn: async () => {
        const { data } = await api.get(routes.allocations.recordsOf(a.id));
        return (data ?? [])
          .map((r: any) => ({ ...r, value: Number(r.value) }))
          .sort((a: any, b: any) => +new Date(a.date) - +new Date(b.date));
      },
      enabled: !!allocations.length,
      staleTime: 10_000,
    })),
  });

  // Transformar records em pontos da timeline
  const { timelinePoints, timelineFrom, timelineTo } = useMemo(() => {
    let minY = currentYear;
    let maxY = currentYear + 10;

    const pts: {
      id: string;
      year: number;
      label: string;
      value: number;
      type?: "FINANCIAL" | "REAL_ESTATE";
    }[] = [];

    allocations.forEach((a, idx) => {
      const recs = histories[idx]?.data ?? [];

      if (recs.length === 0) {
        const y = new Date(a.createdAt).getFullYear();
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + 1);
        pts.push({
          id: `${a.id}-init`,
          year: y,
          label: a.name,
          value: 0,
          type: a.type,
        });
        return;
      }

      for (const r of recs) {
        const y = new Date(r.date).getFullYear();
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + 1);

        pts.push({
          id: `${a.id}-${r.id}`,
          year: y,
          label: a.name,
          value: Number(r.value) || 0,
          type: a.type,
        });
      }
    });

    if (pts.length === 0) {
      minY = currentYear;
      maxY = currentYear + 20;
    } else {
      minY = Math.min(minY, currentYear);
      maxY = Math.max(maxY, currentYear + 5);
    }

    return {
      timelinePoints: pts,
      timelineFrom: minY,
      timelineTo: maxY,
    };
  }, [allocations, histories, currentYear]);

  function triggerProjection(nextLife?: "ALIVE" | "DEAD" | "INVALID") {
    if (!activeSim) return;

    const baseRateReal =
      typeof activeSim.baseRateReal === "number"
        ? activeSim.baseRateReal
        : 0.04;

    const ls = nextLife ?? lifeStatus;
    const key = `${activeSim.simulationId}|${
      currentVersion?.id ?? "nover"
    }|${ls}|${baseRateReal}`;
    if (lastRunKeyRef.current === key) return;

    lastRunKeyRef.current = key;
    run.mutate(
      { simulationId: activeSim.simulationId, lifeStatus: ls, baseRateReal },
      { onSuccess: (res) => setProjection(res) }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ClientSummaryHeader
        clientName={client?.name ?? "—"}
        netWorth={netWorth}
        deltaPct={deltaPct}
        milestones={milestones}
        onSelectClient={(id) => {
          router.push(`/clients/${id}/dashboard`);
          localStorage.setItem("activeClientId", id);
        }}
      />

      <div className=" p-4 flex items-center gap-0 flex justify-center ">
        <fieldset
          className="flex items-center gap-5"
          role="radiogroup"
          aria-label="Situação de vida"
        >
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="lifeStatus"
              value="ALIVE"
              checked={lifeStatus === "ALIVE"}
              onChange={() => {
                setLifeStatus("ALIVE");
                triggerProjection("ALIVE");
              }}
              className="sr-only peer"
            />
            <span
              className="
        w-3.5 h-3.5 rounded-full
        border border-[rgb(var(--stroke))]/50
        bg-[rgb(var(--panel-2))]
        peer-checked:bg-emerald-400
        peer-checked:ring-2 peer-checked:ring-emerald-400/40
        peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--primary))]/50
        transition
      "
              aria-hidden
            />
            <span className="text-sm text-[rgb(var(--text))]">Vivo</span>
          </label>

          {/* Falecido */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="lifeStatus"
              value="DEAD"
              checked={lifeStatus === "DEAD"}
              onChange={() => {
                setLifeStatus("DEAD");
                triggerProjection("DEAD");
              }}
              className="sr-only peer"
            />
            <span
              className="
        w-3.5 h-3.5 rounded-full
        border border-[rgb(var(--stroke))]/50
        bg-[rgb(var(--panel-2))]
        peer-checked:bg-rose-400
        peer-checked:ring-2 peer-checked:ring-rose-400/40
        peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--primary))]/50
        transition
      "
              aria-hidden
            />
            <span className="text-sm text-[rgb(var(--text))]">Morto</span>
          </label>
        </fieldset>
      </div>

      {/* KPIs + Gráfico */}
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Kpi
            title="Patrimônio projetado"
            value={formatCurrency(kpis.patrimonioProjetado)}
          />
          <Kpi title="% Investido" value={`${kpis.pctInvestido.toFixed(0)}%`} />
          <Kpi
            title="% Imobilizado"
            value={`${kpis.pctImobilizado.toFixed(0)}%`}
          />
        </div>

        <div className="h-[400px] rounded-lg border border-dashed border-[rgb(var(--stroke))]/40 p-2 flex justify center">
          {!projection ? (
            <div className="h-full w-full flex items-center justify-center text-[rgb(var(--muted))]">
              Rodando projeção…
            </div>
          ) : !hasData ? (
            <div className="h-full w-full flex items-center justify-center text-[rgb(var(--muted))]">
              Sem dados para projetar. Verifique alocações, movimentos e
              seguros.
            </div>
          ) : (
            <ResponsiveContainer width="95%" height="100%">
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
          )}
        </div>
      </div>

      {/* Timeline + Histórico */}
      <div className="h-100 card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[rgb(var(--muted))]">
            Timeline de alocações manuais
          </span>
          <button className="btn h-8">+ Adicionar</button>
        </div>
        <AllocationsTimelinePro
          points={timelinePoints}
          startYear={timelineFrom}
          endYear={timelineTo}
          baseAge={estimateAgeFromVersion(
            currentVersion,
            timelineFrom,
            client,
            currentYear
          )}
          majorStep={5}
        />
      </div>
      <div className="card p-4">
        <DiscoveryPanel
          clientId={clientId!}
          versionId={currentVersion?.id ?? null}
        />
      </div>
    </div>
  );
}

/* ---------- helpers e subcomponentes ---------- */

function nearestByYear(points: ProjectionResponse["points"], year: number) {
  if (!points.length) return null;
  return points.reduce(
    (best, p) =>
      Math.abs(p.year - year) < Math.abs(best.year - year) ? p : best,
    points[0]
  );
}

// Calcula idade no final do "year" usando várias fontes.
// Ajuste os nomes dos campos conforme seu backend (birthDate/dateOfBirth/dob, baseAge/baseYear etc).
function estimateAgeFromVersion(
  version: any,
  year: number,
  client?: any,
  currentYear: number = new Date().getFullYear()
) {
  // 1) Data de nascimento do cliente (preferível)
  const birthStr =
    client?.birthDate ?? client?.dateOfBirth ?? client?.dob ?? null;
  if (birthStr) {
    const d = new Date(birthStr);
    if (!isNaN(d.getTime())) {
      const birthYear = d.getFullYear();
      // Considerando idade "no fim do ano" → diferença simples de ano
      return Math.max(0, year - birthYear);
    }
  }

  // 2) Idade base na versão (ex.: versão tem referência de idade/ano)
  if (
    typeof version?.baseAge === "number" &&
    typeof version?.baseYear === "number"
  ) {
    return Math.max(0, Math.round(version.baseAge + (year - version.baseYear)));
  }

  // 3) Idade atual do cliente + deslocamento de anos
  const ageNow =
    typeof client?.age === "number"
      ? client.age
      : typeof client?.currentAge === "number"
      ? client.currentAge
      : null;
  if (typeof ageNow === "number") {
    return Math.max(0, Math.round(ageNow + (year - currentYear)));
  }

  // 4) Fallback
  return 45;
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--stroke))]/40 bg-[rgb(var(--panel-2))] p-3">
      <div className="text-xs text-[rgb(var(--muted))] mb-1">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function formatCurrency(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ClientSummaryHeader({
  clientName,
  netWorth,
  deltaPct,
  milestones,
  onSelectClient,
}: {
  clientName: string;
  netWorth: number;
  deltaPct: number;
  milestones: {
    year: number;
    caption?: string;
    age: number;
    value: number;
    deltaPct?: number;
  }[];
  onSelectClient: (id: string) => void;
}) {
  const deltaPositive = deltaPct >= 0;
  return (
    <div className="card p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-3">
          <ClientPicker
            currentClientName={clientName}
            onSelect={onSelectClient}
          />
          <div>
            <div className="text-xs text-[rgb(var(--muted))] mb-1">
              Patrimônio Líquido Total
            </div>
            <div className="text-3xl font-semibold">
              {formatCurrency(netWorth)}{" "}
              <span
                className={cn(
                  "text-sm align-super ml-1",
                  deltaPositive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {deltaPositive ? "+" : ""}
                {deltaPct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {milestones.map((m) => (
            <div
              key={m.year}
              className="rounded-xl border border-[rgb(var(--stroke))]/40 bg-[rgb(var(--panel-2))] p-3"
            >
              <div className="text-xs text-[rgb(var(--muted))] mb-2">
                {formatCurrency(m.value)}
                {typeof m.deltaPct === "number" && (
                  <span
                    className={cn(
                      "ml-1",
                      (m.deltaPct ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    )}
                  >
                    {(m.deltaPct ?? 0) >= 0 ? "+" : ""}
                    {(m.deltaPct ?? 0).toLocaleString("pt-BR", {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </span>
                )}
              </div>
              <div className="h-8 rounded-md bg-white/5 overflow-hidden relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 via-fuchsia-400/30 to-indigo-400/20" />
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <div className="text-[rgb(var(--muted))]">
                  {m.year} {m.caption && <span>{m.caption}</span>}
                </div>
                <div className="font-medium">{m.age} anos</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
