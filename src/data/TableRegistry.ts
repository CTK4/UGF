export type DataRow = Record<string, unknown>;
export type DataTable = { sheet: string; headers: string[]; rows: DataRow[] };

export class TableRegistry {
  private readonly tables: Record<string, DataTable>;

  constructor(tables: Record<string, DataTable>) {
    this.tables = tables;
  }

  getTable(name: string): DataRow[] {
    if (!this.tables[name]) {
      console.warn(`[TableRegistry] Missing table: ${name}`);
      return [];
    }
    return this.tables[name].rows ?? [];
  }

  findBy(name: string, predicate: (row: DataRow) => boolean): DataRow[] {
    return this.getTable(name).filter(predicate);
  }

  indexBy(name: string, key: string): Record<string, DataRow> {
    const out: Record<string, DataRow> = {};
    for (const row of this.getTable(name)) {
      const value = row[key];
      if (value !== undefined && value !== null) out[String(value)] = row;
    }
    return out;
  }
}
