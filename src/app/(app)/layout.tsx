"use client";

import SidebarNav from "@/components/SidebarNav";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/clients": "Clientes",
  "/clients/[id]/dashboard": "Dashboard",
  "/clients/[id]/allocations": "Alocações",
  "/clients/[id]/allocations/payments": "Pagamentos",
  "/clients/[id]/simulations": "Simulações",
};

function humanize(slug: string) {
  if (!slug) return "";
  if (slug.length > 16 && /[a-f0-9-]{16,}/i.test(slug)) return "Detalhes";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((_, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return {
      href,
      label: breadcrumbMap[href] || humanize(segments[i]),
    };
  });

  const current = crumbs[crumbs.length - 1]?.label || "Página";

  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-[rgb(var(--text))] tracking-tight">
        {current}
      </h1>

      <nav aria-label="Breadcrumb" className="mt-2 flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <div key={crumb.href} className="flex items-center">
              {i > 0 && (
                <ChevronRight className="w-4 h-4 text-[rgb(var(--stroke))]/60 mx-1" />
              )}
              {isLast ? (
                <span className="px-2 py-1 rounded-full bg-[rgb(var(--panel-2))] text-[rgb(var(--text))] border border-[rgb(var(--stroke))]/40">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="px-1 text-[rgb(var(--muted))] hover:text-[rgb(var(--brand))] transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh flex overflow-hidden bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <Breadcrumb />
        {children}
      </main>
    </div>
  );
}
