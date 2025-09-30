"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // tenta pegar o ID do cliente salvo
    const clientId = localStorage.getItem("activeClientId");

    if (clientId) {
      router.replace(`/clients/${clientId}/dashboard`);
    } else {
      // fallback se não tiver nada salvo
      router.replace("/clients");
    }
  }, [router]);

  return null; // não renderiza nada, só redireciona
}
