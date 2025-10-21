// Хелпер для безопасной сборки URL с query-параметрами

export function buildUrl(base: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  if (!qs) return base;
  return `${base}?${qs}`;
}


