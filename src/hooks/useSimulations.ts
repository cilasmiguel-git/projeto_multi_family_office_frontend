// src/hooks/useSimulations.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import { qk } from "@/lib/keys";

export type SimulationRow = {
  simulationId: string;
  simulationName: string;
  baseRateReal: number;
  versionId: string;
  version: number;
  startDate: string; // ISO
  lifeStatus: "ALIVE" | "DEAD" | "INVALID";
  isCurrentSnapshot: boolean;
  isLegacy: boolean;
};

export function useSimulationsOfClient(clientId?: string | null) {
  return useQuery({
    queryKey: qk.simulationsOfClient(clientId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<SimulationRow[]>(
        `${routes.simulations.list}?clientId=${clientId}`
      );
      return data ?? [];
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });
}

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

export function useSimulationVersions(simulationId?: string | null) {
  return useQuery({
    queryKey: qk.simulationVersions(simulationId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<SimulationVersion[]>(
        routes.simulations.versionsOf(simulationId!)
      );
      return data ?? [];
    },
    enabled: !!simulationId,
    staleTime: 30_000,
  });
}

/** Create simulation */
export function useCreateSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clientId: string;
      name: string;
      baseRateReal: number;
    }) => {
      const { data } = await api.post(routes.simulations.create, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return data;
    },
    onSuccess: (_created, vars) => {
      qc.invalidateQueries({ queryKey: qk.simulationsOfClient(vars.clientId) });
    },
  });
}

/** Update simulation */
export function useUpdateSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string; // simulationId
      patch: { name?: string; baseRateReal?: number };
    }) => {
      const { data } = await api.patch(
        routes.simulations.byId(payload.id),
        payload.patch,
        { headers: { "Content-Type": "application/json" } }
      );
      return data;
    },
    onSuccess: (res: any) => {
      // res deve conter clientId (se não contiver, invalide lista inteira)
      qc.invalidateQueries();
    },
  });
}

/** Delete simulation */
export function useDeleteSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(routes.simulations.byId(id));
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

/** Create new version (POST /simulations/{id}/versions) */
export function useCreateSimulationVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      simulationId: string;
      clientId: string;               // <— adicionado
      fromVersionId?: string | null;
    }) => {
      const body = payload.fromVersionId ? { fromVersionId: payload.fromVersionId } : {};
      const { data } = await api.post(
        routes.simulations.versionsOf(payload.simulationId),
        body,
        { headers: { "Content-Type": "application/json" } }
      );
      return data as SimulationVersion;
    },
    onSuccess: (_created, vars) => {
      // Recarrega SOMENTE o que precisa e com as chaves corretas
      qc.invalidateQueries({ queryKey: qk.simulationVersions(vars.simulationId) });
      qc.invalidateQueries({ queryKey: qk.simulationsOfClient(vars.clientId) });
    },
  });
}

