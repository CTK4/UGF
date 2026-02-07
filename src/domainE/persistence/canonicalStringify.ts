export type CanonicalStringifyOpts = {
  excludeTopLevelKeys?: string[];
};

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && (v.constructor === Object || Object.getPrototypeOf(v) === null);
}

function canonicalize(value: any): any {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Set) return Array.from(value).sort().map(canonicalize);
  if (value instanceof Map) {
    const arr = Array.from(value.entries()).sort(([a],[b]) => (String(a) < String(b) ? -1 : 1));
    return arr.map(([k, v]) => [k, canonicalize(v)]);
  }
  if (isPlainObject(value)) {
    const out: Record<string, any> = {};
    const keys = Object.keys(value).sort();
    for (const k of keys) out[k] = canonicalize(value[k]);
    return out;
  }
  // fallback: attempt structured clone-ish
  return value;
}

export function canonicalStringify(obj: any, opts?: CanonicalStringifyOpts): string {
  const exclude = new Set(opts?.excludeTopLevelKeys ?? []);
  const top: any = obj && typeof obj === "object" ? { ...obj } : obj;
  if (top && typeof top === "object") {
    for (const k of exclude) {
      if (k in top) delete top[k];
    }
  }
  return JSON.stringify(canonicalize(top));
}
