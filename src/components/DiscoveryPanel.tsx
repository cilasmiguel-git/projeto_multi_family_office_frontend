// src/components/DiscoveryPanel.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Shield, Building2, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMovementsOfVersion, Movement } from "@/hooks/useMovements";

type Tab = "FINANCIAL" | "REAL_ESTATE";
type Props = { clientId: string; versionId: string | null; className?: string };

const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const freqLabel: Record<Movement["frequency"], string> = {
  ONE_TIME: "Única",
  MONTHLY: "Mensal",
  ANNUAL: "Anual",
};

function formatRange(startIso: string, endIso?: string | null) {
  const s = new Date(startIso).toLocaleDateString("pt-BR");
  if (!endIso) return `desde ${s}`;
  const e = new Date(endIso).toLocaleDateString("pt-BR");
  return `${s} — ${e}`;
}

/* --------- SUGESTÕES FICTÍCIAS (alocações + seguros) --------- */
type Suggestion = {
  id: string;
  title: string;
  subtitle: string;
  amountLabel?: string;
  category: Tab;
  href: string;
};

const ALLOC: Suggestion[] = [
  { id: "fi_tesouro", title: "Tesouro Selic", subtitle: "Liquidez diária • Baixo risco", amountLabel: "Criar alocação", category: "FINANCIAL", href: "" },
  { id: "fi_index",   title: "Fundo Indexado (IBOV)", subtitle: "Diversificação automática", amountLabel: "Criar alocação", category: "FINANCIAL", href: "" },
  { id: "re_fii",     title: "FII de Tijolo", subtitle: "Renda mensal • Exposição a imóveis", amountLabel: "Criar alocação", category: "REAL_ESTATE", href: "" },
  { id: "re_terreno", title: "Terreno em expansão", subtitle: "Valorização de longo prazo", amountLabel: "Criar alocação", category: "REAL_ESTATE", href: "" },
];

const INS: Suggestion[] = [
  { id: "seg_vida",       title: "Seguro de Vida Familiar", subtitle: "Proteção de renda • Capital alto", amountLabel: money(500_000), category: "FINANCIAL", href: "" },
  { id: "seg_invalidez",  title: "Seguro de Invalidez", subtitle: "Cobertura por incapacidade", amountLabel: money(100_000), category: "FINANCIAL", href: "" },
  { id: "seg_residencial",title: "Seguro Residencial", subtitle: "Incêndio • Roubo • Danos elétricos", amountLabel: money(300_000), category: "REAL_ESTATE", href: "" },
];

export default function DiscoveryPanel({ clientId, versionId, className }: Props) {
  const [tab, setTab] = useState<Tab>("FINANCIAL");

  // 1) MOVIMENTAÇÕES REAIS DA VERSÃO
  const { data: movements = [], isLoading } = useMovementsOfVersion(versionId);
  const orderedMovs = useMemo(
    () =>
      movements
        .slice()
        .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
        .slice(0, 4), // mostra só as 4 mais recentes
    [movements]
  );

  // 2) SUGESTÕES (apenas navegação)
  const allocHref = `/clients/${clientId}/allocations`;
  const insHref = `/clients/${clientId}/insurances`;

  const allocs = useMemo(
    () => ALLOC.filter((a) => a.category === tab).map((a) => ({ ...a, href: allocHref })),
    [tab, clientId]
  );
  const ins = useMemo(
    () => INS.filter((i) => i.category === tab).map((i) => ({ ...i, href: insHref })),
    [tab, clientId]
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header + Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Movimentações</h2>
        <div
          role="tablist"
          className="inline-flex items-center rounded-full border border-[rgb(var(--stroke))]/30 bg-[rgb(var(--panel-2))] p-1"
        >
          <TabButton active={tab === "FINANCIAL"} onClick={() => setTab("FINANCIAL")}>
            Financeiras
          </TabButton>
          <TabButton active={tab === "REAL_ESTATE"} onClick={() => setTab("REAL_ESTATE")}>
            Imobilizadas
          </TabButton>
        </div>
      </div>

      {/* Grid de movimentos reais */}
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-[rgb(var(--stroke))]/30 bg-white/5 animate-pulse" />
          ))
        ) : orderedMovs.length === 0 ? (
          <div className="md:col-span-2 text-sm text-[rgb(var(--muted))]">
            Nenhuma movimentação nesta versão.
          </div>
        ) : (
          orderedMovs.map((m) => (
            <MovementCard key={m.id} m={m} />
          ))
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/clients/${clientId}/movements`}
          className="btn h-8"
        >
          Ver todas as movimentações
        </Link>
      </div>

      {/* Alocações sugeridas (filtradas pela aba) */}
      <SectionTitle icon={tab === "REAL_ESTATE" ? <Building2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}>
        {tab === "REAL_ESTATE" ? "Alocações Imobilizadas" : "Alocações Financeiras"}
      </SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        {allocs.map((a) => (
          <Link
            key={a.id}
            href={a.href}
            className="rounded-xl border border-indigo-400/25 bg-white/5 p-4 hover:border-indigo-400/40 transition group"
          >
            <div className="text-base font-medium mb-2">{a.title}</div>
            <div className="text-sm text-[rgb(var(--muted))]">{a.subtitle}</div>
            <div className="mt-4 text-indigo-300 text-sm font-semibold group-hover:underline">
              {a.amountLabel}
            </div>
          </Link>
        ))}
      </div>

      {/* Seguros sugeridos (filtrados pela mesma aba) */}
      <SectionTitle icon={<Shield className="h-4 w-4" />}>Seguros</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        {ins.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className="rounded-xl border border-fuchsia-400/25 bg-white/5 p-4 hover:border-fuchsia-400/40 transition group"
          >
            <div className="text-base font-medium mb-2">{s.title}</div>
            <div className="text-sm text-[rgb(var(--muted))]">{s.subtitle}</div>
            {s.amountLabel && (
              <div className="mt-4 text-fuchsia-300 text-sm font-semibold group-hover:underline">
                {s.amountLabel}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* --- sub-components --- */

function MovementCard({ m }: { m: Movement }) {
  const isIncome = m.type === "INCOME";
  const Trend = isIncome ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "rounded-xl p-4 relative border",
        isIncome ? "border-emerald-400/25" : "border-rose-400/25",
        "bg-white/5"
      )}
    >
      <div className="text-base font-medium mb-2">
        {/* título genérico: pode vir de uma futura "description" se existir */}
        {isIncome ? "Entrada" : "Saída"}
      </div>

      <div className="space-y-1 text-sm text-[rgb(var(--muted))]">
        <div>{formatRange(m.startDate, m.endDate ?? undefined)}</div>
        <div>Frequência: <span className="font-medium text-[rgb(var(--text))]">{freqLabel[m.frequency]}</span></div>
        <div>{isIncome ? "Crédito" : "Débito"}</div>
      </div>

      <div className={cn(
        "absolute bottom-4 right-4 flex items-center gap-1.5 text-sm font-semibold",
        isIncome ? "text-emerald-400" : "text-rose-400"
      )}>
        <Trend className="h-4 w-4" />
        {money(m.amount)}
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs rounded-full cursor-pointer transition",
        active ? "bg-white text-black" : "text-[rgb(var(--muted))] hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 mb-1 flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
      {icon}
      <span>{children}</span>
    </div>
  );
}
