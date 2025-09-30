// src/lib/routes.ts
export const routes = {
  clients: {
    list: "/clients",
    create: "/clients",
    byId: (id: string) => `/clients/${id}`,
  },

  simulations: {
    list: "/simulations",
    create: "/simulations", // <-- ADICIONE ESTA LINHA
    byId: (id: string) => `/simulations/${id}`,
    versionsOf: (id: string) => `/simulations/${id}/versions`,
  },

  projections: { run: "/projections" },
  allocations: {
    byVersion: (versionId: string) => `/allocations/version/${versionId}`,
    create: "/allocations",
    byId: (id: string) => `/allocations/${id}`,
    update: (id: string) => `/allocations/${id}`,
    delete: (id: string) => `/allocations/${id}`,
    history: (id: string) => `/allocations/${id}/history`,
    records: "/allocations/records",
    recordsOf: (id: string) => `/allocations/${id}/records`,
  },
  movements: {
    base: "/movements",
    byVersion: (versionId: string) => `/movements/version/${versionId}`,
    byId: (id: string) => `/movements/${id}`,
  },
  insurances: {
    byVersion: (versionId: string) => `/insurances/version/${versionId}`,
    create: "/insurances",
    byId: (id: string) => `/insurances/${id}`,
  },
} as const;
