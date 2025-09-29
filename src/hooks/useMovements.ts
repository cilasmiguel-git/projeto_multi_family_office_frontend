"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/keys";
import { routes } from "@/lib/routes";

export type Movement = {
  id: string;
  simulationVersionId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: "ONCE" | "MONTHLY" | "YEARLY";
  startDate: string;
  endDate?: string | null;
};

export function useMovementsByVersion(versionId: string) {
  return useQuery({
    queryKey: qk.movementsOfVersion(versionId),
    queryFn: async () => {
      const { data } = await api.get<Movement[]>(routes.movements.byVersion(versionId));
      return data;
    },
    enabled: !!versionId,
  });
}
