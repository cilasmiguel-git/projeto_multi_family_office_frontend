// src/app/(app)/clients/[id]/dashboard/page.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { useClient } from "@/hooks/useClients";
import {
  useSimulationsOfClient,
  useSimulationVersions,
} from "@/hooks/useSimulations";
import { useRunProjection, ProjectionResponse } from "@/hooks/useProjections"; // você já tem esse hook
import AllocationsTimeline from "@/components/AllocationsTimeline";
import HistoryList, { HistoryItem } from "@/components/HistoryList";
import ClientPicker from "@/components/ClientPicker";
import { useRouter, useParams } from "next/navigation";

export default function ClientDashboardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clientId = params?.id;

  // 1) Buscar cliente + simulações dele
  const { data: client } = useClient(clientId);
  const { data: sims } = useSimulationsOfClient(clientId);

  // escolhe a simulação principal (a mais recente)
  const activeSim = useMemo(() => sims?.[0] ?? null, [sims]);

  // 2) Buscar versões da simulação
  const { data: versions } = useSimulationVersions(activeSim?.id);

  // escolhe versão corrente (isCurrentSnapshot) ou maior número
  const currentVersion = useMemo(() => {
    if (!versions || versions.length === 0) return null;
    const snap = versions.find((v) => v.isCurrentSnapshot);
    return snap ?? versions.reduce((a, b) => (a.version > b.version ? a : b));
  }, [versions]);

  // 3) Rodar projeção em tempo real
  const run = useRunProjection();
  const [projection, setProjection] = useState<ProjectionResponse | null>(null);

  const onRunProjection = async () => {
    if (!activeSim) return;
    const lifeStatus = "ALIVE" as const; // você pode ler do select
    const baseRateReal = 0.04; // idem
    const res = await run.mutateAsync({
      simulationId: activeSim.id,
      lifeStatus,
      baseRateReal,
    });
    setProjection(res);
  };

  // 4) Derivar KPIs / net worth / milestones da projeção
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
        age: estimateAgeFromVersion(currentVersion, y), // se não tiver idade real, pode mockar 45/55/65
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
    // ordena desc por versão
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
      retirementAge: undefined, // preencha se tiver essa info
    }));
  }, [versions, currentVersion]);

  return (
    <div className="space-y-6">
      {/* Header tipo mock com cliente + net worth + milestones */}
      <ClientSummaryHeader
        clientName={client?.name ?? "—"}
        netWorth={netWorth}
        deltaPct={deltaPct}
        milestones={milestones}
        onSelectClient={(id) => {
          // <- passa a navegação por prop
          router.push(`/clients/${id}/dashboard`);
          localStorage.setItem("activeClientId", id);
        }}
      />

      {/* Controles do cenário */}
      <div className="card p-4 flex items-center gap-3">
        <input
          className="input-ghost w-[320px]"
          placeholder="Nome do cenário"
          value={currentVersion ? `Projeção ${currentVersion.version}` : ""}
          readOnly
        />
        {/* Status (Vivo/Falecido) */}
        <select
          className="h-9 px-3 rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40 w-[140px]"
          defaultValue="Vivo"
        >
          <option value="Vivo">Vivo</option>
          <option value="Falecido">Falecido</option>
        </select>

        {/* Versão (apenas leitura) */}
        <select
          className="h-9 px-3 rounded-lg bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40 text-[rgb(var(--text))] focus:outline-none w-[100px]"
          value={currentVersion?.version ?? ""}
          disabled // readOnly não funciona em <select>
        >
          {(versions ?? []).map((v) => (
            <option key={v.id} value={v.version}>
              {v.version}
            </option>
          ))}
        </select>

        <button
          className={cn(
            "btn btn-primary ml-auto",
            run.isPending && "opacity-70 cursor-wait"
          )}
          onClick={onRunProjection}
          disabled={!activeSim || run.isPending}
        >
          {run.isPending ? "Rodando..." : "Rodar projeção"}
        </button>
      </div>

      {/* KPIs + placeholder do gráfico (substitua pelo seu chart) */}
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

        <div className="rounded-xl border border-[rgb(var(--stroke))]/40 bg-[rgb(var(--panel-2))] p-3">
          <div className="h-[260px] rounded-lg border border-dashed border-[rgb(var(--stroke))]/40 flex items-center justify-center text-[rgb(var(--muted))]">
            {projection
              ? "Gráfico com dados da projeção"
              : "Rodar projeção para ver o gráfico"}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-4">
              <LegendPill
                label="Financeiro"
                color="linear-gradient(135deg,#60a5fa,#8b5cf6)"
              />
              <LegendPill
                label="Imobilizado"
                color="linear-gradient(135deg,#22d3ee,#34d399)"
              />
              <LegendPill
                label="Total s/ Seguros"
                color="linear-gradient(135deg,#d1d5db,#6b7280)"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="btn h-8">Plano Original</button>
              <button className="btn h-8">Situação Atual</button>
              <button className="btn h-8">Editar</button>
              <button className="btn btn-primary h-8">Salvar Versão</button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline + Histórico */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[rgb(var(--muted))]">
            Timeline de alocações manuais
          </span>
          <button className="btn h-8">+ Adicionar</button>
        </div>
        <AllocationsTimeline data={[]} />
      </div>

      <HistoryList
        items={historyItems}
        onOpen={(id) => console.log("abrir", id)}
      />
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

function estimateAgeFromVersion(_version: any, _year: number) {
  // se tiver a "idade inicial" na versão, calcule direito; por enquanto, placeholder:
  return 45; // ajuste quando tiver os dados corretos
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--stroke))]/40 bg-[rgb(var(--panel-2))] p-3">
      <div className="text-xs text-[rgb(var(--muted))] mb-1">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function LegendPill({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-5 h-5 rounded-full border border-white/10"
        style={{ background: color }}
      />
      <span className="text-sm text-[rgb(var(--muted))]">{label}</span>
    </div>
  );
}

function ClientSummaryHeader({
  clientName,
  netWorth,
  deltaPct,
  milestones,
  onSelectClient, // <- nova prop
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
  onSelectClient: (id: string) => void; // <- tipagem
}) {
  const deltaPositive = deltaPct >= 0;
  return (
    <div className="card p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-3">
          <ClientPicker
            currentClientName={clientName}
            onSelect={onSelectClient} // <- usa a prop (sem router aqui)
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

function formatCurrency(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
