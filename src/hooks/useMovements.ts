"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import { qk } from "@/lib/keys";

export type MovementType = "INCOME" | "EXPENSE";
export type MovementFrequency = "ONE_TIME" | "MONTHLY" | "ANNUAL";

export type Movement = {
  id: string;
  simulationVersionId: string;
  type: MovementType;
  amount: number;            // normalizado
  frequency: MovementFrequency;
  startDate: string;         // ISO
  endDate: string | null;    // ISO ou null
  createdAt?: string;
  updatedAt?: string;
};

function normalize(m: any): Movement {
  return {
    ...m,
    amount: Number(m.amount ?? 0),
    endDate: m.endDate ?? null,
  };
}

/** Listar por versão */
export function useMovementsOfVersion(versionId?: string | null) {
  return useQuery({
    queryKey: qk.movementsOfVersion(versionId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<any[]>(
        routes.movements.byVersion(versionId!)
      );
      return (data ?? []).map(normalize);
    },
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

/** Criar movimento */
export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      simulationVersionId: string;
      type: MovementType;
      amount: number;
      frequency: MovementFrequency;
      startDate: string;      // ISO
      endDate?: string | null;
    }) => {
      const { data } = await api.post<any>(
        routes.movements.base,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      return normalize(data);
    },
    onSuccess: (created) => {
      qc.invalidateQueries({
        queryKey: qk.movementsOfVersion(created.simulationVersionId),
      });
    },
  });
}

/** Atualizar (parcial) */
export function useUpdateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      patch: Partial<Pick<Movement, "type"|"amount"|"frequency"|"startDate"|"endDate">>;
    }) => {
      const { data } = await api.patch<any>(
        routes.movements.byId(payload.id),
        payload.patch,
        { headers: { "Content-Type": "application/json" } }
      );
      return normalize(data);
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({
        queryKey: qk.movementsOfVersion(updated.simulationVersionId),
      });
    },
  });
}

/** Deletar */
export function useDeleteMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(routes.movements.byId(id));
      return id;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
