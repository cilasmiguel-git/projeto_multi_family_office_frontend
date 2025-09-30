"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSimulationsOfClient, SimulationRow } from "@/hooks/useSimulations";
import {
  useInsurancesOfVersion,
  useCreateInsurance,
  useUpdateInsurance,
  useDeleteInsurance,
  Insurance,
  InsuranceType,
} from "@/hooks/useInsurances";

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

// ícones
import { Plus, Pencil, Trash2 } from "lucide-react";

/** ⚠️ Se o backend aceitar apenas LIFE/DISABILITY, reduza a lista */
const TYPES: InsuranceType[] = ["LIFE", "HEALTH", "DISABILITY", "PROPERTY"];

export default function ClientInsurancesPage() {
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
  const { data: insurances = [], isLoading } = useInsurancesOfVersion(versionId);

  // 3) Mutations
  const create = useCreateInsurance();
  const update = useUpdateInsurance();
  const del = useDeleteInsurance();

  const ordered = useMemo(
    () => insurances.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [insurances]
  );

  // Dialog states
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Insurance | null>(null);
  const [deleting, setDeleting] = useState<Insurance | null>(null);

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
            Novo seguro
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="card p-4">
        {isLoading ? (
          <div className="text-sm text-[rgb(var(--muted))]">Carregando…</div>
        ) : !versionId ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhuma simulação ativa. Vá em <span className="underline">Simulações</span>.
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            Nenhum seguro ainda. Clique em <b>Novo seguro</b>.
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--stroke))]/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-3 py-2">Nome</th>
                  <th className="text-left px-3 py-2">Tipo</th>
                  <th className="text-left px-3 py-2">Início</th>
                  <th className="text-right px-3 py-2">Duração (m)</th>
                  <th className="text-right px-3 py-2">Prêmio mensal</th>
                  <th className="text-right px-3 py-2">Cobertura</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s) => (
                  <tr key={s.id} className="border-t border-[rgb(var(--stroke))]/20">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.type}</td>
                    <td className="px-3 py-2">
                      {new Date(s.startDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {s.durationMonths.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {s.monthlyPremium.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {s.insuredAmount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditing(s)}
                          disabled={update.isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleting(s)}
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

      {/* Dialog: Criar */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Novo seguro</DialogTitle>
            <DialogDescription>Preencha os campos para adicionar um seguro.</DialogDescription>
          </DialogHeader>

          <InsuranceForm
            formId="create-ins-form"
            defaultValues={{
              type: "LIFE",
              name: "",
              startDate: new Date().toISOString().slice(0, 10),
              durationMonths: 0,
              monthlyPremium: 0,
              insuredAmount: 0,
            }}
            submitting={create.isPending}
            onSubmit={async (vals) => {
              if (!versionId) return;
              await create.mutateAsync({
                simulationVersionId: versionId,
                type: vals.type,
                name: vals.name.trim(),
                startDate: new Date(vals.startDate).toISOString(),
                durationMonths: vals.durationMonths,
                monthlyPremium: vals.monthlyPremium,
                insuredAmount: vals.insuredAmount,
              });
              toast({ description: "Seguro criado." });
              setOpenCreate(false);
            }}
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="create-ins-form" disabled={create.isPending}>
              {create.isPending ? "Criando..." : "Criar seguro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Editar seguro</DialogTitle>
            <DialogDescription>Atualize os campos do seguro.</DialogDescription>
          </DialogHeader>

          {editing && (
            <InsuranceForm
              formId="edit-ins-form"
              defaultValues={{
                type: editing.type,
                name: editing.name,
                startDate: editing.startDate.slice(0, 10),
                durationMonths: editing.durationMonths,
                monthlyPremium: editing.monthlyPremium,
                insuredAmount: editing.insuredAmount,
              }}
              submitting={update.isPending}
              onSubmit={async (vals) => {
                await update.mutateAsync({
                  id: editing.id,
                  patch: {
                    type: vals.type,
                    name: vals.name.trim(),
                    startDate: new Date(vals.startDate).toISOString(),
                    durationMonths: vals.durationMonths,
                    monthlyPremium: vals.monthlyPremium,
                    insuredAmount: vals.insuredAmount,
                  },
                });
                toast({ description: "Seguro atualizado." });
                setEditing(null);
              }}
            />
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Fechar
            </Button>
            <Button type="submit" form="edit-ins-form" disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir seguro?</AlertDialogTitle>
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
                toast({ description: "Seguro excluído." });
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

/* ---------- Form reutilizável ---------- */
type FormValues = {
  type: InsuranceType;
  name: string;
  startDate: string;     // yyyy-mm-dd
  durationMonths: number;
  monthlyPremium: number;
  insuredAmount: number;
};

function InsuranceForm({
  formId,
  defaultValues,
  onSubmit,
  submitting,
}: {
  formId: string;
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [type, setType] = useState<InsuranceType>(defaultValues.type);
  const [name, setName] = useState<string>(defaultValues.name);
  const [startDate, setStartDate] = useState<string>(defaultValues.startDate);
  const [durationMonths, setDurationMonths] = useState<string>(String(defaultValues.durationMonths));
  const [monthlyPremium, setMonthlyPremium] = useState<string>(String(defaultValues.monthlyPremium));
  const [insuredAmount, setInsuredAmount] = useState<string>(String(defaultValues.insuredAmount));

  const validNumber = (v: string) => v !== "" && !Number.isNaN(Number(v));
  const canSubmit =
    name.trim().length > 0 &&
    !!startDate &&
    validNumber(durationMonths) &&
    validNumber(monthlyPremium) &&
    validNumber(insuredAmount) &&
    Number(durationMonths) >= 0 &&
    Number(monthlyPremium) >= 0 &&
    Number(insuredAmount) >= 0;

  return (
    <form
      id={formId}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;
        await onSubmit({
          type,
          name,
          startDate,
          durationMonths: Number(durationMonths),
          monthlyPremium: Number(monthlyPremium),
          insuredAmount: Number(insuredAmount),
        });
      }}
    >
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v: InsuranceType) => setType(v)}>
          <SelectTrigger className="w-full">
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
        <Label>Nome</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do seguro"
        />
      </div>

      <div className="space-y-1">
        <Label>Início</Label>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>Duração (meses)</Label>
        <Input
          type="number"
          min={0}
          step={1}
          value={durationMonths}
          onChange={(e) => setDurationMonths(e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="space-y-1">
        <Label>Prêmio mensal (R$)</Label>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={monthlyPremium}
          onChange={(e) => setMonthlyPremium(e.target.value)}
          placeholder="0,00"
        />
      </div>

      <div className="space-y-1">
        <Label>Cobertura (R$)</Label>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={insuredAmount}
          onChange={(e) => setInsuredAmount(e.target.value)}
          placeholder="0,00"
        />
      </div>
      {/* sem botões aqui — ficam no DialogFooter */}
    </form>
  );
}
