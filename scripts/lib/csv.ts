import { parse } from "csv-parse/sync";

export type Row = Record<string, string>;

export function parseCsv(text: string): Row[] {
  return parse(text, { columns: true, skip_empty_lines: true }) as Row[];
}
