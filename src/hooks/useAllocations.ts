"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/keys";
import { routes } from "@/lib/routes";

export type AllocationRecord = { id: string; allocationId: string; date: string; value: number };

export function useAllocationHistory(allocationId: string) {
  return useQuery({
    queryKey: qk.allocationsHistory(allocationId),
    queryFn: async () => {
      const { data } = await api.get<AllocationRecord[]>(routes.allocations.history(allocationId));
      return data;
    },
    enabled: !!allocationId,
  });
}

export function useAppendAllocationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { allocationId: string; date: string; value: number }) => {
      const { data } = await api.post<AllocationRecord>(routes.allocations.records, payload);
      return data;
    },
    onSuccess: (_rec, { allocationId }) => {
      qc.invalidateQueries({ queryKey: qk.allocationsHistory(allocationId) });
    },
  });
}
