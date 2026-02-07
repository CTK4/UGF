import manifest from "@/assets/ugf_ui_export/data/manifest.json";
import styleSheets from "@/assets/ugf_ui_export/style/styleSheets.json";
import designTokens from "@/assets/ugf_ui_export/style/designTokens.json";

type DataSheet = { sheet: string; headers: string[]; rows: Record<string, unknown>[] };
type Manifest = Record<string, { file: string; rowCount: number; colCount: number }>;

const dataModules = import.meta.glob("@/assets/ugf_ui_export/data/*.json");

let styleCache: { styleSheets: typeof styleSheets; designTokens: typeof designTokens } | null = null;
let dataCache: { manifest: Manifest; tables: Record<string, DataSheet> } | null = null;

export async function loadStyleBundle() {
  if (styleCache) return styleCache;
  styleCache = { styleSheets, designTokens };
  return styleCache;
}

export async function loadDataBundle() {
  if (dataCache) return dataCache;
  const tables: Record<string, DataSheet> = {};

  for (const [name, meta] of Object.entries(manifest as Manifest)) {
    const path = `/src/assets/ugf_ui_export/data/${meta.file}`;
    const importer = dataModules[path];
    if (!importer) {
      tables[name] = { sheet: name, headers: [], rows: [] };
      continue;
    }
    const mod = (await importer()) as { default: DataSheet };
    tables[name] = mod.default;
  }

  dataCache = { manifest: manifest as Manifest, tables };
  return dataCache;
}
