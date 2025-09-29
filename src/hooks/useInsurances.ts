"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/keys";
import { routes } from "@/lib/routes";

export type Insurance = {
  id: string;
  simulationVersionId: string;
  name: string;
  type: "LIFE" | "DISABILITY";
  startDate: string;
  durationMonths: number;
  monthlyPremium: number;
  insuredAmount: number;
};

export function useInsurancesByVersion(versionId: string) {
  return useQuery({
    queryKey: qk.insurancesOfVersion(versionId),
    queryFn: async () => {
      const { data } = await api.get<Insurance[]>(routes.insurances.byVersion(versionId));
      return data;
    },
    enabled: !!versionId,
  });
}

export function useCreateInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Insurance, "id">) => {
      const { data } = await api.post<Insurance>(routes.insurances.create, payload);
      return data;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: qk.insurancesOfVersion(created.simulationVersionId) });
    },
  });
}
