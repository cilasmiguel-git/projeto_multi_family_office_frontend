"use client";

import { useParams } from "next/navigation";
import ProjectionView from "@/components/ProjectionView";
import { useClient } from "@/hooks/useClients";

export default function ClientProjectionPage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id ?? null;

  // opcional: só pra exibir o nome atual no cabeçalho do combo
  const { data: client } = useClient(clientId || undefined);

  return (
    <ProjectionView
      presetClient={client ? { id: client.id, name: client.name } : null}
    />
  );
}
