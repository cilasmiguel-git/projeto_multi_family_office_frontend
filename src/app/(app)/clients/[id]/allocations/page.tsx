// src/app/(app)/clients/[id]/allocations/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSimulationsOfClient, SimulationRow } from "@/hooks/useSimulations";
import {
  useAllocationsOfVersion,
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
  useAppendAllocationRecord,
  Allocation,
  AllocationType,
} from "@/hooks/useAllocations";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

// ícones
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ClientAllocationsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id!;
  const router = useRouter();
  const { toast } = useToast();

  // Simulação ativa (usa localStorage se houver)
  const { data: sims } = useSimulationsOfClient(clientId);
  const activeSim: SimulationRow | null = useMemo(() => {
    const list = sims ?? [];
    const fromLS =
      typeof window !== "undefined"
        ? localStorage.getItem("activeSimulationId")
        : null;
    return (
      (fromLS && list.find((s) => s.simulationId === fromLS)) || list[0] || null
    );
  }, [sims]);

  const versionId = activeSim?.versionId ?? null;

  // Dados
  const { data: allocations = [], isLoading } = useAllocationsOfVersion(versionId);
  const [selected, setSelected] = useState<Allocation | null>(null);

  const ordered = useMemo(
    () => allocations.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [allocations]
  );

  // Mutations
  const create = useCreateAllocation();
  const update = useUpdateAllocation();
  const del = useDeleteAllocation();

  // Dialog states
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [deleting, setDeleting] = useState<Allocation | null>(null);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="p-4">
        <div className="flex items-center justify-end gap-3 flex-wrap">
          <Button
            onClick={() => setOpenCreate(true)}
            disabled={!versionId}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova alocação
          </Button>
        </div>
      </div>

      {/* Lista + painel */}
      <div className="card p-4">
        {isLoading ? (
          <div className="text-sm text-[rgb(var(--muted))]">Carregando…</div>
        ) : !versionId ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhuma simulação ativa. Vá em <span className="underline">Simulações</span>.
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhuma alocação ainda. Clique em <b>Nova alocação</b>.
          </div>
        ) : (
            <div className="rounded-xl border border-[rgb(var(--stroke))]/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-3 py-2">Nome</th>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-right px-3 py-2">Criada em</th>
                    <th className="px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((a) => (
                    <tr
                      key={a.id}
                      className={cn(
                        "border-t border-[rgb(var(--stroke))]/20 hover:bg-white/5 cursor-pointer",
                        selected?.id === a.id && "bg-white/7"
                      )}
                      onClick={() => setSelected(a)}
                    >
                      <td className="px-3 py-2">{a.name}</td>
                      <td className="px-3 py-2">
                        {a.type === "REAL_ESTATE" ? "Imobilizado" : "Financeiro"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(a);
                            }}
                            disabled={update.isPending}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(a);
                            }}
                            disabled={del.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/clients/${clientId}/allocations/${a.id}/invest`);
                            }}
                          >
                            Investir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>

      {/* Dialog: Nova alocação */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Nova alocação</DialogTitle>
            <DialogDescription>Preencha os campos abaixo.</DialogDescription>
          </DialogHeader>

          <AllocationForm
            formId="create-allocation-form"
            defaultValues={{ name: "", type: "FINANCIAL" }}
            onSubmit={async (vals) => {
              if (!versionId) return;
              await create.mutateAsync({
                simulationVersionId: versionId,
                type: vals.type,
                name: vals.name.trim(),
              });
              toast({ description: "Alocação criada." });
              setOpenCreate(false);
            }}
            submitting={create.isPending}
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="create-allocation-form" disabled={create.isPending}>
              {create.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar alocação */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Editar alocação</DialogTitle>
            <DialogDescription>Atualize os campos abaixo.</DialogDescription>
          </DialogHeader>

          {editing && (
            <AllocationForm
              formId="edit-allocation-form"
              defaultValues={{ name: editing.name, type: editing.type }}
              onSubmit={async (vals) => {
                await update.mutateAsync({
                  id: editing.id,
                  patch: { name: vals.name.trim(), type: vals.type },
                });
                toast({ description: "Alocação atualizada." });
                setEditing(null);
              }}
              submitting={update.isPending}
            />
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Fechar
            </Button>
            <Button type="submit" form="edit-allocation-form" disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir alocação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={async () => {
                if (!deleting) return;
                await del.mutateAsync(deleting.id);
                toast({ description: "Alocação excluída." });
                if (selected?.id === deleting.id) setSelected(null);
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* --------- Form reutilizável --------- */
function AllocationForm({
  formId,
  defaultValues,
  onSubmit,
  submitting,
}: {
  formId: string;
  defaultValues: { name: string; type: AllocationType };
  onSubmit: (vals: { name: string; type: AllocationType }) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [name, setName] = useState(defaultValues.name);
  const [type, setType] = useState<AllocationType>(defaultValues.type);

  const canSubmit = name.trim().length > 0;

  return (
    <form
      id={formId}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;
        await onSubmit({ name, type });
      }}
    >
      <div className="space-y-1">
        <Label>Nome</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Reserva de emergência"
        />
      </div>
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v: AllocationType) => setType(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FINANCIAL">Financeiro</SelectItem>
            <SelectItem value="REAL_ESTATE">Imobilizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* botões ficam no DialogFooter */}
    </form>
  );
}
