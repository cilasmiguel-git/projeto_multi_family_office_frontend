// src/app/(app)/clients/[id]/movements/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSimulationsOfClient, SimulationRow } from "@/hooks/useSimulations";
import {
  useMovementsOfVersion,
  useCreateMovement,
  useUpdateMovement,
  useDeleteMovement,
  Movement,
  MovementType,
  MovementFrequency,
} from "@/hooks/useMovements";

import { Plus, Pencil, Trash2 } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const TYPES: MovementType[] = ["INCOME", "EXPENSE"];
const FREQUENCIES: MovementFrequency[] = ["ONE_TIME", "MONTHLY", "ANNUAL"];

export default function ClientMovementsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id!;
  const { toast } = useToast();

  // 1) Simulação ativa
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

  // 2) Listagem
  const { data: movements = [], isLoading } = useMovementsOfVersion(versionId);

  // 3) Mutations
  const create = useCreateMovement();
  const update = useUpdateMovement();
  const del = useDeleteMovement();

  const ordered = useMemo(
    () =>
      movements
        .slice()
        .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate)),
    [movements]
  );

  // --------- Dialog state ---------
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [deleting, setDeleting] = useState<Movement | null>(null);

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
            Novo movimento
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="card p-4">
        {isLoading ? (
          <div className="text-sm text-[rgb(var(--muted))]">Carregando…</div>
        ) : !versionId ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhuma simulação ativa. Vá em{" "}
            <span className="underline">Simulações</span>.
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhum movimento ainda. Clique em <b>Novo movimento</b>.
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--stroke))]/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-3 py-2">Tipo</th>
                  <th className="text-right px-3 py-2">Valor</th>
                  <th className="text-left px-3 py-2">Frequência</th>
                  <th className="text-left px-3 py-2">Início</th>
                  <th className="text-left px-3 py-2">Fim</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-[rgb(var(--stroke))]/20"
                  >
                    <td className="px-3 py-2">
                      {m.type === "INCOME" ? "INCOME" : "EXPENSE"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {m.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-3 py-2">{m.frequency}</td>
                    <td className="px-3 py-2">
                      {new Date(m.startDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">
                      {m.endDate
                        ? new Date(m.endDate).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8"
                          onClick={() => setEditing(m)}
                          disabled={update.isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          onClick={() => setDeleting(m)}
                          disabled={del.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
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

      {/* -------- Dialog: Criar -------- */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo movimento</DialogTitle>
            <DialogDescription>
              Preencha os campos para adicionar um movimento.
            </DialogDescription>
          </DialogHeader>
          <MovementForm
            defaultValues={{
              type: "INCOME",
              amount: 0,
              frequency: "ONE_TIME",
              startDate: new Date().toISOString().slice(0, 10),
              endDate: "",
            }}
            onSubmit={async (values) => {
              if (!versionId) return;
              const payload = {
                simulationVersionId: versionId,
                type: values.type,
                amount: values.amount,
                frequency: values.frequency,
                startDate: new Date(values.startDate).toISOString(),
                endDate: values.endDate
                  ? new Date(values.endDate).toISOString()
                  : null,
              };
              await create.mutateAsync(payload);
              toast({ description: "Movimento criado com sucesso." });
              setOpenCreate(false);
            }}
            submitting={create.isPending}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- Dialog: Editar -------- */}
      <Dialog
        open={!!editing}
        onOpenChange={(open: boolean) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Editar movimento</DialogTitle>
            <DialogDescription>Atualize os campos abaixo.</DialogDescription>
          </DialogHeader>

          {editing && (
            <MovementForm
              defaultValues={{
                type: editing.type,
                amount: editing.amount,
                frequency: editing.frequency,
                startDate: editing.startDate.slice(0, 10),
                endDate: editing.endDate ? editing.endDate.slice(0, 10) : "",
              }}
              onSubmit={async (values) => {
                await update.mutateAsync({
                  id: editing.id,
                  patch: {
                    type: values.type,
                    amount: values.amount,
                    frequency: values.frequency,
                    startDate: new Date(values.startDate).toISOString(),
                    endDate: values.endDate
                      ? new Date(values.endDate).toISOString()
                      : null,
                  },
                });
                toast({ description: "Movimento atualizado." });
                setEditing(null);
              }}
              submitting={update.isPending}
            />
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- AlertDialog: Excluir -------- */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimento?</AlertDialogTitle>
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
                toast({ description: "Movimento excluído." });
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

/* --------- Form reutilizável (shadcn) --------- */

type FormValues = {
  type: MovementType;
  amount: number;
  frequency: MovementFrequency;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd | ""
};

function MovementForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [type, setType] = useState<MovementType>(defaultValues.type);
  const [frequency, setFrequency] = useState<MovementFrequency>(
    defaultValues.frequency
  );
  const [amount, setAmount] = useState<string>(String(defaultValues.amount));
  const [startDate, setStartDate] = useState<string>(defaultValues.startDate);
  const [endDate, setEndDate] = useState<string>(defaultValues.endDate);

  const canSubmit =
    amount !== "" &&
    !Number.isNaN(Number(amount)) &&
    Number(amount) >= 0 &&
    !!startDate;

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSubmit({
          type,
          amount: Number(amount),
          frequency,
          startDate,
          endDate,
        });
      }}
    >
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v: MovementType) => setType(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Valor (R$)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
        />
      </div>

      <div className="space-y-1">
        <Label>Frequência</Label>
        <Select
          value={frequency}
          onValueChange={(v: MovementFrequency) => setFrequency(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Início</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Fim (opcional)</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
