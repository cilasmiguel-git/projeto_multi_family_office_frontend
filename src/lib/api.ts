import axios from "axios";
import { ENV } from "./config";

export const api = axios.create({
  baseURL: ENV.API_URL,
  // withCredentials: true, // se precisar cookie
});

// Interceptors (erros, auth, etc)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    // você pode plugar um toast aqui
    // console.error(err?.response?.data ?? err.message);
    return Promise.reject(err);
  }
);

// helpers genéricos (tipados)
// helpers genéricos (tipados)
export type CursorPage<T> = { items: T[]; nextCursor: string | null };

// Aceita primitivos, null/undefined e arrays (para ?tag=a&tag=b...)
type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | null | undefined | QueryPrimitive[];

export function qs(params: Record<string, QueryValue>) {
  const p = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;

    if (Array.isArray(v)) {
      v.forEach((item) => p.append(k, String(item)));
    } else {
      p.set(k, String(v));
    }
  });

  return p.toString();
}
