"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api, CursorPage, qs } from "@/lib/api";
import { qk } from "@/lib/keys";
import { routes } from "@/lib/routes";

export type Client = {
  id: string;
  name: string;
  email?: string | null;
};

export function useClientsList(q: string, cursor: string | null, limit = 10) {
  return useQuery({
    queryKey: qk.clients(q, cursor, limit),
    queryFn: async () => {
      const query = qs({ q, cursor, limit });
      const { data } = await api.get<CursorPage<Client>>(
        `${routes.clients.list}?${query}`
      );
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// criação com update otimista + invalidação
export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; email?: string | null }) => {
      const { data } = await api.post<Client>(routes.clients.create, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return data;
    },
    onSuccess: (created) => {
      // atualiza qualquer lista ["clients", ...]
      qc.setQueriesData(
        { queryKey: ["clients"], exact: false },
        (old: CursorPage<Client> | undefined) =>
          old ? { ...old, items: [created, ...(old.items ?? [])] } : old
      );
      qc.invalidateQueries({ queryKey: ["clients"], exact: false });
    },
  });
}

// --- GET /clients/:id ---------------------------------
export function useClient(id?: string | null) {
  return useQuery({
    queryKey: qk.clientById(id ?? ""),
    queryFn: async () => {
      const { data } = await api.get<Client>(routes.clients.byId(id!));
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
