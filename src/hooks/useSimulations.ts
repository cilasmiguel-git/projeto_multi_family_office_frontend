// src/hooks/useSimulations.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import { qk } from "@/lib/keys";

export type Simulation = {
  id: string;
  clientId: string;
  name: string;
  baseRateReal: number;
  createdAt: string;
  updatedAt: string;
};

export type SimulationVersion = {
  id: string;
  simulationId: string;
  version: number;
  startDate: string;
  lifeStatus: "ALIVE" | "DEAD" | "INVALID";
  isLegacy: boolean;
  isCurrentSnapshot: boolean;
  createdAt: string;
};

// Lista por cliente
export function useSimulationsOfClient(clientId?: string | null) {
  return useQuery({
    queryKey: qk.simulationsOfClient(clientId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<Simulation[]>(
        `${routes.simulations.list}?clientId=${clientId}`
      );
      return data;
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });
}

// Versões
export function useSimulationVersions(simulationId?: string | null) {
  return useQuery({
    queryKey: qk.simulationVersions(simulationId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<SimulationVersion[]>(
        routes.simulations.versionsOf(simulationId!)
      );
      return data;
    },
    enabled: !!simulationId,
    staleTime: 30_000,
  });
}

// Criar simulação
export function useCreateSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clientId: string;
      name: string;
      baseRateReal: number; // ex.: 0.04 para 4%
    }) => {
      const { data } = await api.post<Simulation>(
        routes.simulations.create,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      return data;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: qk.simulationsOfClient(created.clientId) });
    },
  });
}
