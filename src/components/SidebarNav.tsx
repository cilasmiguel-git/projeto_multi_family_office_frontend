"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Users,
  LayoutDashboard,
  LineChart,
  History,
  UserPlus,
  Layers,
  Building2,
  Target,
  Wallet,
  Shield,
  ArrowLeftRight,
  GitBranch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import logo from "@/assets/de94eb1cf616908e4076d9874fec139e14c061de.png";

type Item = {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string; icon?: React.ElementType }[];
};

function matchPath(pathname: string, href: string) {
  if (!pathname || !href) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SidebarNav() {
  // ✅ hooks só aqui dentro:
  const pathname = usePathname();
  const idFromPath = pathname?.match(/^\/clients\/([^/]+)/)?.[1] ?? null;

  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (idFromPath) {
      localStorage.setItem("activeClientId", idFromPath);
      setActiveId(idFromPath);
    } else {
      setActiveId(localStorage.getItem("activeClientId"));
    }
  }, [idFromPath]);

  const dashboardHref = activeId
    ? `/clients/${activeId}/dashboard`
    : "/clients";

const items = useMemo<Item[]>(() => {
  if (!activeId) {
    return [
      { label: "Cliente", icon: LineChart, children: [] },
    ];
  }

  return [
    {
      label: "Análises",
      icon: LayoutDashboard,
      children: [
        { label: "Visão geral", href: `/clients/${activeId}/dashboard`, icon: LayoutDashboard },
        { label: "Projeções",   href: `/clients/${activeId}/projection`, icon: LineChart },
        { label: "Simulações",  href: `/clients/${activeId}/simulations`, icon: GitBranch  },
      ],
    },
    {
      label: "Gestão",
      icon: Layers,
      children: [
        { label: "Alocações",     href: `/clients/${activeId}/allocations`, icon: Layers },
        { label: "Movimentações", href: `/clients/${activeId}/movements`,   icon: ArrowLeftRight },
      ],
    },
    {
      label: "Segurança",
      icon: Shield,
      children: [
        { label: "Seguros", href: `/clients/${activeId}/insurances`, icon: Shield },
      ],
    },
    {
      label: "Configuração",
      icon: Users,
      children: [
        { label: "Clientes", href: "/clients", icon: Users },
      ],
    },
  ];
}, [activeId]);


  const [open, setOpen] = useState<Record<string, boolean>>({
    Clientes: true,
    Cliente: true,
  });

  return (
    <aside className="flex-none w-[280px] p-3 h-dvh sticky top-0 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-2xl flex flex-col overflow-hidden",
          "bg-[rgb(var(--panel-1),_0.9)] backdrop-blur",
          "border border-[rgb(var(--stroke))]/40",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_10px_30px_rgba(0,0,0,0.35)]"
        )}
      >
        <br />
        <Link href="/" className="mt-3 mb-5 mx-auto relative z-10 group">
          <div
            className="p-[1px] rounded-[39px] bg-[linear-gradient(96.19deg,#FA4515_0%,#D6A207_50%,#94290C_100%)]
                       [background-size:200%_200%] [background-position:0%_50%]
                       transition-[background-position,box-shadow] duration-700 ease-out
                       group-hover:[background-position:100%_50%]
                       group-hover:shadow-[0_0_18px_rgba(250,69,21,.25)]"
            style={{ width: 163, height: 52 }}
          >
            <div className="relative w-full h-full rounded-[38px] bg-[#131313] overflow-hidden isolate flex items-center justify-center">
              <div
                className="pointer-events-none absolute inset-[1px] rounded-[37px] opacity-90 z-0
                              bg-[radial-gradient(120%_120%_at_0%_100%,rgba(250,69,21,.18)_0%,transparent_55%),
                                  radial-gradient(120%_120%_at_100%_0%,rgba(214,162,7,.15)_0%,transparent_55%)]"
              />
              <div
                className="absolute inset-[1px] rounded-[37px] z-10 bg-gradient-to-r from-transparent via-white/18 to-transparent
                              translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 ease-in-out"
              />
              <Image
                src={logo}
                alt="Anka"
                width={120}
                height={28}
                className="relative z-20 h-7 w-auto drop-shadow-[0_0_8px_rgba(0,0,0,0.35)]"
                priority
              />
            </div>
          </div>
        </Link>

        <div className="px-2 pt-3 pb-2 overflow-y-auto relative z-0">
          <nav className="space-y-1">
            {items.map((it) => {
              const Icon = it.icon;
              const hasChildren = !!it.children?.length;

              // ativo p/ item com link direto
              const isActiveLink = it.href
                ? matchPath(pathname!, it.href)
                : false;

              // ativo p/ grupo: algum filho ativo
              const isActiveGroup = hasChildren
                ? it.children!.some((c) => {
                    // regra especial: "/clients" é EXATO
                    if (c.href === "/clients") return pathname === "/clients";
                    return matchPath(pathname!, c.href);
                  })
                : false;

              const isActiveRoot = isActiveLink || isActiveGroup;

              return (
                <div key={it.label}>
                  {!hasChildren && it.href && (
                    <Link
                      href={it.href}
                      className={cn(
                        "w-full h-10 px-3 rounded-xl flex items-center justify-between text-[13px] transition-colors",
                        isActiveLink ? "bg-white/7" : "hover:bg-white/5"
                      )}
                    >
                      <span className="flex items-center gap-3 flex-1">
                        <Icon size={18} className="opacity-80" />
                        <span className="truncate">{it.label}</span>
                      </span>
                    </Link>
                  )}

                  {hasChildren && (
                    <>
                      <button
                        className={cn(
                          "w-full h-10 px-3 rounded-xl flex items-center justify-between text-[13px] transition-colors",
                          isActiveGroup ? "bg-white/7" : "hover:bg-white/5"
                        )}
                        onClick={() =>
                          setOpen((s) => ({ ...s, [it.label]: !s[it.label] }))
                        }
                      >
                        <span className="flex items-center gap-3 flex-1">
                          <Icon size={18} className="opacity-80" />
                          <span className="truncate">{it.label}</span>
                        </span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "transition-transform duration-200",
                            open[it.label] && "rotate-180"
                          )}
                        />
                      </button>

                      {open[it.label] && (
                        <div className="mt-1 mb-2 pl-6 pr-2 space-y-1">
                          {it.children!.map((c) => {
                            const CIcon = c.icon ?? ChevronRight;
                            // ativo do filho (com regra de exato para /clients)
                            const activeChild =
                              c.href === "/clients"
                                ? pathname === "/clients"
                                : matchPath(pathname!, c.href);

                            return (
                              <Link
                                key={c.label}
                                href={c.href}
                                className={cn(
                                  "flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] transition-colors",
                                  activeChild
                                    ? "bg-white/7 text-white"
                                    : "text-[rgb(var(--muted))] hover:text-white/90 hover:bg-white/5"
                                )}
                              >
                                <CIcon
                                  size={16}
                                  className="opacity-70 shrink-0"
                                />
                                <span className="truncate">{c.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-3">
          <button
            className="w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-sm"
            title="Perfil"
          >
            N
          </button>
        </div>
      </div>
    </aside>
  );
}
