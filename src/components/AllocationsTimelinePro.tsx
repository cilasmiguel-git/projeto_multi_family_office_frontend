"use client";

import { useMemo, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TimelinePoint = {
  id: string;
  year: number;
  label: string;
  value: number;
  type?: "FINANCIAL" | "REAL_ESTATE";
};

type Props = {
  points?: TimelinePoint[];
  startYear: number;
  endYear: number;
  baseAge?: number;
  majorStep?: number;
};

function AllocationsTimelinePro({
  points = [],
  startYear,
  endYear,
  baseAge,
  majorStep = 5,
}: Props) {
  const min = Math.min(startYear, endYear);
  const max = Math.max(startYear, endYear);
  const span = Math.max(1, max - min);

  const financial = points.filter((p) => p.type !== "REAL_ESTATE");
  const realEstate = points.filter((p) => p.type === "REAL_ESTATE");

  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = min; y <= max; y++) ys.push(y);
    return ys;
  }, [min, max]);

  const toPercent = (year: number) =>
    `${((Math.min(max, Math.max(min, year)) - min) / span) * 100}%`;

  const fmtBRL = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="rounded-2xl border border-[rgb(var(--stroke))]/40 bg-[rgb(var(--panel))] p-4">
      <h3 className="text-sm text-[rgb(var(--muted))] mb-4">Timeline de alocações</h3>

      <Track
        title="Financeiro"
        colorDot="bg-emerald-500"
        colorText="text-emerald-400"
        years={years}
        toPercent={toPercent}
        baseAge={baseAge}
        majorStep={majorStep}
        points={financial}
        fmtBRL={fmtBRL}
        place="top"
      />

      <div className="mt-6" />
      <Track
        title="Imobilizado"
        colorDot="bg-amber-500"
        colorText="text-amber-400"
        years={years}
        toPercent={toPercent}
        baseAge={baseAge}
        majorStep={majorStep}
        points={realEstate}
        fmtBRL={fmtBRL}
        place="bottom"
      />
    </div>
  );
}

/* ---------- Track com anti-overlap + clusters ---------- */

type TrackProps = {
  title: string;
  colorDot: string;
  colorText: string;
  years: number[];
  toPercent: (y: number) => string;
  baseAge?: number;
  majorStep: number;
  points: TimelinePoint[];
  fmtBRL: (n: number) => string;
  place: "top" | "bottom";
};

function Track({
  title,
  colorDot,
  colorText,
  years,
  toPercent,
  baseAge,
  majorStep,
  points,
  fmtBRL,
  place,
}: TrackProps) {
  const min = years[0];
  const max = years[years.length - 1];
  const span = Math.max(1, max - min);

  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const minGapPx = 80;
  const maxLanes = 3;

  type Item = { p: TimelinePoint; xPx: number; lane?: number };
  type Cluster = { xPx: number; items: TimelinePoint[]; id: string };

  const { laid, clusters } = useMemo(() => {
    if (!width) return { laid: [] as Item[], clusters: [] as Cluster[] };

    const yearToX = (y: number) =>
      ((Math.min(max, Math.max(min, y)) - min) / span) * width;

    const pts = [...points]
      .sort((a, b) => a.year - b.year)
      .map((p) => ({ p, xPx: yearToX(p.year) }));

    const lastX: number[] = Array(maxLanes).fill(-Infinity);
    const placed: Item[] = [];
    const cls: Cluster[] = [];

    for (const it of pts) {
      let placedInLane = false;
      for (let lane = 0; lane < maxLanes; lane++) {
        if (it.xPx - lastX[lane] >= minGapPx) {
          placed.push({ ...it, lane });
          lastX[lane] = it.xPx;
          placedInLane = true;
          break;
        }
      }
      if (!placedInLane) {
        const hit = cls.find((c) => Math.abs(c.xPx - it.xPx) < minGapPx / 2);
        if (hit) hit.items.push(it.p);
        else
          cls.push({
            xPx: it.xPx,
            items: [it.p],
            id: `cluster-${title}-${it.p.year}-${it.p.id}`,
          });
      }
    }

    return { laid: placed, clusters: cls };
  }, [points, width, min, max, span]);

  const laneOffset = (lane = 0) => {
    const base = place === "top" ? -28 : 20;
    const step = place === "top" ? -18 : 18;
    return base + step * lane;
  };

  return (
    <div className="h-20">
      <div className={cn("mb-2 text-sm font-medium", colorText)}>{title}</div>

      <div className="relative" ref={ref}>
        <div className="h-[2px] w-full bg-white/15" />

        {years.map((y) => {
          const isMajor = (y - min) % majorStep === 0;
          return (
            <div
              key={`tick-${title}-${y}`}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-0.5 bg-white/25",
                isMajor ? "h-3" : "h-2"
              )}
              style={{ left: toPercent(y) }}
            />
          );
        })}

        {years
          .filter((y) => (y - min) % majorStep === 0)
          .map((y) => (
            <div
              key={`year-${title}-${y}`}
              className="absolute text-xs text-white/70"
              style={{
                left: toPercent(y),
                top: "0.75rem",
                transform: "translateX(-50%)",
              }}
            >
              {y}
            </div>
          ))}

        {typeof baseAge === "number" &&
          years
            .filter((y) => (y - min) % majorStep === 0)
            .map((y) => (
              <div
                key={`age-${title}-${y}`}
                className="absolute text-[10px] text-[rgb(var(--muted))]"
                style={{
                  left: toPercent(y),
                  top: "1.75rem",
                  transform: "translateX(-50%)",
                }}
              >
                {baseAge + (y - min)} anos
              </div>
            ))}

        {laid.map(({ p, xPx, lane }) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: xPx,
              top: laneOffset(lane),
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className={cn("w-2.5 h-2.5 rounded-full", colorDot)} />
              <span
                className={cn("text-xs whitespace-nowrap", colorText)}
                title={`${p.label}: ${fmtBRL(p.value)} (${p.year})`}
              >
                {p.label}: {fmtBRL(p.value)}
              </span>
            </div>
            <div
              className={cn(
                "w-px h-3 bg-white/25 mx-auto",
                place === "top" ? "mt-1" : "mb-1"
              )}
            />
          </div>
        ))}

        {clusters.map((c) => (
          <div
            key={c.id}
            className="absolute group"
            style={{
              left: c.xPx,
              top: laneOffset(0),
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="text-xs text-white/80">+{c.items.length}</span>
            </div>
            <div
              className={cn(
                "w-px h-3 bg-white/25 mx-auto",
                place === "top" ? "mt-1" : "mb-1"
              )}
            />
            <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-10 rounded-lg border border-[rgb(var(--stroke))]/40 bg-[rgb(var(--panel-2))] px-3 py-2 shadow-xl min-w-[220px]">
              <div className="text-xs text-[rgb(var(--muted))] mb-1">
                Itens próximos
              </div>
              <ul className="space-y-1">
                {c.items.slice(0, 6).map((it) => (
                  <li key={it.id} className="text-xs text-white/90">
                    {it.label}: {fmtBRL(it.value)}{" "}
                    <span className="text-[rgb(var(--muted))]">({it.year})</span>
                  </li>
                ))}
                {c.items.length > 6 && (
                  <li className="text-xs text-[rgb(var(--muted))]">
                    +{c.items.length - 6} itens…
                  </li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllocationsTimelinePro;
