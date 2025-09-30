// src/hooks/useAllocations.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import { qk } from "@/lib/keys";

export type AllocationType = "REAL_ESTATE" | "FINANCIAL";

export type Allocation = {
  id: string;
  simulationVersionId: string;
  type: AllocationType;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AllocationRecord = {
  id: string;
  allocationId: string;
  date: string;   // ISO
  value: number;  // BRL
};

export function useAllocationsOfVersion(versionId?: string | null) {
  return useQuery({
    queryKey: qk.allocationsOfVersion(versionId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<Allocation[]>(
        routes.allocations.byVersion(versionId!)
      );
      return data ?? [];
    },
    enabled: !!versionId,
    staleTime: 30_000,
  });
}

export function useCreateAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      simulationVersionId: string;
      type: AllocationType;
      name: string;
    }) => {
      const { data } = await api.post<Allocation>(
        routes.allocations.create,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      return data;
    },
    onSuccess: (_created, vars) => {
      qc.invalidateQueries({
        queryKey: qk.allocationsOfVersion(vars.simulationVersionId),
      });
    },
  });
}

/** ✅ agora atualiza nome e/ou tipo (PATCH /allocations/{id}) */
export function useUpdateAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Allocation, "name" | "type">>;
    }) => {
      const { data } = await api.patch<Allocation>(
        routes.allocations.update(id),
        patch,
        { headers: { "Content-Type": "application/json" } }
      );
      return data;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({
        queryKey: qk.allocationsOfVersion(a.simulationVersionId),
      });
    },
  });
}

export function useDeleteAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(routes.allocations.delete(id));
      return id;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useAllocationHistory(allocationId?: string | null) {
  return useQuery({
    queryKey: qk.allocationsHistory(allocationId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<AllocationRecord[]>(
        routes.allocations.recordsOf(allocationId!)
      );
      return (data ?? [])
        .map((r) => ({ ...r, value: Number(r.value) }))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));
    },
    enabled: !!allocationId,
    staleTime: 10_000,
  });
}

export function useAppendAllocationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { allocationId: string; date: string; value: number }) => {
      const { data } = await api.post<AllocationRecord>(
        routes.allocations.records,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      return data;
    },
    onSuccess: (_rec, { allocationId }) => {
      qc.invalidateQueries({ queryKey: qk.allocationsHistory(allocationId) });
    },
  });
}
