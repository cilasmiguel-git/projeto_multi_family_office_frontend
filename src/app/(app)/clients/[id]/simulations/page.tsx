// src/app/(app)/clients/[id]/simulations/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  SimulationRow,
  useCreateSimulation,
  useSimulationsOfClient,
  useSimulationVersions,
  useUpdateSimulation,
  useDeleteSimulation,
  useCreateSimulationVersion,
} from "@/hooks/useSimulations";
import { cn } from "@/lib/utils";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, GitBranchPlus, Plus } from "lucide-react";

export default function ClientSimulationsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id!;
  const { toast } = useToast();

  const { data: sims, isLoading } = useSimulationsOfClient(clientId);
  const [selected, setSelected] = useState<SimulationRow | null>(null);

  // versões da simulação selecionada
  const { data: versions = [], isLoading: loadingVersions } =
    useSimulationVersions(selected?.simulationId ?? null);

  // mutations sim
  const create = useCreateSimulation();
  const updateSim = useUpdateSimulation();
  const deleteSim = useDeleteSimulation();
  const createVersion = useCreateSimulationVersion();

  const orderedSims = useMemo(
    () =>
      (sims ?? [])
        .slice()
        .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate)),
    [sims]
  );

  // dialogs
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<SimulationRow | null>(null);
  const [deleting, setDeleting] = useState<SimulationRow | null>(null);
  const [openNewVersion, setOpenNewVersion] = useState(false);
  const [fromVersionId, setFromVersionId] = useState<string | "none">("none");

  return (
    <div className="space-y-6">
      {/* Cabeçalho apenas com ação */}
      <div className="p-4">
        <div className="flex items-center justify-end">
          <Button className={cn("btn btn-primary")} onClick={() => setOpenCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova simulação
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="card p-4">
        {isLoading ? (
          <div className="text-sm text-[rgb(var(--muted))]">Carregando…</div>
        ) : orderedSims.length === 0 ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhuma simulação ainda. Clique em <b>Nova simulação</b>.
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_420px] gap-4">
            {/* Tabela */}
            <div className="rounded-xl border border-[rgb(var(--stroke))]/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-3 py-2">Nome</th>
                    <th className="text-right px-3 py-2">Taxa real</th>
                    <th className="text-right px-3 py-2">Criada em</th>
                    <th className="px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {orderedSims.map((s) => (
                    <tr
                      key={s.versionId || `${s.simulationId}-${s.version}`}
                      className={cn(
                        "border-t border-[rgb(var(--stroke))]/20 hover:bg-white/5 cursor-pointer",
                        selected?.simulationId === s.simulationId && "bg-white/7"
                      )}
                      onClick={() => setSelected(s)}
                    >
                      <td className="px-3 py-2">{s.simulationName}</td>
                      <td className="px-3 py-2 text-right">
                        {(s.baseRateReal * 100).toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}
                        %
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Date(s.startDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(s);
                            }}
                            disabled={updateSim.isPending}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(s);
                            }}
                            disabled={deleteSim.isPending}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Excluir
                          </Button>
                          <Link
                            href={`/clients/${clientId}/projection`}
                            className="btn h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              localStorage.setItem(
                                "activeSimulationId",
                                s.simulationId
                              );
                            }}
                          >
                            Ir para projeção
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Painel lateral de versões */}
            <div className="rounded-xl border border-[rgb(var(--stroke))]/40 p-3 bg-[rgb(var(--panel-2))]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-[rgb(var(--muted))]">Versões</div>

                <Button
                  size="sm"
                  onClick={() => {
                    if (!selected) return;
                    setFromVersionId("none");
                    setOpenNewVersion(true);
                  }}
                  disabled={!selected}
                  className="gap-1.5"
                >
                  <GitBranchPlus className="h-4 w-4" />
                  Nova versão
                </Button>
              </div>

              {!selected ? (
                <div className="text-sm text-[rgb(var(--muted))]">
                  Selecione uma simulação.
                </div>
              ) : loadingVersions ? (
                <div className="text-sm text-[rgb(var(--muted))]">
                  Carregando versões…
                </div>
              ) : versions.length === 0 ? (
                <div className="text-sm text-[rgb(var(--muted))]">
                  Sem versões ainda.
                </div>
              ) : (
                <ul className="space-y-2">
                  {versions
                    .slice()
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                      <li
                        key={v.id}
                        className="rounded-lg px-3 py-2 bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Projeção {v.version}</div>
                          <div className="flex items-center gap-2">
                            {v.isCurrentSnapshot && (
                              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                corrente
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setFromVersionId(v.id);
                                setOpenNewVersion(true);
                              }}
                            >
                              Ramificar
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-[rgb(var(--muted))] mt-1">
                          {new Date(v.createdAt).toLocaleString("pt-BR")} • {v.lifeStatus}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

{/* Dialog: Nova simulação */}
<Dialog open={openCreate} onOpenChange={setOpenCreate}>
  <DialogContent size="md">
    <DialogHeader>
      <DialogTitle>Nova simulação</DialogTitle>
      <DialogDescription>Defina nome e taxa real.</DialogDescription>
    </DialogHeader>

    <CreateSimulationForm
      formId="create-sim-form"
      defaultValues={{ name: "", ratePct: 4 }}
      submitting={create.isPending}
      onSubmit={async (vals) => {
        await create.mutateAsync({
          clientId,
          name: vals.name,
          baseRateReal: vals.ratePct / 100,
        });
        toast({ description: "Simulação criada." });
        setOpenCreate(false);
      }}
    />

    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpenCreate(false)}>
        Cancelar
      </Button>
      <Button type="submit" form="create-sim-form" disabled={create.isPending}>
        {create.isPending ? "Criando..." : "Criar simulação"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* Dialog: Editar simulação */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Editar simulação</DialogTitle>
            <DialogDescription>Atualize os dados da simulação.</DialogDescription>
          </DialogHeader>
          {editing && (
            <EditSimulationForm
              defaultValues={{
                name: editing.simulationName,
                baseRateReal: editing.baseRateReal,
              }}
              submitting={updateSim.isPending}
              onSubmit={async (vals) => {
                await updateSim.mutateAsync({
                  id: editing.simulationId,
                  patch: { name: vals.name, baseRateReal: vals.baseRateReal },
                });
                toast({ description: "Simulação atualizada." });
                setEditing(null);
              }}
            />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir simulação */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir simulação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não poderá ser desfeita e removerá a simulação e suas versões.
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
                await deleteSim.mutateAsync(deleting.simulationId);
                toast({ description: "Simulação excluída." });
                if (selected?.simulationId === deleting.simulationId) setSelected(null);
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Nova versão */}
      <Dialog open={openNewVersion} onOpenChange={setOpenNewVersion}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Nova versão</DialogTitle>
            <DialogDescription>
              Crie uma nova versão (opcionalmente a partir de uma existente).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="text-sm text-[rgb(var(--muted))]">Criar a partir de</div>
            <Select value={fromVersionId} onValueChange={(v) => setFromVersionId(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Em branco</SelectItem>
                {versions
                  .slice()
                  .sort((a, b) => b.version - a.version)
                  .map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Projeção {v.version}
                      {v.isCurrentSnapshot ? " (corrente)" : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenNewVersion(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selected) return;
                await createVersion.mutateAsync({
                  simulationId: selected.simulationId,
                  clientId,
                  fromVersionId: fromVersionId === "none" ? undefined : fromVersionId,
                });
                toast({ description: "Versão criada." });
                setOpenNewVersion(false);
              }}
              disabled={createVersion.isPending || !selected}
            >
              {createVersion.isPending ? "Criando..." : "Criar versão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Form de criação ---------- */
// CreateSimulationForm.tsx (pode estar no mesmo arquivo)
function CreateSimulationForm({
  defaultValues,
  onSubmit,
  submitting,
  formId = "create-sim-form",
}: {
  defaultValues: { name: string; ratePct: number };
  onSubmit: (vals: { name: string; ratePct: number }) => Promise<void> | void;
  submitting?: boolean;
  formId?: string;
}) {
  const [name, setName] = useState(defaultValues.name);
  const [ratePct, setRatePct] = useState(String(defaultValues.ratePct));
  const canSubmit = name.trim().length > 0 && !Number.isNaN(Number(ratePct));

  return (
    <form
      id={formId}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSubmit({ name, ratePct: Number(ratePct) });
      }}
    >
      <div className="space-y-1">
        <div className="text-xs text-[rgb(var(--muted))]">Nome</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <div className="text-xs text-[rgb(var(--muted))]">Taxa real (%)</div>
        <Input
          type="number"
          step={0.1}
          value={ratePct}
          onChange={(e) => setRatePct(e.target.value)}
        />
      </div>
    </form>
  );
}


/* ---------- Form de edição ---------- */
function EditSimulationForm({
  defaultValues,
  onSubmit,
  submitting,
  formId = "edit-sim-form",
}: {
  defaultValues: { name: string; baseRateReal: number };
  onSubmit: (vals: { name: string; baseRateReal: number }) => Promise<void> | void;
  submitting?: boolean;
  formId?: string;
}) {
  const [name, setName] = useState(defaultValues.name);
  const [rate, setRate] = useState(String((defaultValues.baseRateReal * 100).toFixed(2)));
  const canSubmit = name.trim().length > 0 && !Number.isNaN(Number(rate));

  return (
    <form
      id={formId}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSubmit({ name, baseRateReal: Number(rate) / 100 });
      }}
    >
      <div className="space-y-1">
        <div className="text-xs text-[rgb(var(--muted))]">Nome</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <div className="text-xs text-[rgb(var(--muted))]">Taxa real (%)</div>
        <Input
          type="number"
          step={0.1}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
      </div>
      {/* ⛔️ sem botão aqui */}
    </form>
  );
}

