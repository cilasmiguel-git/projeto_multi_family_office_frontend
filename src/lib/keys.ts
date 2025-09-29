export const qk = {
  clients: (q: string, cursor: string | null, limit: number) =>
    ["clients", q, cursor, limit] as const,
  allocationsHistory: (allocationId: string) =>
    ["alloc-history", allocationId] as const,
  allocationsOfVersion: (versionId: string) =>
    ["allocations", "version", versionId] as const,
  movementsOfVersion: (versionId: string) =>
    ["movements", "version", versionId] as const,
  insurancesOfVersion: (versionId: string) =>
    ["insurances", "version", versionId] as const,
  projection: (simId: string, life: string, rate: number) =>
    ["projection", simId, life, rate] as const,
  clientById: (id: string) => ["client", id] as const,
  simulationsOfClient: (clientId: string) =>
    ["simulations", "by-client", clientId] as const,
  simulationVersions: (simulationId: string) =>
    ["simulation-versions", simulationId] as const,
};
