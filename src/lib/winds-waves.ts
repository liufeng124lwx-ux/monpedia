import raw from "../../data/winds-waves.json";
import { isTypeName, type TypeName } from "./model";

/** `date` is the day the fact was checked against `source`. */
export type WwFact = { text: string; source: string; date: string };
export type WwStarter = { name: string; type: TypeName };
export type WindsWaves = { updated: string; release: string; facts: WwFact[]; starters: WwStarter[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OFFICIAL = /^https:\/\/([a-z0-9-]+\.)*(pokemon\.com|nintendo\.com)(\/|$)/;

type Loose = {
  updated?: string;
  release?: string;
  starters?: { name: string; type: string }[];
  facts?: { text: string; source: string; date: string }[];
};

export function validateWindsWaves(d: unknown): string[] {
  const x = d as Loose;
  const errors: string[] = [];
  if (!ISO_DATE.test(x.updated ?? "")) errors.push("updated: not an ISO date");
  if (!x.release) errors.push("release: empty");
  for (const s of x.starters ?? []) {
    if (!isTypeName(s.type)) errors.push(`starter ${s.name}: invalid type ${s.type}`);
  }
  (x.facts ?? []).forEach((f, i) => {
    if (!f.text) errors.push(`fact ${i}: empty text`);
    if (!OFFICIAL.test(f.source)) errors.push(`fact ${i}: source must be an https URL on an official domain`);
    if (!ISO_DATE.test(f.date)) errors.push(`fact ${i}: date must be YYYY-MM-DD`);
  });
  return errors;
}

export function getWindsWaves(): WindsWaves {
  return raw as unknown as WindsWaves;
}
