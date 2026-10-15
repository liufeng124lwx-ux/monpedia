import type { TypeName } from "./model";

export const TYPE_COLORS: Record<TypeName, { bg: string; fg: string }> = {
  normal: { bg: "#9FA19F", fg: "#111827" },
  fighting: { bg: "#FF8000", fg: "#111827" },
  flying: { bg: "#81B9EF", fg: "#111827" },
  poison: { bg: "#9141CB", fg: "#FFFFFF" },
  ground: { bg: "#915121", fg: "#FFFFFF" },
  rock: { bg: "#AFA981", fg: "#111827" },
  bug: { bg: "#91A119", fg: "#111827" },
  ghost: { bg: "#704170", fg: "#FFFFFF" },
  steel: { bg: "#60A1B8", fg: "#111827" },
  fire: { bg: "#E62829", fg: "#FFFFFF" },
  water: { bg: "#2980EF", fg: "#FFFFFF" },
  grass: { bg: "#3FA129", fg: "#FFFFFF" },
  electric: { bg: "#FAC000", fg: "#111827" },
  psychic: { bg: "#EF4179", fg: "#FFFFFF" },
  ice: { bg: "#3DCEF3", fg: "#111827" },
  dragon: { bg: "#5060E1", fg: "#FFFFFF" },
  dark: { bg: "#624D4E", fg: "#FFFFFF" },
  fairy: { bg: "#EF70EF", fg: "#111827" },
};
