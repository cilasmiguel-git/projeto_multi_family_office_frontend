export const routes = {
  clients: {
    list: "/clients", // GET ?q=&limit=&cursor=
    create: "/clients", // POST
    byId: (id: string) => `/clients/${id}`,
  },

  simulations: {
    list: "/simulations", // (se tiver)
    byId: (id: string) => `/simulations/${id}`,
    versionsOf: (id: string) => `/simulations/${id}/versions`,
  },

  projections: {
    run: "/projections", // POST { simulationId, lifeStatus, baseRateReal }
  },

  allocations: {
    byVersion: (versionId: string) => `/allocations/version/${versionId}`, // GET
    create: "/allocations", // POST
    byId: (id: string) => `/allocations/${id}`,
    update: (id: string) => `/allocations/${id}`, // PATCH
    delete: (id: string) => `/allocations/${id}`, // DELETE
    history: (id: string) => `/allocations/${id}/history`, // GET
    records: "/allocations/records", // POST { allocationId, date, value }
    recordsOf: (id: string) => `/allocations/${id}/records`, // POST (alias)
  },

  movements: {
    base: "/movements", // GET/POST
    byVersion: (versionId: string) => `/movements/version/${versionId}`,
    byId: (id: string) => `/movements/${id}`,
  },

  insurances: {
    byVersion: (versionId: string) => `/insurances/version/${versionId}`, // GET
    create: "/insurances", // POST
    byId: (id: string) => `/insurances/${id}`,
  },
} as const;
