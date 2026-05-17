export const ls = {
  read<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  write<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },
};

export const KEYS = { stories: "bacarita.stories", children: "bacarita.children" } as const;
