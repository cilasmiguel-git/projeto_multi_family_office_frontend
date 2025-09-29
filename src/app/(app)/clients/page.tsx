"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useClientsList, useCreateClient } from "@/hooks/useClients";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
  // busca/paginação
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isFetching } = useClientsList(q, cursor, 20);

  // modal
  const [open, setOpen] = useState(false);
  const create = useCreateClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // fecha modal no ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // foco ao abrir
  const nameRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 0);
  }, [open]);

  // ⬇️ agora aguardamos a criação de fato
  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name, email: email || null });
      setName("");
      setEmail("");
      setOpen(false);
      // opcional: se você usa cursor para paginação, pode resetar p/ ver o novo no topo
      setCursor(null);
    } catch (e) {
      // aqui você pode plugar um toast
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="card p-4 flex items-center gap-3 shrink-0">
        <input
          className="input-ghost w-[320px]"
          placeholder="Buscar cliente..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCursor(null); // reseta paginação ao buscar
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            + Novo cliente
          </button>
        </div>
      </div>

      {/* Datatable */}
      <div className="card p-0 flex-1 min-h-0 overflow-hidden">
        <div className="border-b border-[rgb(var(--stroke))]/40 px-4 py-3 text-sm text-[rgb(var(--muted))] flex items-center justify-between">
          <span>{isFetching ? "Carregando..." : `${data?.items?.length ?? 0} itens`}</span>
          {data?.nextCursor && (
            <button className="btn h-8" onClick={() => setCursor(data.nextCursor!)}>
              Carregar mais
            </button>
          )}
        </div>

        <div className="overflow-auto max-h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[rgb(var(--panel-1))] z-10">
              <tr className="text-left text-[rgb(var(--muted))]">
                <th className="px-4 py-2 font-normal">Nome</th>
                <th className="px-4 py-2 font-normal">Email</th>
                <th className="px-4 py-2 font-normal w-[140px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((c) => (
                <tr key={c.id} className="border-t border-[rgb(var(--stroke))]/30 hover:bg-white/5">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link href={`/clients/${c.id}/dashboard`} className="btn h-8">
                        Abrir
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {(!data?.items || data.items.length === 0) && !isFetching && (
                <tr>
                  <td className="px-4 py-8 text-center text-[rgb(var(--muted))]" colSpan={3}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.nextCursor && (
          <div className="border-t border-[rgb(var(--stroke))]/40 px-4 py-3">
            <button className="btn w-full" onClick={() => setCursor(data.nextCursor!)}>
              Carregar mais
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative card p-4 w-full max-w-md z-10">
            <h3 className="text-base font-semibold mb-3">Novo cliente</h3>
            <div className="space-y-3">
              <input
                ref={nameRef}
                className="input-ghost w-full"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="input-ghost w-full"
                placeholder="Email (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
              <button
                className={cn("btn btn-primary", create.isPending && "opacity-70 cursor-wait")}
                onClick={onCreate}
                disabled={create.isPending}
              >
                {create.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
