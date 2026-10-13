export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const tk = () => localStorage.getItem("token");

export async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(tk() ? { Authorization: "Bearer " + tk() } : {})
    },
    body: isForm ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "The request could not be completed.");
  return data;
}
