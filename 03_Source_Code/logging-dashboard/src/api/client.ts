export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });

  if (response.status === 401) throw new UnauthorizedError();

  const payload = (await response.json()) as T | { error?: string; message?: string };

  if (!response.ok) {
    const err = payload as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? `Request failed: ${response.status}`);
  }

  return payload as T;
}

const apiClient = {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = params
      ? `${path}?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)]),
          ),
        )}`
      : path;
    return request<T>(url);
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};

export default apiClient;
