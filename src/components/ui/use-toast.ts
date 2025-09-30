"use client";

// Shim mínimo: mantém a API { toast({ description }) }
// Troque depois por shadcn "toast" real se quiser UI.
type ToastArgs = { title?: string; description?: string };

export function useToast() {
  return {
    toast: ({ title, description }: ToastArgs) => {
      if (typeof window !== "undefined") {
        // Mostra algo e loga (sem UI bonitinha)
        if (description) console.log("[toast]", description);
        if (title) console.log("[toast]", title);
      }
    },
  };
}
