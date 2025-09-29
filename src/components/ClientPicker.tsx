"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useClientsList } from "@/hooks/useClients";

export default function ClientPicker({
  currentClientName,
  onSelect,
}: {
  currentClientName?: string;
  onSelect: (clientId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data } = useClientsList(q, null, 50);

  return (
    <div className="relative">
      <button
        className="h-11 px-4 rounded-full border border-[rgb(var(--stroke))]/40 bg-[rgb(var(--panel-2))] flex items-center gap-2"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium">
          {currentClientName || "Selecione um cliente"}
        </span>
        <ChevronDown size={18} className="opacity-70" />
      </button>

      {open && (
  <div
    className="absolute z-50 mt-2 w-[320px] rounded-xl border border-[rgb(var(--stroke))]/40 p-2 shadow-xl"
    // força opaco (usa --panel-1-rgb se existir; se não, usa 18 20 24)
    style={{ backgroundColor: "rgb(var(--panel-1-rgb, 18 20 24))" }}
    onMouseDown={(e) => e.stopPropagation()}
  >
    <input
      className="h-9 w-full px-3 mb-2 rounded-lg border border-[rgb(var(--stroke))]/40 placeholder:text-[rgb(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40"
      style={{ backgroundColor: "rgb(var(--panel-2-rgb, 24 26 32))" }} // opaco
      placeholder="Buscar cliente..."
      value={q}
      onChange={(e) => setQ(e.target.value)}
    />

          <div className="max-h-64 overflow-auto">
            {(data?.items ?? []).map((c) => (
              <button
                key={c.id}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5"
                onClick={() => {
                  setOpen(false);
                  onSelect(c.id);
                }}
              >
                <div className="font-medium">{c.name}</div>
                {c.email && (
                  <div className="text-xs text-[rgb(var(--muted))]">
                    {c.email}
                  </div>
                )}
              </button>
            ))}

            {(!data?.items || data.items.length === 0) && (
              <div className="px-3 py-6 text-center text-sm text-[rgb(var(--muted))]">
                Nada encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
