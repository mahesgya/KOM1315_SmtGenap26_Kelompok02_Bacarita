export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACARITA_API_URL ?? ""
).replace(/\/+$/, "");

function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init?.headers as Record<string, string>) ?? {}),
    },
  });

  if (response.status === 401) throw new UnauthorizedError();

  const payload = (await response.json()) as T | { error?: string; message?: string };

  if (!response.ok) {
    const err = payload as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? `Request failed: ${response.status}`);
  }

  return payload as T;
}

const apiClient = {
  get<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
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
