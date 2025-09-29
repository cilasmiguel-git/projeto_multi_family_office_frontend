"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";

export type ProjectionPoint = {
  year: number;
  financialAssets: number;
  realEstateAssets: number;
  totalAssets: number;
  totalWithoutInsurances: number;
};
export type ProjectionResponse = { fromYear: number; toYear: number; points: ProjectionPoint[] };
export type RunProjectionInput = { simulationId: string; lifeStatus: "ALIVE"|"DEAD"|"INVALID"; baseRateReal: number };

export function useRunProjection() {
  return useMutation({
    mutationFn: async (payload: RunProjectionInput) => {
      const { data } = await api.post<ProjectionResponse>(routes.projections.run, payload);
      return data;
    },
  });
}
