"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import { qk } from "@/lib/keys";

/** ⚠️ garanta que esses tipos existem no backend.
 * Se o backend aceitar só "LIFE" e "DISABILITY", ajuste aqui e no UI. */
export type InsuranceType = "LIFE" | "HEALTH" | "DISABILITY" | "PROPERTY";

export type Insurance = {
  id: string;
  simulationVersionId: string;
  type: InsuranceType;
  name: string;
  startDate: string;       // ISO
  durationMonths: number;
  monthlyPremium: number;  // normalizado para number
  insuredAmount: number;   // normalizado para number
  createdAt: string;
  updatedAt: string;
};

function normalize(i: any): Insurance {
  return {
    ...i,
    monthlyPremium: Number(i.monthlyPremium ?? 0),
    insuredAmount: Number(i.insuredAmount ?? 0),
  };
}

/** Listar por versão */
export function useInsurancesOfVersion(versionId?: string | null) {
  return useQuery({
    queryKey: qk.insurancesOfVersion(versionId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<any[]>(
        routes.insurances.byVersion(versionId!)
      );
      return (data ?? []).map(normalize);
    },
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

/** Criar seguro */
export function useCreateInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      simulationVersionId: string;
      type: InsuranceType;
      name: string;
      startDate: string;        // ISO
      durationMonths: number;
      monthlyPremium: number;
      insuredAmount: number;
    }) => {
      const { data } = await api.post<any>(
        routes.insurances.create,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      return normalize(data);
    },
    onSuccess: (created) => {
      qc.invalidateQueries({
        queryKey: qk.insurancesOfVersion(created.simulationVersionId),
      });
    },
  });
}

/** Atualizar seguro (PATCH /insurances/{id}) */
export function useUpdateInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<
        Insurance,
        "type" | "name" | "startDate" | "durationMonths" | "monthlyPremium" | "insuredAmount" | "simulationVersionId"
      >>;
    }) => {
      const { data } = await api.patch<any>(
        routes.insurances.byId(id),
        patch,
        { headers: { "Content-Type": "application/json" } }
      );
      return normalize(data);
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({
        queryKey: qk.insurancesOfVersion(updated.simulationVersionId),
      });
    },
  });
}

/** Deletar seguro */
export function useDeleteInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(routes.insurances.byId(id));
      return id;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
