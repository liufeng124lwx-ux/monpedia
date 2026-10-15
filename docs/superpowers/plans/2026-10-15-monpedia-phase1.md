# Monpedia Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上线 monpedia.net 第一阶段：全静态的宝可梦属性计算器首页、性格表、约 1300 个宝可梦弱点页、18 个属性页、Winds & Waves 专题和法务页。

**Architecture:** 一次性脚本 `scripts/build-data.ts` 从固定版本的 PokeAPI CSV 生成 `data/*.json` 并提交到仓库；`src/lib/` 是不依赖 React 的纯函数（属性倍率、特性修正、对策推荐、数据访问、搜索）；Next.js App Router 以 `output: "export"` 在构建时读 JSON 生成全部静态 HTML，部署到 Cloudflare Pages。运行时没有任何接口请求，唯一外部资源是经 jsDelivr 热链的 PokeAPI 小像素图。

**Tech Stack:** Next.js（App Router，静态导出）、TypeScript、Tailwind CSS v4、Vitest、Playwright、csv-parse、node-html-parser、tsx、serve、Wrangler（Cloudflare Pages）。

**Spec:** `docs/superpowers/specs/2026-10-15-monpedia-phase1-design.md`（方向调研：`docs/research/2026-10-15-direction.md`）

## Global Constraints

- 站名、域名、Logo 不含 Pokémon；不使用官方美术 / 立绘；不发布泄露内容；页脚与 `/about` 声明非官方粉丝站。
- 精灵图仅用 PokeAPI 小像素 sprite，经 `cdn.jsdelivr.net/gh/PokeAPI/sprites@<固定版本>/...` 热链；**页面里绝不出现 raw.githubusercontent.com**（构建期下载 CSV 可以用）。
- 仅英文，URL 无语言前缀。
- 属性克制按第 6 代及以后的现行规则（含妖精），不做历代切换。
- 无登录、无数据库、无运行时 API。
- `next.config.ts`：`output: "export"`、`trailingSlash: false`、`images.unoptimized: true`；canonical 与 sitemap 一律用不带结尾斜杠的绝对 URL，站点根为 `https://monpedia.net`。
- Tailwind CSS，不引组件库；手机优先；支持深色模式（`prefers-color-scheme`）。
- 标题模板（完全一致）：
  - 首页：`Pokémon Type Chart & Weakness Calculator | Monpedia`
  - 宝可梦页：`{Name} Weakness & Counters – Type Matchups | Monpedia`
  - 属性页：`{Type} Type Weakness & Strengths | Monpedia`
  - 性格页：`Pokémon Nature Chart – All 25 Natures | Monpedia`
- 首页 H1 为 `Pokémon Type Chart & Weakness Calculator`；每页恰好一个 H1。
- 所有页面输出 `BreadcrumbList` JSON-LD；有 FAQ 的页面输出 `FAQPage` JSON-LD。
- 首页计算器状态写入网址参数 `?t=`（攻击方向另加 `m=attack`），canonical 固定为 `https://monpedia.net`。
- 攻击方向只能选 1 个属性；防御方向选 1~2 个。
- 广告位不放在工具区域内；本期不接 Adsense（`AdSlot` 默认不渲染）。
- 手机端 Lighthouse：性能 ≥ 90，SEO = 100。

## Review Focus

1. **首页网址参数被篡改**（未知属性、重复、超过 2 个、大小写、攻击方向带 2 个属性）→ 静默清洗成合法状态，绝不报错或白屏。测试：Task 11 `parseCalcState`。
2. **特性修正后的非常规倍率**（1.25×、2.5×、⅛×、0.625×）→ 按原值显示，不四舍五入成常规档位。测试：Task 6 `formatMultiplier`、Task 7 `applyAbility`。
3. **外观相同的形态**（超极巨化、霸主形态、只改种族值的形态）以及带后缀的默认形态标识符（`deoxys-normal`）→ 不出重复页面，slug 干净，名字不重复。测试：Task 3。
4. **不进化的宝可梦和中途分叉的进化链**（肯泰罗、刺尾虫）→ 页面不出现空的进化区块，分叉按阶段并列。测试：Task 3 `buildEvolutionStages`、Task 9 `hasEvolution`。
5. **搜索输入带重音、标点或图鉴编号**（`flabebe`、`mr mime`、`farfetchd`、`#6`）→ 能匹配到 Flabébé、Mr. Mime、Farfetch’d、喷火龙。测试：Task 9 `matchesQuery`。

---

### Task 1: 项目骨架与工具链

**Files:**
- Create: Next.js 项目文件（`create-next-app` 生成）
- Modify: `next.config.ts`、`package.json`、`src/app/globals.css`、`.gitignore`
- Create: `vitest.config.ts`、`tests/unit/config.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: npm scripts `test`、`test:build`、`build:data`、`e2e`、`typecheck`、`lint`、`build`；路径别名 `@/*` → `src/*`

- [ ] **Step 1: 生成 Next.js 项目**

在仓库根目录 `/Users/lwx/Workspace/opc/monpedia` 运行：

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

如果因为目录非空而拒绝：在 scratchpad 里生成同名项目，再把除 `.git` 以外的文件移到仓库根目录（保留已有的 `docs/`）。

- [ ] **Step 2: 安装开发依赖**

```bash
npm i -D vitest tsx csv-parse node-html-parser @playwright/test serve wrangler
npx playwright install chromium
```

- [ ] **Step 3: 写失败的配置测试**

`tests/unit/config.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("next config", () => {
  it("exports a fully static site with spec settings", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.trailingSlash).toBe(false);
    expect(nextConfig.images?.unoptimized).toBe(true);
  });
});
```

`vitest.config.ts`：

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/data/**/*.test.ts"],
  },
});
```

`vitest.build.config.ts`（Task 17 用，先建好）：

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["tests/build/**/*.test.ts"] },
});
```

在 `package.json` 的 `scripts` 中设置（保留 create-next-app 生成的 `dev`、`start`）：

```json
{
  "build": "next build",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:build": "vitest run --config vitest.build.config.ts",
  "build:data": "tsx scripts/build-data.ts",
  "e2e": "playwright test"
}
```

- [ ] **Step 4: 运行测试确认失败**

Run: `npm test`
Expected: FAIL，`expected undefined to be 'export'`

- [ ] **Step 5: 写配置**

`next.config.ts`：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
```

`src/app/globals.css` 整个替换为：

```css
@import "tailwindcss";
```

`.gitignore` 末尾追加：

```
/test-results/
/playwright-report/
/.wrangler/
```

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test`
Expected: PASS（1 test）

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js static site with Vitest"
```

---

### Task 2: 数据模型与属性 / 性格 / 特性名转换

**Files:**
- Create: `src/lib/model.ts`、`scripts/lib/csv.ts`、`scripts/lib/transform.ts`
- Test: `tests/unit/transform-basic.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `src/lib/model.ts`：`TYPE_NAMES`、`TypeName`、`isTypeName(x: string): x is TypeName`、`STAT_KEYS`、`StatKey`、`Stats`、`Pokemon`、`Nature`、`AbilityModifier`、`TypeData`
  - `scripts/lib/csv.ts`：`type Row = Record<string, string>`、`parseCsv(text: string): Row[]`
  - `scripts/lib/transform.ts`：`titleCase(id: string): string`、`buildTypeData(types: Row[], typeNames: Row[], efficacy: Row[]): { typeIdToName: Map<string, TypeName>; data: TypeData }`、`buildNatures(natures: Row[], natureNames: Row[]): Nature[]`、`buildAbilityNames(abilities: Row[], abilityNames: Row[]): Record<string, string>`

- [ ] **Step 1: 写数据模型**

`src/lib/model.ts`：

```ts
export const TYPE_NAMES = [
  "normal", "fighting", "flying", "poison", "ground", "rock",
  "bug", "ghost", "steel", "fire", "water", "grass",
  "electric", "psychic", "ice", "dragon", "dark", "fairy",
] as const;
export type TypeName = (typeof TYPE_NAMES)[number];

export function isTypeName(x: string): x is TypeName {
  return (TYPE_NAMES as readonly string[]).includes(x);
}

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type Pokemon = {
  slug: string;
  name: string;
  speciesSlug: string;
  dex: number;
  generation: number;
  form: string | null;
  types: TypeName[];
  abilities: string[];
  stats: Stats;
  evolution: string[][];
  sprite: string;
};

export type Nature = { name: string; up: StatKey | null; down: StatKey | null };

export type AbilityModifier = {
  slug: string;
  name: string;
  multipliers?: Partial<Record<TypeName, number>>;
  wonderGuard?: true;
  note?: string;
};

export type TypeData = {
  names: Record<TypeName, string>;
  /** chart[attacking][defending] ∈ {0, 0.5, 1, 2} */
  chart: Record<TypeName, Record<TypeName, number>>;
};
```

`scripts/lib/csv.ts`：

```ts
import { parse } from "csv-parse/sync";

export type Row = Record<string, string>;

export function parseCsv(text: string): Row[] {
  return parse(text, { columns: true, skip_empty_lines: true }) as Row[];
}
```

- [ ] **Step 2: 写失败的测试**

`tests/unit/transform-basic.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { parseCsv } from "../../scripts/lib/csv";
import { buildAbilityNames, buildNatures, buildTypeData, titleCase } from "../../scripts/lib/transform";

describe("titleCase", () => {
  it("turns identifiers into words", () => {
    expect(titleCase("charizard-mega-x")).toBe("Charizard Mega X");
  });
});

describe("buildTypeData", () => {
  const types = parseCsv("id,identifier\n10,fire\n11,water\n19,stellar\n10001,unknown\n");
  const names = parseCsv("type_id,local_language_id,name\n10,9,Fire\n10,1,ほのお\n11,9,Water\n");
  const efficacy = parseCsv(
    "damage_type_id,target_type_id,damage_factor\n10,10,50\n10,11,50\n11,10,200\n11,11,50\n",
  );
  const { typeIdToName, data } = buildTypeData(types, names, efficacy);

  it("keeps only the 18 battle types", () => {
    expect([...typeIdToName.values()]).toEqual(["fire", "water"]);
  });
  it("uses English names", () => {
    expect(data.names.fire).toBe("Fire");
  });
  it("converts damage factors to multipliers indexed [attack][defend]", () => {
    expect(data.chart.water.fire).toBe(2);
    expect(data.chart.fire.water).toBe(0.5);
  });
});

describe("buildNatures", () => {
  const natures = parseCsv(
    "id,identifier,decreased_stat_id,increased_stat_id\n1,hardy,2,2\n3,adamant,4,2\n",
  );
  const names = parseCsv("nature_id,local_language_id,name\n1,9,Hardy\n3,9,Adamant\n");
  it("maps stat ids and marks neutral natures with nulls", () => {
    expect(buildNatures(natures, names)).toEqual([
      { name: "Adamant", up: "atk", down: "spa" },
      { name: "Hardy", up: null, down: null },
    ]);
  });
});

describe("buildAbilityNames", () => {
  it("maps slugs to English names with a title-case fallback", () => {
    const abilities = parseCsv("id,identifier\n26,levitate\n999,new-thing\n");
    const names = parseCsv("ability_id,local_language_id,name\n26,9,Levitate\n");
    expect(buildAbilityNames(abilities, names)).toEqual({ levitate: "Levitate", "new-thing": "New Thing" });
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npx vitest run tests/unit/transform-basic.test.ts`
Expected: FAIL，`Failed to resolve import "../../scripts/lib/transform"`

- [ ] **Step 4: 实现**

`scripts/lib/transform.ts`：

```ts
import {
  isTypeName,
  type Nature,
  type StatKey,
  type TypeData,
  type TypeName,
} from "../../src/lib/model";
import type { Row } from "./csv";

export const EN = "9";
export const STAT_BY_ID: Record<string, StatKey> = {
  "1": "hp", "2": "atk", "3": "def", "4": "spa", "5": "spd", "6": "spe",
};

export function titleCase(id: string): string {
  return id
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function groupBy<T>(rows: readonly T[], key: (r: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = out.get(k);
    if (list) list.push(r);
    else out.set(k, [r]);
  }
  return out;
}

export function buildTypeData(types: Row[], typeNames: Row[], efficacy: Row[]) {
  const typeIdToName = new Map<string, TypeName>();
  for (const r of types) if (isTypeName(r.identifier)) typeIdToName.set(r.id, r.identifier);

  const names = {} as Record<TypeName, string>;
  for (const r of typeNames) {
    const t = typeIdToName.get(r.type_id);
    if (t && r.local_language_id === EN) names[t] = r.name;
  }

  const chart = {} as TypeData["chart"];
  for (const a of typeIdToName.values()) chart[a] = {} as Record<TypeName, number>;
  for (const r of efficacy) {
    const a = typeIdToName.get(r.damage_type_id);
    const d = typeIdToName.get(r.target_type_id);
    if (a && d) chart[a][d] = Number(r.damage_factor) / 100;
  }
  return { typeIdToName, data: { names, chart } satisfies TypeData };
}

export function buildNatures(natures: Row[], natureNames: Row[]): Nature[] {
  const names = new Map(
    natureNames.filter((r) => r.local_language_id === EN).map((r) => [r.nature_id, r.name]),
  );
  return natures
    .map((r) => {
      const neutral = r.increased_stat_id === r.decreased_stat_id;
      return {
        name: names.get(r.id) ?? titleCase(r.identifier),
        up: neutral ? null : STAT_BY_ID[r.increased_stat_id],
        down: neutral ? null : STAT_BY_ID[r.decreased_stat_id],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAbilityNames(abilities: Row[], abilityNames: Row[]): Record<string, string> {
  const names = new Map(
    abilityNames.filter((r) => r.local_language_id === EN).map((r) => [r.ability_id, r.name]),
  );
  return Object.fromEntries(abilities.map((a) => [a.identifier, names.get(a.id) ?? titleCase(a.identifier)]));
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx vitest run tests/unit/transform-basic.test.ts`
Expected: PASS（6 tests）

- [ ] **Step 6: Commit**

```bash
git add src/lib/model.ts scripts/lib tests/unit/transform-basic.test.ts
git commit -m "feat(data): add data model and type/nature/ability transforms"
```

---

### Task 3: 宝可梦条目转换（形态规则、名字、进化线）

**Files:**
- Modify: `scripts/lib/transform.ts`（追加）
- Test: `tests/unit/transform-pokemon.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `Row`、`groupBy`、`titleCase`、`EN`、`STAT_BY_ID`、`Pokemon`、`TypeName`
- Produces:
  - `type PokemonTables = { pokemon: Row[]; species: Row[]; speciesNames: Row[]; pokemonTypes: Row[]; pokemonStats: Row[]; pokemonAbilities: Row[]; forms: Row[]; formNames: Row[]; abilities: Row[] }`
  - `buildEvolutionStages(species: Row[]): Map<string, string[][]>`（键为 species id）
  - `buildPokemon(t: PokemonTables, typeIdToName: Map<string, TypeName>, spriteBase: string): Pokemon[]`

规则（对应 spec 2.2「出页规则」）：
- 每个物种的默认形态必定收录，slug = 物种 identifier（所以 `deoxys-normal` 变成 `deoxys`），`form = null`，名字 = 物种英文名。
- 非默认形态按 id 顺序处理，「属性 + 特性集合」签名与该物种已收录条目都不同才收录；slug = pokemon identifier，`form` = 去掉 `物种identifier-` 前缀后的部分，名字取 `pokemon_form_names` 的英文 `pokemon_name`。
- 没有属性或没有特性的条目跳过。
- 名字和已收录条目重复时，追加 ` (Form Label)`。
- `sprite = ${spriteBase}/${pokemonId}.png`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/transform-pokemon.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import type { Row } from "../../scripts/lib/csv";
import { buildEvolutionStages, buildPokemon, type PokemonTables } from "../../scripts/lib/transform";
import type { TypeName } from "../../src/lib/model";

const TYPE_IDS = new Map<string, TypeName>([
  ["1", "normal"], ["3", "flying"], ["10", "fire"], ["14", "psychic"], ["16", "dragon"], ["17", "dark"],
]);

function sp(id: number, identifier: string, chain: number, from: number | null): Row {
  return {
    id: String(id), identifier, generation_id: "1", order: String(id),
    evolution_chain_id: String(chain), evolves_from_species_id: from === null ? "" : String(from),
  };
}

function makeTables(): PokemonTables {
  const t: PokemonTables = {
    pokemon: [], species: [], speciesNames: [], pokemonTypes: [], pokemonStats: [],
    pokemonAbilities: [], forms: [], formNames: [],
    abilities: [
      { id: "66", identifier: "blaze" }, { id: "94", identifier: "solar-power" },
      { id: "181", identifier: "tough-claws" }, { id: "70", identifier: "drought" },
      { id: "50", identifier: "run-away" }, { id: "82", identifier: "gluttony" },
      { id: "46", identifier: "pressure" },
    ],
  };
  t.species.push(
    sp(4, "charmander", 2, null), sp(5, "charmeleon", 2, 4), sp(6, "charizard", 2, 5),
    sp(19, "rattata", 10, null), sp(20, "raticate", 10, 19),
    sp(386, "deoxys", 200, null),
  );
  t.speciesNames.push(
    { pokemon_species_id: "6", local_language_id: "9", name: "Charizard" },
    { pokemon_species_id: "20", local_language_id: "9", name: "Raticate" },
    { pokemon_species_id: "386", local_language_id: "9", name: "Deoxys" },
  );
  const mon = (id: number, identifier: string, species: number, isDefault: boolean, types: number[], abilities: number[], formName?: string) => {
    t.pokemon.push({ id: String(id), identifier, species_id: String(species), is_default: isDefault ? "1" : "0" });
    types.forEach((ty, i) => t.pokemonTypes.push({ pokemon_id: String(id), type_id: String(ty), slot: String(i + 1) }));
    abilities.forEach((ab, i) => t.pokemonAbilities.push({ pokemon_id: String(id), ability_id: String(ab), slot: String(i + 1) }));
    [1, 2, 3, 4, 5, 6].forEach((s) => t.pokemonStats.push({ pokemon_id: String(id), stat_id: String(s), base_stat: String(50 + s) }));
    t.forms.push({ id: String(id), pokemon_id: String(id), is_default: "1" });
    if (formName) t.formNames.push({ pokemon_form_id: String(id), local_language_id: "9", pokemon_name: formName });
  };
  mon(6, "charizard", 6, true, [10, 3], [66, 94]);
  mon(10034, "charizard-mega-x", 6, false, [10, 16], [181], "Mega Charizard X");
  mon(10035, "charizard-mega-y", 6, false, [10, 3], [70], "Mega Charizard Y");
  mon(10196, "charizard-gmax", 6, false, [10, 3], [94, 66], "Gigantamax Charizard");
  mon(20, "raticate", 20, true, [1], [50]);
  mon(10091, "raticate-alola", 20, false, [17, 1], [82], "Alolan Raticate");
  mon(10093, "raticate-totem-alola", 20, false, [17, 1], [82], "Alolan Raticate");
  mon(386, "deoxys-normal", 386, true, [14], [46]);
  mon(10001, "deoxys-attack", 386, false, [14], [46], "Deoxys");
  return t;
}

const SPRITES = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@abc/sprites/pokemon";

describe("buildPokemon", () => {
  const list = buildPokemon(makeTables(), TYPE_IDS, SPRITES);
  const slugs = list.map((p) => p.slug);

  it("keeps defaults and forms whose types or abilities differ", () => {
    expect(slugs).toEqual(["charizard", "charizard-mega-x", "charizard-mega-y", "raticate", "raticate-alola", "deoxys"]);
  });

  it("drops cosmetic, G-Max, totem and stat-only forms", () => {
    expect(slugs).not.toContain("charizard-gmax");
    expect(slugs).not.toContain("raticate-totem-alola");
    expect(slugs).not.toContain("deoxys-attack");
  });

  it("uses the species identifier as the slug of default forms", () => {
    const deoxys = list.find((p) => p.dex === 386)!;
    expect(deoxys.slug).toBe("deoxys");
    expect(deoxys.form).toBeNull();
    expect(deoxys.name).toBe("Deoxys");
  });

  it("builds a full record for a form", () => {
    expect(list.find((p) => p.slug === "charizard-mega-x")).toEqual({
      slug: "charizard-mega-x",
      name: "Mega Charizard X",
      speciesSlug: "charizard",
      dex: 6,
      generation: 1,
      form: "mega-x",
      types: ["fire", "dragon"],
      abilities: ["tough-claws"],
      stats: { hp: 51, atk: 52, def: 53, spa: 54, spd: 55, spe: 56 },
      evolution: [["charmander"], ["charmeleon"], ["charizard"]],
      sprite: `${SPRITES}/10034.png`,
    });
  });

  it("disambiguates duplicate display names", () => {
    const t = makeTables();
    t.formNames.find((r) => r.pokemon_form_id === "10035")!.pokemon_name = "Mega Charizard X";
    const names = buildPokemon(t, TYPE_IDS, SPRITES).map((p) => p.name);
    expect(names).toContain("Mega Charizard X (Mega Y)");
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("buildEvolutionStages", () => {
  it("groups branching chains by stage", () => {
    const stages = buildEvolutionStages([
      sp(265, "wurmple", 100, null), sp(266, "silcoon", 100, 265), sp(267, "beautifly", 100, 266),
      sp(268, "cascoon", 100, 265), sp(269, "dustox", 100, 268),
    ]);
    expect(stages.get("265")).toEqual([["wurmple"], ["silcoon", "cascoon"], ["beautifly", "dustox"]]);
    expect(stages.get("269")).toEqual(stages.get("265"));
  });

  it("gives single-stage species a one-element chain", () => {
    expect(buildEvolutionStages([sp(128, "tauros", 50, null)]).get("128")).toEqual([["tauros"]]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/transform-pokemon.test.ts`
Expected: FAIL，`buildPokemon is not a function`（或导入错误）

- [ ] **Step 3: 实现**

在 `scripts/lib/transform.ts` 顶部的 model 导入里加入 `STAT_KEYS`、`type Pokemon`、`type Stats`，然后在文件末尾追加：

```ts
export type PokemonTables = {
  pokemon: Row[];
  species: Row[];
  speciesNames: Row[];
  pokemonTypes: Row[];
  pokemonStats: Row[];
  pokemonAbilities: Row[];
  forms: Row[];
  formNames: Row[];
  abilities: Row[];
};

const bySlot = (a: Row, b: Row) => Number(a.slot) - Number(b.slot);

export function buildEvolutionStages(species: Row[]): Map<string, string[][]> {
  const byId = new Map(species.map((s) => [s.id, s]));
  const depth = (s: Row): number => {
    let d = 0;
    let cur = s;
    while (cur.evolves_from_species_id) {
      const parent = byId.get(cur.evolves_from_species_id);
      if (!parent) break;
      d++;
      cur = parent;
    }
    return d;
  };
  const result = new Map<string, string[][]>();
  const chains = groupBy(species, (s) => s.evolution_chain_id || `solo-${s.id}`);
  for (const members of chains.values()) {
    const stages: string[][] = [];
    for (const s of [...members].sort((a, b) => Number(a.order) - Number(b.order))) {
      (stages[depth(s)] ??= []).push(s.identifier);
    }
    const compact = stages.filter(Boolean);
    for (const s of members) result.set(s.id, compact);
  }
  return result;
}

export function buildPokemon(
  t: PokemonTables,
  typeIdToName: Map<string, TypeName>,
  spriteBase: string,
): Pokemon[] {
  const speciesById = new Map(t.species.map((s) => [s.id, s]));
  const speciesName = new Map(
    t.speciesNames.filter((r) => r.local_language_id === EN).map((r) => [r.pokemon_species_id, r.name]),
  );
  const abilitySlug = new Map(t.abilities.map((a) => [a.id, a.identifier]));
  const typesBy = groupBy(t.pokemonTypes, (r) => r.pokemon_id);
  const statsBy = groupBy(t.pokemonStats, (r) => r.pokemon_id);
  const abilitiesBy = groupBy(t.pokemonAbilities, (r) => r.pokemon_id);
  const formNameById = new Map(
    t.formNames.filter((r) => r.local_language_id === EN).map((r) => [r.pokemon_form_id, r.pokemon_name]),
  );
  const formNameByPokemon = new Map<string, string>();
  for (const f of t.forms) {
    const n = f.is_default === "1" ? formNameById.get(f.id) : undefined;
    if (n) formNameByPokemon.set(f.pokemon_id, n);
  }
  const evolution = buildEvolutionStages(t.species);

  const out: Pokemon[] = [];
  const usedNames = new Set<string>();
  for (const [speciesId, rows] of groupBy(t.pokemon, (r) => r.species_id)) {
    const sp = speciesById.get(speciesId);
    if (!sp) continue;
    const ordered = [...rows].sort(
      (a, b) => Number(b.is_default) - Number(a.is_default) || Number(a.id) - Number(b.id),
    );
    const seen = new Set<string>();
    for (const row of ordered) {
      const types = [...(typesBy.get(row.id) ?? [])]
        .sort(bySlot)
        .map((r) => typeIdToName.get(r.type_id))
        .filter((x): x is TypeName => x !== undefined);
      const abilities = [...(abilitiesBy.get(row.id) ?? [])]
        .sort(bySlot)
        .map((r) => abilitySlug.get(r.ability_id))
        .filter((x): x is string => x !== undefined);
      if (types.length === 0 || abilities.length === 0) continue;

      const isDefault = row.is_default === "1";
      const signature = `${types.join("/")}|${[...abilities].sort().join(",")}`;
      if (!isDefault && seen.has(signature)) continue;
      seen.add(signature);

      const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;
      for (const s of statsBy.get(row.id) ?? []) {
        const k = STAT_BY_ID[s.stat_id];
        if (k) stats[k] = Number(s.base_stat);
      }

      const prefix = `${sp.identifier}-`;
      const form = isDefault
        ? null
        : row.identifier.startsWith(prefix) ? row.identifier.slice(prefix.length) : row.identifier;
      let name = isDefault
        ? speciesName.get(speciesId) ?? titleCase(sp.identifier)
        : formNameByPokemon.get(row.id) ?? titleCase(row.identifier);
      if (usedNames.has(name) && form) name = `${name} (${titleCase(form)})`;
      usedNames.add(name);

      out.push({
        slug: isDefault ? sp.identifier : row.identifier,
        name,
        speciesSlug: sp.identifier,
        dex: Number(speciesId),
        generation: Number(sp.generation_id),
        form,
        types,
        abilities,
        stats,
        evolution: evolution.get(speciesId) ?? [[sp.identifier]],
        sprite: `${spriteBase}/${row.id}.png`,
      });
    }
  }
  return out.sort((a, b) => a.dex - b.dex);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/transform-pokemon.test.ts`
Expected: PASS（7 tests）

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/transform.ts tests/unit/transform-pokemon.test.ts
git commit -m "feat(data): transform PokeAPI rows into page-level Pokemon records"
```

---

### Task 4: 手写补充合并与数据校验

**Files:**
- Create: `scripts/lib/validate.ts`
- Test: `tests/unit/validate.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `TYPE_NAMES`、`STAT_KEYS`、`isTypeName`、`Pokemon`、`Nature`、`AbilityModifier`、`TypeData`
- Produces:
  - `type Dataset = { types: TypeData; pokemon: Pokemon[]; natures: Nature[]; abilityNames: Record<string, string>; abilityModifiers: AbilityModifier[] }`
  - `mergeOverrides(base: Pokemon[], overrides: Pokemon[]): Pokemon[]`（按 slug 覆盖或追加，结果按 dex 稳定排序）
  - `validateDataset(d: Dataset): string[]`（空数组 = 通过）

- [ ] **Step 1: 写失败的测试**

`tests/unit/validate.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { mergeOverrides, validateDataset, type Dataset } from "../../scripts/lib/validate";
import { TYPE_NAMES, type Pokemon, type TypeData } from "../../src/lib/model";

function chart(): TypeData {
  const names = Object.fromEntries(TYPE_NAMES.map((t) => [t, t.toUpperCase()])) as TypeData["names"];
  const c = Object.fromEntries(
    TYPE_NAMES.map((a) => [a, Object.fromEntries(TYPE_NAMES.map((d) => [d, 1]))]),
  ) as TypeData["chart"];
  return { names, chart: c };
}

function mon(slug: string, over: Partial<Pokemon> = {}): Pokemon {
  return {
    slug, name: slug, speciesSlug: slug, dex: 1, generation: 1, form: null,
    types: ["fire"], abilities: ["blaze"],
    stats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
    evolution: [[slug]], sprite: "x", ...over,
  };
}

const natures = Array.from({ length: 25 }, (_, i) => ({ name: `N${i}`, up: null, down: null }));

function dataset(over: Partial<Dataset> = {}): Dataset {
  return {
    types: chart(), pokemon: [mon("a")], natures,
    abilityNames: { blaze: "Blaze", levitate: "Levitate" },
    abilityModifiers: [{ slug: "levitate", name: "Levitate", multipliers: { ground: 0 } }],
    ...over,
  };
}

describe("validateDataset", () => {
  it("accepts a valid dataset", () => {
    expect(validateDataset(dataset())).toEqual([]);
  });

  it("rejects bad chart values and missing cells", () => {
    const d = dataset();
    d.types.chart.fire.water = 3;
    delete (d.types.chart.ice as Partial<Record<string, number>>).fire;
    const errors = validateDataset(d);
    expect(errors).toContain("chart fire->water: invalid 3");
    expect(errors).toContain("chart ice->fire: invalid undefined");
  });

  it("rejects duplicate slugs, bad types, unknown abilities and evolution refs", () => {
    const errors = validateDataset(dataset({
      pokemon: [
        mon("a"),
        mon("a"),
        mon("b", { types: [] }),
        mon("c", { types: ["fire", "water", "grass"] }),
        mon("d", { abilities: ["nope"] }),
        mon("e", { evolution: [["e"], ["ghost-mon"]] }),
      ],
    }));
    expect(errors).toEqual(expect.arrayContaining([
      "duplicate slug a",
      "b: invalid types ",
      "c: invalid types fire,water,grass",
      "d: unknown ability nope",
      "e: evolution references unknown ghost-mon",
    ]));
  });

  it("rejects ability modifiers for unknown abilities and wrong nature count", () => {
    const errors = validateDataset(dataset({
      abilityModifiers: [{ slug: "made-up", name: "Made Up" }],
      natures: natures.slice(0, 24),
    }));
    expect(errors).toContain("ability modifier made-up: unknown ability");
    expect(errors).toContain("expected 25 natures, got 24");
  });
});

describe("mergeOverrides", () => {
  it("replaces by slug and appends new entries in dex order", () => {
    const merged = mergeOverrides(
      [mon("a", { dex: 1 }), mon("c", { dex: 3 })],
      [mon("a", { dex: 1, name: "A2" }), mon("b", { dex: 2 })],
    );
    expect(merged.map((p) => [p.slug, p.name])).toEqual([["a", "A2"], ["b", "b"], ["c", "c"]]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/validate.test.ts`
Expected: FAIL，无法解析 `../../scripts/lib/validate`

- [ ] **Step 3: 实现**

`scripts/lib/validate.ts`：

```ts
import {
  isTypeName,
  STAT_KEYS,
  TYPE_NAMES,
  type AbilityModifier,
  type Nature,
  type Pokemon,
  type TypeData,
} from "../../src/lib/model";

export type Dataset = {
  types: TypeData;
  pokemon: Pokemon[];
  natures: Nature[];
  abilityNames: Record<string, string>;
  abilityModifiers: AbilityModifier[];
};

const ALLOWED = new Set([0, 0.5, 1, 2]);

export function mergeOverrides(base: Pokemon[], overrides: Pokemon[]): Pokemon[] {
  const bySlug = new Map(base.map((p) => [p.slug, p]));
  for (const o of overrides) bySlug.set(o.slug, o);
  return [...bySlug.values()].sort((a, b) => a.dex - b.dex);
}

export function validateDataset(d: Dataset): string[] {
  const errors: string[] = [];

  for (const a of TYPE_NAMES) {
    if (!d.types.names[a]) errors.push(`type ${a}: missing name`);
    for (const b of TYPE_NAMES) {
      const v = d.types.chart[a]?.[b];
      if (v === undefined || !ALLOWED.has(v)) errors.push(`chart ${a}->${b}: invalid ${v}`);
    }
  }

  const slugs = new Set<string>();
  for (const p of d.pokemon) {
    if (slugs.has(p.slug)) errors.push(`duplicate slug ${p.slug}`);
    slugs.add(p.slug);
    if (p.types.length < 1 || p.types.length > 2 || !p.types.every(isTypeName)) {
      errors.push(`${p.slug}: invalid types ${p.types.join(",")}`);
    }
    for (const ab of p.abilities) if (!d.abilityNames[ab]) errors.push(`${p.slug}: unknown ability ${ab}`);
    for (const k of STAT_KEYS) {
      if (!Number.isInteger(p.stats[k]) || p.stats[k] <= 0) errors.push(`${p.slug}: invalid stat ${k}`);
    }
  }
  for (const p of d.pokemon) {
    for (const s of p.evolution.flat()) {
      if (!slugs.has(s)) errors.push(`${p.slug}: evolution references unknown ${s}`);
    }
  }

  for (const m of d.abilityModifiers) {
    if (!d.abilityNames[m.slug]) errors.push(`ability modifier ${m.slug}: unknown ability`);
  }
  if (d.natures.length !== 25) errors.push(`expected 25 natures, got ${d.natures.length}`);
  return errors;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/validate.test.ts`
Expected: PASS（5 tests）

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/validate.ts tests/unit/validate.test.ts
git commit -m "feat(data): add override merge and dataset validation"
```

---

### Task 5: build-data 脚本与生成的数据快照

**Files:**
- Create: `scripts/config.ts`、`scripts/build-data.ts`、`data/abilities.json`、`data/overrides.json`
- Generate（提交）：`data/types.json`、`data/pokemon.json`、`data/natures.json`、`data/ability-names.json`、`data/meta.json`
- Test: `tests/data/dataset.test.ts`

**Interfaces:**
- Consumes: Task 2~4 的全部转换与校验函数
- Produces: `data/*.json`。之后所有任务都读这些文件。
  - `meta.json`：`{ pokeapiRef: string; spritesRef: string; speciesCount: number; pokemonCount: number; generatedAt: string }`

- [ ] **Step 1: 固定上游版本**

```bash
git ls-remote https://github.com/PokeAPI/pokeapi refs/heads/master
git ls-remote https://github.com/PokeAPI/sprites refs/heads/master
```

把两个 40 位 SHA 写进 `scripts/config.ts`（下面的 `<POKEAPI_SHA>` / `<SPRITES_SHA>` 换成真实值）：

```ts
export const POKEAPI_REF = "<POKEAPI_SHA>";
export const SPRITES_REF = "<SPRITES_SHA>";
export const CSV_BASE = `https://raw.githubusercontent.com/PokeAPI/pokeapi/${POKEAPI_REF}/data/v2/csv`;
export const SPRITE_BASE = `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@${SPRITES_REF}/sprites/pokemon`;
```

- [ ] **Step 2: 确认 jsDelivr 能拿到图**

```bash
SHA=<SPRITES_SHA>
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@$SHA/sprites/pokemon/6.png"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@$SHA/sprites/pokemon/10034.png"
```

Expected: 两行都是 `200 image/png`。
**如果不是 200**（比如 jsDelivr 拒绝过大的仓库）：停止执行，把输出报告给用户，问是否改成自托管。**不要**自行改用 raw.githubusercontent.com。

- [ ] **Step 3: 写手写数据文件**

`data/abilities.json`（只收录改变属性倍率的特性，倍率与属性倍率相乘）：

```json
[
  { "slug": "levitate", "name": "Levitate", "multipliers": { "ground": 0 } },
  { "slug": "flash-fire", "name": "Flash Fire", "multipliers": { "fire": 0 } },
  { "slug": "well-baked-body", "name": "Well-Baked Body", "multipliers": { "fire": 0 } },
  { "slug": "water-absorb", "name": "Water Absorb", "multipliers": { "water": 0 } },
  { "slug": "storm-drain", "name": "Storm Drain", "multipliers": { "water": 0 } },
  { "slug": "volt-absorb", "name": "Volt Absorb", "multipliers": { "electric": 0 } },
  { "slug": "lightning-rod", "name": "Lightning Rod", "multipliers": { "electric": 0 } },
  { "slug": "motor-drive", "name": "Motor Drive", "multipliers": { "electric": 0 } },
  { "slug": "sap-sipper", "name": "Sap Sipper", "multipliers": { "grass": 0 } },
  { "slug": "earth-eater", "name": "Earth Eater", "multipliers": { "ground": 0 } },
  { "slug": "dry-skin", "name": "Dry Skin", "multipliers": { "water": 0, "fire": 1.25 } },
  { "slug": "thick-fat", "name": "Thick Fat", "multipliers": { "fire": 0.5, "ice": 0.5 } },
  { "slug": "heatproof", "name": "Heatproof", "multipliers": { "fire": 0.5 } },
  { "slug": "water-bubble", "name": "Water Bubble", "multipliers": { "fire": 0.5 } },
  { "slug": "purifying-salt", "name": "Purifying Salt", "multipliers": { "ghost": 0.5 } },
  { "slug": "fluffy", "name": "Fluffy", "multipliers": { "fire": 2 }, "note": "also halves damage from contact moves" },
  { "slug": "wonder-guard", "name": "Wonder Guard", "wonderGuard": true }
]
```

`data/overrides.json`：

```json
[]
```

（以后补 PokeAPI 缺的条目时，每条必须是完整的 `Pokemon` 结构、数据可核实；风浪初始精灵**不**放这里，放 Task 16 的 `data/winds-waves.json`。）

- [ ] **Step 4: 写失败的数据测试**

`tests/data/dataset.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import abilityModifiers from "../../data/abilities.json";
import abilityNames from "../../data/ability-names.json";
import meta from "../../data/meta.json";
import natures from "../../data/natures.json";
import pokemon from "../../data/pokemon.json";
import types from "../../data/types.json";
import { validateDataset } from "../../scripts/lib/validate";
import type { AbilityModifier, Nature, Pokemon, TypeData } from "../../src/lib/model";

const list = pokemon as unknown as Pokemon[];
const bySlug = new Map(list.map((p) => [p.slug, p]));

describe("generated dataset", () => {
  it("passes validation", () => {
    expect(
      validateDataset({
        types: types as unknown as TypeData,
        pokemon: list,
        natures: natures as unknown as Nature[],
        abilityNames: abilityNames as Record<string, string>,
        abilityModifiers: abilityModifiers as unknown as AbilityModifier[],
      }),
    ).toEqual([]);
  });

  it("covers every species exactly once as a default form", () => {
    const defaults = list.filter((p) => p.form === null);
    expect(new Set(defaults.map((p) => p.dex)).size).toBe(meta.speciesCount);
    expect(defaults.length).toBe(meta.speciesCount);
  });

  it("has roughly 1300 page-level entries", () => {
    expect(list.length).toBeGreaterThan(1100);
    expect(list.length).toBeLessThan(1500);
    expect(meta.pokemonCount).toBe(list.length);
  });

  it("includes megas and regional forms but not G-Max forms", () => {
    expect(bySlug.get("charizard")?.types).toEqual(["fire", "flying"]);
    expect(bySlug.get("charizard-mega-x")?.types).toEqual(["fire", "dragon"]);
    expect(bySlug.has("raticate-alola")).toBe(true);
    expect(list.some((p) => p.slug.endsWith("-gmax"))).toBe(false);
  });

  it("models Eevee's branching evolutions", () => {
    const evo = bySlug.get("eevee")!.evolution;
    expect(evo).toHaveLength(2);
    expect(evo[1]).toHaveLength(8);
    expect(evo[1]).toEqual(expect.arrayContaining(["vaporeon", "sylveon", "umbreon"]));
  });

  it("never points sprites at raw.githubusercontent.com", () => {
    expect(list.every((p) => p.sprite.startsWith("https://cdn.jsdelivr.net/gh/PokeAPI/sprites@"))).toBe(true);
  });

  it("has 25 natures with 5 neutral ones", () => {
    expect(natures).toHaveLength(25);
    expect((natures as Nature[]).filter((n) => n.up === null)).toHaveLength(5);
  });
});
```

- [ ] **Step 5: 运行测试确认失败**

Run: `npx vitest run tests/data/dataset.test.ts`
Expected: FAIL，找不到 `../../data/ability-names.json`

- [ ] **Step 6: 写脚本**

`scripts/build-data.ts`：

```ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AbilityModifier, Pokemon } from "../src/lib/model";
import { CSV_BASE, POKEAPI_REF, SPRITE_BASE, SPRITES_REF } from "./config";
import { parseCsv, type Row } from "./lib/csv";
import { buildAbilityNames, buildNatures, buildPokemon, buildTypeData } from "./lib/transform";
import { mergeOverrides, validateDataset } from "./lib/validate";

const DATA_DIR = path.resolve(__dirname, "../data");

async function fetchCsv(name: string): Promise<Row[]> {
  const res = await fetch(`${CSV_BASE}/${name}.csv`);
  if (!res.ok) throw new Error(`${name}.csv: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
}

function writeJson(file: string, value: unknown) {
  writeFileSync(path.join(DATA_DIR, file), `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const names = [
    "types", "type_names", "type_efficacy", "natures", "nature_names", "abilities", "ability_names",
    "pokemon", "pokemon_species", "pokemon_species_names", "pokemon_types", "pokemon_stats",
    "pokemon_abilities", "pokemon_forms", "pokemon_form_names",
  ] as const;
  const csv = Object.fromEntries(
    await Promise.all(names.map(async (n) => [n, await fetchCsv(n)] as const)),
  ) as Record<(typeof names)[number], Row[]>;

  const { typeIdToName, data: types } = buildTypeData(csv.types, csv.type_names, csv.type_efficacy);
  const natures = buildNatures(csv.natures, csv.nature_names);
  const abilityNames = buildAbilityNames(csv.abilities, csv.ability_names);
  const generated = buildPokemon(
    {
      pokemon: csv.pokemon,
      species: csv.pokemon_species,
      speciesNames: csv.pokemon_species_names,
      pokemonTypes: csv.pokemon_types,
      pokemonStats: csv.pokemon_stats,
      pokemonAbilities: csv.pokemon_abilities,
      forms: csv.pokemon_forms,
      formNames: csv.pokemon_form_names,
      abilities: csv.abilities,
    },
    typeIdToName,
    SPRITE_BASE,
  );
  const pokemon = mergeOverrides(generated, readJson<Pokemon[]>("overrides.json"));
  const abilityModifiers = readJson<AbilityModifier[]>("abilities.json");

  const errors = validateDataset({ types, pokemon, natures, abilityNames, abilityModifiers });
  if (errors.length) {
    console.error(`Validation failed (${errors.length}):\n${errors.slice(0, 50).join("\n")}`);
    process.exit(1);
  }

  mkdirSync(DATA_DIR, { recursive: true });
  writeJson("types.json", types);
  writeJson("natures.json", natures);
  writeJson("ability-names.json", abilityNames);
  writeJson("pokemon.json", pokemon);
  writeJson("meta.json", {
    pokeapiRef: POKEAPI_REF,
    spritesRef: SPRITES_REF,
    speciesCount: new Set(pokemon.map((p) => p.dex)).size,
    pokemonCount: pokemon.length,
    generatedAt: new Date().toISOString().slice(0, 10),
  });
  console.log(`Wrote ${pokemon.length} Pokémon entries (${natures.length} natures).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 7: 生成数据**

Run: `npm run build:data`
Expected: 打印 `Wrote <N> Pokémon entries (25 natures).`，N 在 1100~1500 之间。
如果校验失败：看报错的 slug，判断是转换规则的 bug（回到 Task 3 加测试再修）还是 PokeAPI 数据问题（用 `overrides.json` 修正条目）。**不要**为了通过而放宽校验。

- [ ] **Step 8: 运行数据测试确认通过**

Run: `npm test`
Expected: PASS（全部单元测试 + 7 个数据测试）

- [ ] **Step 9: 人工抽查 diff 并提交**

```bash
git diff --stat
node -e 'const p=require("./data/pokemon.json");console.log(p.filter(x=>x.form).slice(0,40).map(x=>x.slug).join("\n"))'
```

快速扫一眼形态列表，确认没有明显的纯外观形态（如 `pikachu-*-cap` 出现很多就记录下来报告给用户，不在本任务里改规则）。

```bash
git add scripts/config.ts scripts/build-data.ts data tests/data/dataset.test.ts
git commit -m "feat(data): generate pinned PokeAPI data snapshot"
```

---

### Task 6: 属性倍率（typechart）

**Files:**
- Create: `src/lib/typechart.ts`
- Test: `tests/unit/typechart.test.ts`

**Interfaces:**
- Consumes: `data/types.json`、`TYPE_NAMES`、`TypeName`、`TypeData`
- Produces:
  - `type Profile = Record<TypeName, number>`
  - `type MatchupGroup = { multiplier: number; types: TypeName[] }`
  - `typeLabel(t: TypeName): string`
  - `effectiveness(attack: TypeName, defenders: readonly TypeName[]): number`
  - `defenseProfile(defenders: readonly TypeName[]): Profile`
  - `offenseProfile(attack: TypeName): Profile`
  - `groupByMultiplier(profile: Profile, includeNeutral?: boolean): MatchupGroup[]`（倍率降序；组内按 `TYPE_NAMES` 顺序）
  - `formatMultiplier(m: number): string`
  - `countWeaknesses(t: TypeName): number`、`countSuperEffective(t: TypeName): number`

- [ ] **Step 1: 写失败的测试**

`tests/unit/typechart.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import {
  countSuperEffective,
  countWeaknesses,
  defenseProfile,
  effectiveness,
  formatMultiplier,
  groupByMultiplier,
  offenseProfile,
  typeLabel,
} from "@/lib/typechart";

describe("effectiveness", () => {
  it("multiplies across dual types (Charizard: Fire/Flying)", () => {
    const p = defenseProfile(["fire", "flying"]);
    expect(p.rock).toBe(4);
    expect(p.water).toBe(2);
    expect(p.electric).toBe(2);
    expect(p.ground).toBe(0);
    expect(p.grass).toBe(0.25);
    expect(p.bug).toBe(0.25);
    expect(p.fairy).toBe(0.5);
  });

  it("gives Ice/Flying a 4× Rock weakness", () => {
    expect(effectiveness("rock", ["ice", "flying"])).toBe(4);
  });

  it("uses the Gen 6+ chart (Fairy exists, Steel no longer resists Ghost)", () => {
    expect(effectiveness("dragon", ["fairy"])).toBe(0);
    expect(effectiveness("ghost", ["steel"])).toBe(1);
  });
});

describe("offenseProfile", () => {
  it("lists what Fire hits", () => {
    const p = offenseProfile("fire");
    expect(["grass", "ice", "bug", "steel"].every((t) => p[t as keyof typeof p] === 2)).toBe(true);
    expect(p.water).toBe(0.5);
  });
});

describe("groupByMultiplier", () => {
  it("sorts groups high to low and skips neutral by default", () => {
    const groups = groupByMultiplier(defenseProfile(["fire", "flying"]));
    expect(groups[0]).toEqual({ multiplier: 4, types: ["rock"] });
    expect(groups.at(-1)).toEqual({ multiplier: 0, types: ["ground"] });
    expect(groups.some((g) => g.multiplier === 1)).toBe(false);
  });
});

describe("formatMultiplier", () => {
  it("formats standard and ability-modified values exactly", () => {
    expect(formatMultiplier(0)).toBe("0×");
    expect(formatMultiplier(0.5)).toBe("½×");
    expect(formatMultiplier(0.25)).toBe("¼×");
    expect(formatMultiplier(0.125)).toBe("⅛×");
    expect(formatMultiplier(4)).toBe("4×");
    expect(formatMultiplier(1.25)).toBe("1.25×");
    expect(formatMultiplier(2.5)).toBe("2.5×");
    expect(formatMultiplier(0.625)).toBe("0.625×");
  });
});

describe("type stats", () => {
  it("counts single-type weaknesses and super-effective targets", () => {
    expect(countWeaknesses("grass")).toBe(5);
    expect(countSuperEffective("fire")).toBe(4);
    expect(typeLabel("psychic")).toBe("Psychic");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/typechart.test.ts`
Expected: FAIL，无法解析 `@/lib/typechart`

- [ ] **Step 3: 实现**

`src/lib/typechart.ts`：

```ts
import typesJson from "../../data/types.json";
import { TYPE_NAMES, type TypeData, type TypeName } from "./model";

const data = typesJson as unknown as TypeData;

export type Profile = Record<TypeName, number>;
export type MatchupGroup = { multiplier: number; types: TypeName[] };

export function typeLabel(t: TypeName): string {
  return data.names[t];
}

export function effectiveness(attack: TypeName, defenders: readonly TypeName[]): number {
  return defenders.reduce((m, d) => m * data.chart[attack][d], 1);
}

export function defenseProfile(defenders: readonly TypeName[]): Profile {
  return Object.fromEntries(TYPE_NAMES.map((a) => [a, effectiveness(a, defenders)])) as Profile;
}

export function offenseProfile(attack: TypeName): Profile {
  return Object.fromEntries(TYPE_NAMES.map((d) => [d, effectiveness(attack, [d])])) as Profile;
}

export function groupByMultiplier(profile: Profile, includeNeutral = false): MatchupGroup[] {
  const groups = new Map<number, TypeName[]>();
  for (const t of TYPE_NAMES) {
    const m = profile[t];
    if (m === 1 && !includeNeutral) continue;
    groups.set(m, [...(groups.get(m) ?? []), t]);
  }
  return [...groups]
    .map(([multiplier, types]) => ({ multiplier, types }))
    .sort((a, b) => b.multiplier - a.multiplier);
}

const FRACTIONS: Record<string, string> = { "0.5": "½", "0.25": "¼", "0.125": "⅛" };

export function formatMultiplier(m: number): string {
  return `${FRACTIONS[String(m)] ?? String(m)}×`;
}

export function countWeaknesses(t: TypeName): number {
  return TYPE_NAMES.filter((a) => effectiveness(a, [t]) > 1).length;
}

export function countSuperEffective(t: TypeName): number {
  return TYPE_NAMES.filter((d) => effectiveness(t, [d]) > 1).length;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/typechart.test.ts`
Expected: PASS（8 tests）

- [ ] **Step 5: Commit**

```bash
git add src/lib/typechart.ts tests/unit/typechart.test.ts
git commit -m "feat(lib): add type effectiveness and multiplier formatting"
```

---

### Task 7: 特性修正（matchups）

**Files:**
- Create: `src/lib/matchups.ts`
- Test: `tests/unit/matchups.test.ts`

**Interfaces:**
- Consumes: Task 6 的 `defenseProfile`、`groupByMultiplier`、`Profile`、`MatchupGroup`；`AbilityModifier`、`Pokemon`、`TYPE_NAMES`
- Produces:
  - `applyAbility(profile: Profile, ability?: AbilityModifier): Profile`
  - `defensiveMatchups(pokemon: Pick<Pokemon, "types">, ability?: AbilityModifier): MatchupGroup[]`
  - `type AbilityChange = { ability: AbilityModifier; changes: { type: TypeName; from: number; to: number }[] }`
  - `abilityChanges(pokemon: Pick<Pokemon, "types" | "abilities">, modifiers: readonly AbilityModifier[]): AbilityChange[]`

- [ ] **Step 1: 写失败的测试**

`tests/unit/matchups.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import modifiersJson from "../../data/abilities.json";
import { abilityChanges, applyAbility, defensiveMatchups } from "@/lib/matchups";
import type { AbilityModifier } from "@/lib/model";
import { defenseProfile } from "@/lib/typechart";

const modifiers = modifiersJson as unknown as AbilityModifier[];
const get = (slug: string) => modifiers.find((m) => m.slug === slug)!;

describe("Bronzong (Steel/Psychic)", () => {
  const types = ["steel", "psychic"] as const;

  it("takes 2× from Ground and Fire by default", () => {
    const p = defenseProfile(types);
    expect(p.ground).toBe(2);
    expect(p.fire).toBe(2);
  });

  it("Levitate makes Ground 0×", () => {
    expect(applyAbility(defenseProfile(types), get("levitate")).ground).toBe(0);
  });

  it("Heatproof makes Fire 1×", () => {
    expect(applyAbility(defenseProfile(types), get("heatproof")).fire).toBe(1);
  });

  it("reports both ability changes", () => {
    const changes = abilityChanges({ types: [...types], abilities: ["levitate", "heatproof", "heavy-metal"] }, modifiers);
    expect(changes.map((c) => [c.ability.slug, c.changes])).toEqual([
      ["levitate", [{ type: "ground", from: 2, to: 0 }]],
      ["heatproof", [{ type: "fire", from: 2, to: 1 }]],
    ]);
  });
});

describe("Shedinja (Bug/Ghost, Wonder Guard)", () => {
  it("can only be hit by super-effective types", () => {
    const groups = defensiveMatchups({ types: ["bug", "ghost"] }, get("wonder-guard"));
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ multiplier: 2, types: ["flying", "rock", "ghost", "fire", "dark"] });
    expect(groups[1].multiplier).toBe(0);
    expect(groups[1].types).toHaveLength(13);
  });
});

describe("non-standard multipliers", () => {
  it("Dry Skin: Water 0×, Fire ×1.25 on top of the type multiplier", () => {
    const p = applyAbility(defenseProfile(["poison", "fighting"]), get("dry-skin"));
    expect(p.water).toBe(0);
    expect(p.fire).toBe(1.25);
  });

  it("Thick Fat on a ¼× Fire resistance gives ⅛×", () => {
    expect(applyAbility(defenseProfile(["water", "dragon"]), get("thick-fat")).fire).toBe(0.125);
  });

  it("ignores abilities that do not touch type matchups", () => {
    expect(abilityChanges({ types: ["fire"], abilities: ["blaze"] }, modifiers)).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/matchups.test.ts`
Expected: FAIL，无法解析 `@/lib/matchups`

- [ ] **Step 3: 实现**

`src/lib/matchups.ts`：

```ts
import { TYPE_NAMES, type AbilityModifier, type Pokemon, type TypeName } from "./model";
import { defenseProfile, groupByMultiplier, type MatchupGroup, type Profile } from "./typechart";

export function applyAbility(profile: Profile, ability?: AbilityModifier): Profile {
  if (!ability) return profile;
  const out = { ...profile };
  for (const t of TYPE_NAMES) {
    if (ability.wonderGuard && out[t] < 2) out[t] = 0;
    const mult = ability.multipliers?.[t];
    if (mult !== undefined) out[t] = out[t] * mult;
  }
  return out;
}

export function defensiveMatchups(pokemon: Pick<Pokemon, "types">, ability?: AbilityModifier): MatchupGroup[] {
  return groupByMultiplier(applyAbility(defenseProfile(pokemon.types), ability));
}

export type AbilityChange = {
  ability: AbilityModifier;
  changes: { type: TypeName; from: number; to: number }[];
};

export function abilityChanges(
  pokemon: Pick<Pokemon, "types" | "abilities">,
  modifiers: readonly AbilityModifier[],
): AbilityChange[] {
  const base = defenseProfile(pokemon.types);
  return pokemon.abilities.flatMap((slug) => {
    const ability = modifiers.find((m) => m.slug === slug);
    if (!ability) return [];
    const after = applyAbility(base, ability);
    const changes = TYPE_NAMES.filter((t) => after[t] !== base[t]).map((t) => ({ type: t, from: base[t], to: after[t] }));
    return changes.length ? [{ ability, changes }] : [];
  });
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/matchups.test.ts`
Expected: PASS（8 tests）

- [ ] **Step 5: Commit**

```bash
git add src/lib/matchups.ts tests/unit/matchups.test.ts
git commit -m "feat(lib): apply ability modifiers to defensive matchups"
```

---

### Task 8: 推荐对策（counters）

**Files:**
- Create: `src/lib/counters.ts`
- Test: `tests/unit/counters.test.ts`

**Interfaces:**
- Consumes: Task 6 的 `effectiveness`；`Pokemon`
- Produces:
  - `offenseVs(attacker: Pick<Pokemon, "types">, target: Pick<Pokemon, "types">): number`
  - `threatFrom(target: Pick<Pokemon, "types">, candidate: Pick<Pokemon, "types">): number`
  - `baseStatTotal(p: Pick<Pokemon, "stats">): number`
  - `isMega(p: Pick<Pokemon, "form">): boolean`
  - `recommendCounters(target: Pokemon, all: readonly Pokemon[], n?: number): Pokemon[]`

规则（spec 第 3 节）：只看属性；候选须进攻倍率 ≥ 2；排除同物种与 Mega；排序：进攻倍率降序 → 承受倍率升序 → 种族值总和降序 → 图鉴号升序。

- [ ] **Step 1: 写失败的测试**

`tests/unit/counters.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { baseStatTotal, isMega, offenseVs, recommendCounters, threatFrom } from "@/lib/counters";
import type { Pokemon, TypeName } from "@/lib/model";

function mk(slug: string, types: TypeName[], bst: number, over: Partial<Pokemon> = {}): Pokemon {
  return {
    slug, name: slug, speciesSlug: slug, dex: 1, generation: 1, form: null, types, abilities: [],
    stats: { hp: bst, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, evolution: [[slug]], sprite: "", ...over,
  };
}

const charizard = mk("charizard", ["fire", "flying"], 534);
const pool = [
  charizard,
  mk("charizard-mega-y", ["fire", "flying"], 634, { speciesSlug: "charizard", form: "mega-y" }),
  mk("pikachu", ["electric"], 320),
  mk("blastoise", ["water"], 530),
  mk("golem", ["rock", "ground"], 495),
  mk("tyranitar", ["rock", "dark"], 600),
  mk("tyranitar-mega", ["rock", "dark"], 700, { speciesSlug: "tyranitar", form: "mega" }),
  mk("bulbasaur", ["grass", "poison"], 318),
];

describe("counter scoring", () => {
  it("scores offense and threat by type only", () => {
    expect(offenseVs(pool[5], charizard)).toBe(4);
    expect(threatFrom(charizard, pool[5])).toBe(0.5);
    expect(threatFrom(charizard, pool[3])).toBe(1);
    expect(baseStatTotal(charizard)).toBe(534);
  });

  it("detects mega forms", () => {
    expect(isMega({ form: "mega-x" })).toBe(true);
    expect(isMega({ form: "mega" })).toBe(true);
    expect(isMega({ form: "alola" })).toBe(false);
    expect(isMega({ form: null })).toBe(false);
  });
});

describe("recommendCounters", () => {
  it("ranks by offense, then threat, then base stat total; excludes same species, megas and non-SE", () => {
    expect(recommendCounters(charizard, pool).map((p) => p.slug)).toEqual(["tyranitar", "golem", "blastoise", "pikachu"]);
  });

  it("respects n", () => {
    expect(recommendCounters(charizard, pool, 2)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/counters.test.ts`
Expected: FAIL，无法解析 `@/lib/counters`

- [ ] **Step 3: 实现**

`src/lib/counters.ts`：

```ts
import type { Pokemon } from "./model";
import { effectiveness } from "./typechart";

type Typed = Pick<Pokemon, "types">;

export function offenseVs(attacker: Typed, target: Typed): number {
  return Math.max(...attacker.types.map((t) => effectiveness(t, target.types)));
}

export function threatFrom(target: Typed, candidate: Typed): number {
  return Math.max(...target.types.map((t) => effectiveness(t, candidate.types)));
}

export function baseStatTotal(p: Pick<Pokemon, "stats">): number {
  return Object.values(p.stats).reduce((a, b) => a + b, 0);
}

export function isMega(p: Pick<Pokemon, "form">): boolean {
  return p.form !== null && /^mega(-|$)/.test(p.form);
}

export function recommendCounters(target: Pokemon, all: readonly Pokemon[], n = 6): Pokemon[] {
  return all
    .filter((c) => c.speciesSlug !== target.speciesSlug && !isMega(c))
    .map((c) => ({ c, off: offenseVs(c, target), threat: threatFrom(target, c), bst: baseStatTotal(c) }))
    .filter((x) => x.off >= 2)
    .sort((a, b) => b.off - a.off || a.threat - b.threat || b.bst - a.bst || a.c.dex - b.c.dex)
    .slice(0, n)
    .map((x) => x.c);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/counters.test.ts`
Expected: PASS（4 tests）

- [ ] **Step 5: Commit**

```bash
git add src/lib/counters.ts tests/unit/counters.test.ts
git commit -m "feat(lib): recommend type-based counters"
```

---

### Task 9: 数据访问层与搜索

**Files:**
- Create: `src/lib/data.ts`、`src/lib/search.ts`
- Test: `tests/unit/search.test.ts`、`tests/data/data-access.test.ts`

**Interfaces:**
- Consumes: `data/pokemon.json`、`data/natures.json`、`data/abilities.json`、`data/ability-names.json`；`Pokemon`、`Nature`、`AbilityModifier`、`TypeName`
- Produces:
  - `src/lib/data.ts`：`getAllPokemon(): Pokemon[]`、`getPokemon(slug: string): Pokemon | undefined`、`getNatures(): Nature[]`、`getAbilityModifiers(): AbilityModifier[]`、`getAbilityName(slug: string): string`、`pokemonOfType(t: TypeName): Pokemon[]`、`sameTypeCombo(p: Pokemon): Pokemon[]`、`getEvolutionStages(p: Pokemon): Pokemon[][]`、`hasEvolution(p: Pick<Pokemon, "evolution">): boolean`、`type PokemonSummary = Pick<Pokemon, "slug" | "name" | "dex" | "generation" | "types" | "sprite">`、`toSummary(p: Pokemon): PokemonSummary`
  - `src/lib/search.ts`：`normalize(s: string): string`、`matchesQuery(p: { name: string; slug: string; dex: number }, q: string): boolean`、`type PokemonFilter = { q: string; type: TypeName | null; gen: number | null }`、`filterPokemon<T extends PokemonSummary>(list: readonly T[], f: PokemonFilter): T[]`

`search.ts` 不能 import `data.ts`（它会被客户端组件引用，不能把整份 JSON 打进浏览器包）。`PokemonSummary` 用 `import type` 引入。

- [ ] **Step 1: 写失败的测试**

`tests/unit/search.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { filterPokemon, matchesQuery, normalize } from "@/lib/search";

const flabebe = { slug: "flabebe", name: "Flabébé", dex: 669, generation: 6, types: ["fairy" as const], sprite: "" };
const mime = { slug: "mr-mime", name: "Mr. Mime", dex: 122, generation: 1, types: ["psychic" as const, "fairy" as const], sprite: "" };
const farfetchd = { slug: "farfetchd", name: "Farfetch’d", dex: 83, generation: 1, types: ["normal" as const, "flying" as const], sprite: "" };
const charizard = { slug: "charizard", name: "Charizard", dex: 6, generation: 1, types: ["fire" as const, "flying" as const], sprite: "" };
const all = [charizard, farfetchd, mime, flabebe];

describe("normalize", () => {
  it("strips accents, punctuation, spaces and case", () => {
    expect(normalize("Flabébé")).toBe("flabebe");
    expect(normalize("Mr. Mime")).toBe("mrmime");
    expect(normalize("Farfetch’d")).toBe("farfetchd");
  });
});

describe("matchesQuery", () => {
  it("matches accent-free and punctuation-free input", () => {
    expect(matchesQuery(flabebe, "flabebe")).toBe(true);
    expect(matchesQuery(mime, "mr mime")).toBe(true);
    expect(matchesQuery(farfetchd, "farfetchd")).toBe(true);
  });

  it("matches dex numbers exactly, with or without #", () => {
    expect(matchesQuery(charizard, "6")).toBe(true);
    expect(matchesQuery(charizard, "#6")).toBe(true);
    expect(matchesQuery(farfetchd, "6")).toBe(false);
  });

  it("treats blank queries as match-all", () => {
    expect(matchesQuery(charizard, "   ")).toBe(true);
  });
});

describe("filterPokemon", () => {
  it("combines query, type and generation", () => {
    expect(filterPokemon(all, { q: "", type: "flying", gen: 1 }).map((p) => p.slug)).toEqual(["charizard", "farfetchd"]);
    expect(filterPokemon(all, { q: "mime", type: "fairy", gen: null }).map((p) => p.slug)).toEqual(["mr-mime"]);
  });
});
```

`tests/data/data-access.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import {
  getAbilityName,
  getEvolutionStages,
  getPokemon,
  hasEvolution,
  pokemonOfType,
  sameTypeCombo,
  toSummary,
} from "@/lib/data";

describe("data access", () => {
  it("looks up by slug", () => {
    expect(getPokemon("charizard")?.name).toBe("Charizard");
    expect(getPokemon("does-not-exist")).toBeUndefined();
  });

  it("resolves evolution stages to records", () => {
    const stages = getEvolutionStages(getPokemon("charizard")!);
    expect(stages.map((s) => s.map((p) => p.slug))).toEqual([["charmander"], ["charmeleon"], ["charizard"]]);
  });

  it("knows when a Pokémon does not evolve", () => {
    expect(hasEvolution(getPokemon("tauros")!)).toBe(false);
    expect(hasEvolution(getPokemon("eevee")!)).toBe(true);
    expect(hasEvolution({ evolution: [["solo"]] })).toBe(false);
  });

  it("finds others with the same type combination, order-insensitive", () => {
    const same = sameTypeCombo(getPokemon("charizard")!).map((p) => p.slug);
    expect(same).toContain("moltres");
    expect(same).not.toContain("charizard");
  });

  it("filters by type and names abilities", () => {
    expect(pokemonOfType("fire").some((p) => p.slug === "charizard")).toBe(true);
    expect(getAbilityName("levitate")).toBe("Levitate");
  });

  it("builds summaries with only list fields", () => {
    expect(Object.keys(toSummary(getPokemon("pikachu")!)).sort()).toEqual(["dex", "generation", "name", "slug", "sprite", "types"]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL，无法解析 `@/lib/search` 和 `@/lib/data`

- [ ] **Step 3: 实现**

`src/lib/data.ts`：

```ts
import abilityModifiersJson from "../../data/abilities.json";
import abilityNamesJson from "../../data/ability-names.json";
import naturesJson from "../../data/natures.json";
import pokemonJson from "../../data/pokemon.json";
import type { AbilityModifier, Nature, Pokemon, TypeName } from "./model";

const POKEMON = pokemonJson as unknown as Pokemon[];
const BY_SLUG = new Map(POKEMON.map((p) => [p.slug, p]));
const ABILITY_NAMES = abilityNamesJson as Record<string, string>;

export type PokemonSummary = Pick<Pokemon, "slug" | "name" | "dex" | "generation" | "types" | "sprite">;

export function getAllPokemon(): Pokemon[] {
  return POKEMON;
}

export function getPokemon(slug: string): Pokemon | undefined {
  return BY_SLUG.get(slug);
}

export function getNatures(): Nature[] {
  return naturesJson as unknown as Nature[];
}

export function getAbilityModifiers(): AbilityModifier[] {
  return abilityModifiersJson as unknown as AbilityModifier[];
}

export function getAbilityName(slug: string): string {
  return ABILITY_NAMES[slug] ?? slug;
}

export function pokemonOfType(t: TypeName): Pokemon[] {
  return POKEMON.filter((p) => p.types.includes(t));
}

const comboKey = (types: readonly TypeName[]) => [...types].sort().join("/");

export function sameTypeCombo(p: Pokemon): Pokemon[] {
  const key = comboKey(p.types);
  return POKEMON.filter((o) => o.slug !== p.slug && comboKey(o.types) === key);
}

export function getEvolutionStages(p: Pokemon): Pokemon[][] {
  return p.evolution.map((stage) => stage.map((s) => BY_SLUG.get(s)).filter((x): x is Pokemon => x !== undefined));
}

export function hasEvolution(p: Pick<Pokemon, "evolution">): boolean {
  return p.evolution.flat().length > 1;
}

export function toSummary(p: Pokemon): PokemonSummary {
  const { slug, name, dex, generation, types, sprite } = p;
  return { slug, name, dex, generation, types, sprite };
}
```

`src/lib/search.ts`：

```ts
import type { PokemonSummary } from "./data";
import type { TypeName } from "./model";

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function matchesQuery(p: { name: string; slug: string; dex: number }, q: string): boolean {
  const trimmed = q.trim().replace(/^#/, "");
  if (trimmed === "") return true;
  if (/^\d+$/.test(trimmed)) return p.dex === Number(trimmed);
  const nq = normalize(trimmed);
  return normalize(p.name).includes(nq) || normalize(p.slug).includes(nq);
}

export type PokemonFilter = { q: string; type: TypeName | null; gen: number | null };

export function filterPokemon<T extends PokemonSummary>(list: readonly T[], f: PokemonFilter): T[] {
  return list.filter(
    (p) => (!f.type || p.types.includes(f.type)) && (!f.gen || p.generation === f.gen) && matchesQuery(p, f.q),
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS（全部）

- [ ] **Step 5: Commit**

```bash
git add src/lib/data.ts src/lib/search.ts tests/unit/search.test.ts tests/data/data-access.test.ts
git commit -m "feat(lib): add data access layer and accent-insensitive search"
```

---

### Task 10: 全站布局、SEO 工具、共享组件、法务页与 404

**Files:**
- Create: `src/lib/seo.ts`、`src/lib/text.ts`、`src/lib/type-colors.ts`
- Create: `src/components/JsonLd.tsx`、`Breadcrumbs.tsx`、`Faq.tsx`、`TypeBadge.tsx`、`Sprite.tsx`、`AdSlot.tsx`
- Modify: `src/app/layout.tsx`、`src/app/page.tsx`（临时占位，Task 11 替换）
- Create: `src/app/about/page.tsx`、`src/app/privacy/page.tsx`、`src/app/terms/page.tsx`、`src/app/not-found.tsx`
- Test: `tests/unit/seo.test.ts`

**Interfaces:**
- Consumes: `typeLabel`、`TypeName`、`getPokemon`
- Produces:
  - `src/lib/seo.ts`：`SITE_URL = "https://monpedia.net"`、`SITE_NAME = "Monpedia"`、`absoluteUrl(path: string): string`、`pageMetadata(o: { title: string; description: string; path: string }): Metadata`（title 自动追加 ` | Monpedia`）、`breadcrumbJsonLd(items: Crumb[])`、`type Crumb = { name: string; path: string }`、`type Qa = { q: string; a: string }`、`faqJsonLd(qas: Qa[])`
  - `src/lib/text.ts`：`joinList(items: string[]): string`
  - `src/lib/type-colors.ts`：`TYPE_COLORS: Record<TypeName, { bg: string; fg: string }>`
  - 组件：`<JsonLd data />`、`<Breadcrumbs items: Crumb[] />`（自动在前面加 Home；`items` 为空时只输出 JSON-LD）、`<Faq items: Qa[] />`、`<TypeBadge type link? />`、`<Sprite src: string | null name type size? eager? />`、`<AdSlot id height? />`

- [ ] **Step 1: 写失败的测试**

`tests/unit/seo.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { joinList } from "@/lib/text";

describe("absoluteUrl", () => {
  it("never adds a trailing slash", () => {
    expect(absoluteUrl("/")).toBe("https://monpedia.net");
    expect(absoluteUrl("/pokemon/charizard")).toBe("https://monpedia.net/pokemon/charizard");
    expect(absoluteUrl("/natures/")).toBe("https://monpedia.net/natures");
  });
});

describe("pageMetadata", () => {
  it("appends the site name and sets canonical", () => {
    const m = pageMetadata({ title: "Fire Type Weakness & Strengths", description: "d", path: "/types/fire" });
    expect(m.title).toEqual({ absolute: "Fire Type Weakness & Strengths | Monpedia" });
    expect(m.alternates?.canonical).toBe("https://monpedia.net/types/fire");
  });
});

describe("JSON-LD", () => {
  it("builds breadcrumbs with absolute URLs", () => {
    expect(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Pokémon", path: "/pokemon" }])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://monpedia.net" },
        { "@type": "ListItem", position: 2, name: "Pokémon", item: "https://monpedia.net/pokemon" },
      ],
    });
  });

  it("builds FAQPage", () => {
    expect(faqJsonLd([{ q: "Q?", a: "A." }]).mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Q?",
      acceptedAnswer: { "@type": "Answer", text: "A." },
    });
  });
});

describe("joinList", () => {
  it("joins with commas and 'and'", () => {
    expect(joinList([])).toBe("");
    expect(joinList(["A"])).toBe("A");
    expect(joinList(["A", "B"])).toBe("A and B");
    expect(joinList(["A", "B", "C"])).toBe("A, B and C");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: FAIL，无法解析 `@/lib/seo`

- [ ] **Step 3: 实现工具函数**

`src/lib/seo.ts`：

```ts
import type { Metadata } from "next";

export const SITE_URL = "https://monpedia.net";
export const SITE_NAME = "Monpedia";

export type Crumb = { name: string; path: string };
export type Qa = { q: string; a: string };

export function absoluteUrl(path: string): string {
  const clean = `/${path}`.replace(/\/+/g, "/").replace(/\/$/, "");
  return clean === "" ? SITE_URL : `${SITE_URL}${clean}`;
}

export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = absoluteUrl(path);
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, siteName: SITE_NAME, type: "website" },
  };
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(qas: Qa[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
```

`src/lib/text.ts`：

```ts
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
```

`src/lib/type-colors.ts`：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: PASS（6 tests）

- [ ] **Step 5: 写共享组件**

`src/components/JsonLd.tsx`：

```tsx
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
```

`src/components/Breadcrumbs.tsx`：

```tsx
import Link from "next/link";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      {items.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          <ol className="flex flex-wrap gap-1">
            {all.map((it, i) => (
              <li key={it.path}>
                {i < all.length - 1 ? (
                  <>
                    <Link href={it.path} className="hover:underline">{it.name}</Link>
                    <span aria-hidden="true"> › </span>
                  </>
                ) : (
                  <span aria-current="page">{it.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </>
  );
}
```

`src/components/Faq.tsx`：

```tsx
import { faqJsonLd, type Qa } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

export function Faq({ items }: { items: Qa[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Frequently asked questions</h2>
      <dl className="mt-3 space-y-4">
        {items.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-medium">{q}</dt>
            <dd className="mt-1 text-zinc-600 dark:text-zinc-400">{a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqJsonLd(items)} />
    </section>
  );
}
```

`src/components/TypeBadge.tsx`：

```tsx
import Link from "next/link";
import type { TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { typeLabel } from "@/lib/typechart";

export function TypeBadge({ type, link = true }: { type: TypeName; link?: boolean }) {
  const { bg, fg } = TYPE_COLORS[type];
  const className = "inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide";
  const style = { backgroundColor: bg, color: fg };
  return link ? (
    <Link href={`/types/${type}`} className={className} style={style}>{typeLabel(type)}</Link>
  ) : (
    <span className={className} style={style}>{typeLabel(type)}</span>
  );
}
```

`src/components/Sprite.tsx`：

```tsx
"use client";

import { useState } from "react";
import type { TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";

type Props = { src: string | null; name: string; type: TypeName; size?: number; eager?: boolean };

export function Sprite({ src, name, type, size = 96, eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const { bg, fg } = TYPE_COLORS[type];
    return (
      <div
        role="img"
        aria-label={name}
        className="flex shrink-0 items-center justify-center rounded-full font-bold"
        style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize: size / 3 }}
      >
        {name.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className="shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
```

`src/components/AdSlot.tsx`：

```tsx
export function AdSlot({ id, height = 250 }: { id: string; height?: number }) {
  if (process.env.NEXT_PUBLIC_ADS !== "on") return null;
  return <div data-ad-slot={id} aria-hidden="true" className="my-8 w-full" style={{ minHeight: height }} />;
}
```

- [ ] **Step 6: 写布局、法务页、404**

`src/app/layout.tsx` 整个替换为：

```tsx
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: SITE_NAME };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const NAV = [
  { href: "/", label: "Type Chart" },
  { href: "/pokemon", label: "Pokémon" },
  { href: "/natures", label: "Natures" },
  { href: "/winds-waves", label: "Winds & Waves" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const beacon = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">Monpedia</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-xs text-zinc-500 dark:text-zinc-400">
            <p>
              Monpedia is an unofficial fan site. Pokémon and all related names are trademarks of Nintendo,
              Game Freak and The Pokémon Company. Monpedia is not affiliated with or endorsed by them.
            </p>
            <p className="flex gap-4">
              <Link href="/about" className="hover:underline">About</Link>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </p>
          </div>
        </footer>
        {beacon && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: beacon })}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
```

`src/app/page.tsx` 临时替换为（Task 11 会整体替换）：

```tsx
export default function Home() {
  return <h1>Pokémon Type Chart &amp; Weakness Calculator</h1>;
}
```

`src/app/about/page.tsx`：

```tsx
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Monpedia",
  description: "Monpedia is an unofficial fan-made toolkit for Pokémon type matchups, weaknesses, counters and natures.",
  path: "/about",
});

export default function About() {
  return (
    <article className="prose-sm max-w-2xl space-y-4">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="text-2xl font-bold">About Monpedia</h1>
      <p>
        Monpedia is a free, fan-made set of tools for Pokémon players: a type chart and weakness calculator,
        a nature chart, and a weakness and counters page for every Pokémon.
      </p>
      <p>
        Type matchups follow the current rules used since Generation 6, including the Fairy type. Pokémon data
        comes from the open-source PokeAPI project. We only publish officially confirmed information and never
        publish leaks.
      </p>
      <p>
        Monpedia is an unofficial fan site and is not affiliated with, endorsed by or sponsored by Nintendo,
        Game Freak, Creatures Inc. or The Pokémon Company. Pokémon and all related names are their trademarks.
      </p>
      <p>Contact: contact@monpedia.net</p>
    </article>
  );
}
```

`src/app/privacy/page.tsx`：

```tsx
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Monpedia handles data: no accounts, no tracking cookies, privacy-friendly analytics.",
  path: "/privacy",
});

export default function Privacy() {
  return (
    <article className="max-w-2xl space-y-4">
      <Breadcrumbs items={[{ name: "Privacy", path: "/privacy" }]} />
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p>Last updated: October 15, 2026.</p>
      <p>Monpedia has no user accounts and does not ask you for personal information.</p>
      <p>
        We use Cloudflare Web Analytics to count page views. It does not use cookies and does not track you
        across websites. Our hosting provider, Cloudflare, processes standard request data such as IP
        addresses to deliver and protect the site.
      </p>
      <p>
        Pokémon images are loaded from the jsDelivr CDN, which receives standard request data when your browser
        downloads them.
      </p>
      <p>
        If we start showing advertising, this policy will be updated before ads go live to describe the
        advertising partners and the cookies they use.
      </p>
      <p>Questions: contact@monpedia.net</p>
    </article>
  );
}
```

`src/app/terms/page.tsx`：

```tsx
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description: "Terms of use for Monpedia, an unofficial Pokémon fan site.",
  path: "/terms",
});

export default function Terms() {
  return (
    <article className="max-w-2xl space-y-4">
      <Breadcrumbs items={[{ name: "Terms", path: "/terms" }]} />
      <h1 className="text-2xl font-bold">Terms of Use</h1>
      <p>Last updated: October 15, 2026.</p>
      <p>
        Monpedia is provided free of charge and as is. We try to keep the data accurate but make no guarantee
        that it is complete or error-free.
      </p>
      <p>
        Pokémon and all related names, characters and images are trademarks and copyrights of Nintendo,
        Game Freak, Creatures Inc. and The Pokémon Company. Monpedia is an unofficial fan site and claims no
        ownership of them.
      </p>
      <p>You may link to any page on Monpedia. Do not copy the site in bulk.</p>
      <p>Contact: contact@monpedia.net</p>
    </article>
  );
}
```

`src/app/not-found.tsx`：

```tsx
import Link from "next/link";
import { getPokemon } from "@/lib/data";
import type { Pokemon } from "@/lib/model";

const POPULAR = ["charizard", "pikachu", "gengar", "garchomp", "lucario", "eevee"];

export default function NotFound() {
  const popular = POPULAR.map(getPokemon).filter((p): p is Pokemon => p !== undefined);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p>
        That page does not exist. <Link href="/pokemon" className="underline">Search all Pokémon</Link> or try one of these:
      </p>
      <ul className="flex flex-wrap gap-3">
        {popular.map((p) => (
          <li key={p.slug}>
            <Link href={`/pokemon/${p.slug}`} className="underline">{p.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 7: 构建确认**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: 全部成功；`out/about.html`、`out/privacy.html`、`out/terms.html`、`out/404.html` 存在。

- [ ] **Step 8: Commit**

```bash
git add src tests/unit/seo.test.ts
git commit -m "feat(site): add layout, SEO helpers, shared components and legal pages"
```

---

### Task 11: 首页属性计算器与完整克制表

**Files:**
- Create: `src/lib/calculator.ts`、`src/lib/home-faq.ts`、`src/components/TypeCalculator.tsx`、`src/components/TypeChartTable.tsx`
- Modify: `src/app/page.tsx`（整个替换）
- Test: `tests/unit/calculator.test.ts`、`tests/unit/home-faq.test.ts`

**Interfaces:**
- Consumes: `TYPE_NAMES`、`isTypeName`、`TypeName`、`defenseProfile`、`offenseProfile`、`groupByMultiplier`、`formatMultiplier`、`effectiveness`、`typeLabel`、`countWeaknesses`、`countSuperEffective`、`joinList`、`Qa`、`pageMetadata`、`TypeBadge`、`Breadcrumbs`、`Faq`、`AdSlot`
- Produces:
  - `type CalcMode = "defense" | "attack"`、`type CalcState = { mode: CalcMode; types: TypeName[] }`、`DEFAULT_STATE`
  - `parseCalcState(search: string): CalcState`、`serializeCalcState(s: CalcState): string`、`toggleType(s: CalcState, t: TypeName): CalcState`、`setMode(s: CalcState, mode: CalcMode): CalcState`、`groupLabel(mode: CalcMode, m: number): string`
  - `homeFaq(): Qa[]`
  - DOM 约定（Task 17 E2E 依赖）：计算器是 `<section aria-label="Type calculator">`；模式切换是 `role="tab"` 的按钮「Defending」「Attacking」；属性按钮带 `aria-pressed`；结果容器 `data-testid="calc-results"`，每组 `data-multiplier="<数值>"`。

- [ ] **Step 1: 写失败的测试**

`tests/unit/calculator.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  groupLabel,
  parseCalcState,
  serializeCalcState,
  setMode,
  toggleType,
} from "@/lib/calculator";

describe("parseCalcState", () => {
  it("defaults when empty", () => {
    expect(parseCalcState("")).toEqual(DEFAULT_STATE);
    expect(DEFAULT_STATE).toEqual({ mode: "defense", types: ["fire"] });
  });

  it("is case-insensitive and keeps at most two defending types", () => {
    expect(parseCalcState("?t=FIRE,flying")).toEqual({ mode: "defense", types: ["fire", "flying"] });
    expect(parseCalcState("?t=fire,fire,water,grass")).toEqual({ mode: "defense", types: ["fire", "water"] });
  });

  it("drops unknown types and falls back to the default when nothing is left", () => {
    expect(parseCalcState("?t=banana,water").types).toEqual(["water"]);
    expect(parseCalcState("?t=banana")).toEqual(DEFAULT_STATE);
    expect(parseCalcState("?t=")).toEqual(DEFAULT_STATE);
  });

  it("keeps one type in attack mode", () => {
    expect(parseCalcState("?m=attack&t=fire,water")).toEqual({ mode: "attack", types: ["fire"] });
    expect(parseCalcState("?m=attack")).toEqual({ mode: "attack", types: ["fire"] });
    expect(parseCalcState("?m=nonsense&t=ice").mode).toBe("defense");
  });
});

describe("serializeCalcState", () => {
  it("omits the default state and round-trips others", () => {
    expect(serializeCalcState(DEFAULT_STATE)).toBe("");
    expect(serializeCalcState({ mode: "defense", types: ["fire", "flying"] })).toBe("?t=fire,flying");
    const s = { mode: "attack" as const, types: ["ground" as const] };
    expect(serializeCalcState(s)).toBe("?m=attack&t=ground");
    expect(parseCalcState(serializeCalcState(s))).toEqual(s);
  });
});

describe("toggleType / setMode", () => {
  it("adds up to two types, replacing the oldest", () => {
    let s = toggleType(DEFAULT_STATE, "flying");
    expect(s.types).toEqual(["fire", "flying"]);
    s = toggleType(s, "water");
    expect(s.types).toEqual(["flying", "water"]);
  });

  it("removes a selected type but never empties the selection", () => {
    expect(toggleType({ mode: "defense", types: ["fire", "flying"] }, "fire").types).toEqual(["flying"]);
    expect(toggleType({ mode: "defense", types: ["fire"] }, "fire").types).toEqual(["fire"]);
  });

  it("attack mode replaces the single type", () => {
    expect(toggleType({ mode: "attack", types: ["fire"] }, "ice").types).toEqual(["ice"]);
    expect(setMode({ mode: "defense", types: ["fire", "flying"] }, "attack")).toEqual({ mode: "attack", types: ["fire"] });
  });
});

describe("groupLabel", () => {
  it("labels defense and attack groups", () => {
    expect(groupLabel("defense", 4)).toBe("Weak to (4×)");
    expect(groupLabel("defense", 0.5)).toBe("Resists (½×)");
    expect(groupLabel("defense", 0)).toBe("Immune to (0×)");
    expect(groupLabel("attack", 2)).toBe("Super effective against (2×)");
    expect(groupLabel("attack", 0.5)).toBe("Not very effective against (½×)");
    expect(groupLabel("attack", 0)).toBe("No effect on (0×)");
  });
});
```

`tests/unit/home-faq.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { homeFaq } from "@/lib/home-faq";

describe("homeFaq", () => {
  const faq = homeFaq();
  const answer = (start: string) => faq.find((x) => x.q.startsWith(start))!.a;

  it("lists all 18 types", () => {
    expect(answer("How many types")).toContain("18 types");
    expect(answer("How many types")).toContain("Fairy");
  });

  it("computes the types with the most weaknesses", () => {
    expect(answer("Which type has the most weaknesses")).toBe("Grass and Rock each have 5 weaknesses as a single type.");
  });

  it("computes the types that are super effective against the most types", () => {
    expect(answer("Which type is super effective")).toBe("Fighting and Ground are each super effective against 5 types.");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/calculator.test.ts tests/unit/home-faq.test.ts`
Expected: FAIL，无法解析模块

- [ ] **Step 3: 实现纯函数**

`src/lib/calculator.ts`：

```ts
import { isTypeName, type TypeName } from "./model";
import { formatMultiplier } from "./typechart";

export type CalcMode = "defense" | "attack";
export type CalcState = { mode: CalcMode; types: TypeName[] };

export const DEFAULT_STATE: CalcState = { mode: "defense", types: ["fire"] };

const maxTypes = (mode: CalcMode) => (mode === "attack" ? 1 : 2);

export function parseCalcState(search: string): CalcState {
  const params = new URLSearchParams(search);
  const mode: CalcMode = params.get("m") === "attack" ? "attack" : "defense";
  const raw = params.get("t") ?? "";
  const types = [...new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(isTypeName))].slice(
    0,
    maxTypes(mode),
  );
  return { mode, types: types.length ? types : [...DEFAULT_STATE.types] };
}

export function serializeCalcState(s: CalcState): string {
  if (s.mode === DEFAULT_STATE.mode && s.types.join(",") === DEFAULT_STATE.types.join(",")) return "";
  const mode = s.mode === "attack" ? "m=attack&" : "";
  return `?${mode}t=${s.types.join(",")}`;
}

export function toggleType(s: CalcState, t: TypeName): CalcState {
  if (s.types.includes(t)) {
    const rest = s.types.filter((x) => x !== t);
    return { ...s, types: rest.length ? rest : s.types };
  }
  return { ...s, types: [...s.types, t].slice(-maxTypes(s.mode)) };
}

export function setMode(s: CalcState, mode: CalcMode): CalcState {
  return { mode, types: s.types.slice(0, maxTypes(mode)) };
}

export function groupLabel(mode: CalcMode, m: number): string {
  const f = formatMultiplier(m);
  if (mode === "defense") {
    if (m === 0) return `Immune to (${f})`;
    return m > 1 ? `Weak to (${f})` : `Resists (${f})`;
  }
  if (m === 0) return `No effect on (${f})`;
  return m > 1 ? `Super effective against (${f})` : `Not very effective against (${f})`;
}
```

`src/lib/home-faq.ts`：

```ts
import { TYPE_NAMES, type TypeName } from "./model";
import type { Qa } from "./seo";
import { joinList } from "./text";
import { countSuperEffective, countWeaknesses, typeLabel } from "./typechart";

function leaders(score: (t: TypeName) => number): { types: string[]; score: number } {
  const best = Math.max(...TYPE_NAMES.map(score));
  const types = TYPE_NAMES.filter((t) => score(t) === best).map(typeLabel).sort();
  return { types, score: best };
}

export function homeFaq(): Qa[] {
  const weak = leaders(countWeaknesses);
  const strong = leaders(countSuperEffective);
  return [
    {
      q: "How many types are there in Pokémon?",
      a: `There are 18 types: ${joinList(TYPE_NAMES.map(typeLabel))}.`,
    },
    {
      q: "Which type has the most weaknesses?",
      a: `${joinList(weak.types)} ${weak.types.length > 1 ? "each have" : "has"} ${weak.score} weaknesses as a single type.`,
    },
    {
      q: "Which type is super effective against the most types?",
      a: `${joinList(strong.types)} ${strong.types.length > 1 ? "are each" : "is"} super effective against ${strong.score} types.`,
    },
    {
      q: "How do dual-type weaknesses work?",
      a: "The two multipliers are multiplied. A move that is super effective against both types deals 4× damage, one that both types resist deals ¼×, and an immunity on either type makes the total 0×.",
    },
  ];
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/calculator.test.ts tests/unit/home-faq.test.ts`
Expected: PASS（12 tests）

- [ ] **Step 5: 写组件与首页**

`src/components/TypeCalculator.tsx`：

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_STATE,
  groupLabel,
  parseCalcState,
  serializeCalcState,
  setMode,
  toggleType,
  type CalcMode,
  type CalcState,
} from "@/lib/calculator";
import { TYPE_NAMES } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { defenseProfile, groupByMultiplier, offenseProfile, typeLabel } from "@/lib/typechart";
import { TypeBadge } from "./TypeBadge";

const MODES: { mode: CalcMode; label: string }[] = [
  { mode: "defense", label: "Defending" },
  { mode: "attack", label: "Attacking" },
];

export function TypeCalculator() {
  const [state, setState] = useState<CalcState>(DEFAULT_STATE);

  useEffect(() => {
    setState(parseCalcState(window.location.search));
  }, []);

  const update = (next: CalcState) => {
    setState(next);
    window.history.replaceState(null, "", `${window.location.pathname}${serializeCalcState(next)}`);
  };

  const profile = state.mode === "defense" ? defenseProfile(state.types) : offenseProfile(state.types[0]);
  const groups = groupByMultiplier(profile);

  return (
    <section aria-label="Type calculator" className="my-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div role="tablist" className="mb-3 inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={state.mode === mode}
            onClick={() => update(setMode(state, mode))}
            className={`rounded-md px-3 py-1 text-sm font-medium ${state.mode === mode ? "bg-white shadow dark:bg-zinc-700" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
        {state.mode === "defense" ? "Pick up to two defending types." : "Pick the attacking move's type."}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TYPE_NAMES.map((t) => {
          const pressed = state.types.includes(t);
          const { bg, fg } = TYPE_COLORS[t];
          return (
            <button
              key={t}
              type="button"
              aria-pressed={pressed}
              onClick={() => update(toggleType(state, t))}
              className={`rounded-md px-2 py-2 text-sm font-semibold transition ${pressed ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950" : "opacity-60 hover:opacity-100"}`}
              style={{ backgroundColor: bg, color: fg }}
            >
              {typeLabel(t)}
            </button>
          );
        })}
      </div>
      <div data-testid="calc-results" className="mt-5 space-y-3" aria-live="polite">
        {groups.map((g) => (
          <div key={g.multiplier} data-multiplier={g.multiplier}>
            <h3 className="mb-1 text-sm font-semibold">{groupLabel(state.mode, g.multiplier)}</h3>
            <div className="flex flex-wrap gap-1">
              {g.types.map((t) => <TypeBadge key={t} type={t} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

`src/components/TypeChartTable.tsx`：

```tsx
"use client";

import { useState } from "react";
import { TYPE_NAMES, type TypeName } from "@/lib/model";
import { TYPE_COLORS } from "@/lib/type-colors";
import { effectiveness, formatMultiplier, typeLabel } from "@/lib/typechart";

function cellClass(m: number): string {
  if (m === 2) return "bg-green-600 text-white";
  if (m === 0.5) return "bg-red-600/80 text-white";
  if (m === 0) return "bg-zinc-800 text-white";
  return "";
}

export function TypeChartTable() {
  const [row, setRow] = useState<TypeName | null>(null);
  const [col, setCol] = useState<TypeName | null>(null);
  const header = (t: TypeName, onClick: () => void, short: boolean) => {
    const { bg, fg } = TYPE_COLORS[t];
    return (
      <button type="button" onClick={onClick} className="w-full rounded px-1 py-0.5 font-semibold" style={{ backgroundColor: bg, color: fg }}>
        {short ? typeLabel(t).slice(0, 3) : typeLabel(t)}
      </button>
    );
  };
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 bg-white p-1 text-left dark:bg-zinc-950">Atk ↓ Def →</th>
            {TYPE_NAMES.map((d) => (
              <th key={d} scope="col" className="p-0.5">{header(d, () => setCol(col === d ? null : d), true)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPE_NAMES.map((a) => (
            <tr key={a}>
              <th scope="row" className="sticky left-0 bg-white p-0.5 dark:bg-zinc-950">{header(a, () => setRow(row === a ? null : a), false)}</th>
              {TYPE_NAMES.map((d) => {
                const m = effectiveness(a, [d]);
                const focus = row === a || col === d;
                return (
                  <td
                    key={d}
                    title={`${typeLabel(a)} → ${typeLabel(d)}: ${formatMultiplier(m)}`}
                    className={`h-7 w-8 border border-zinc-200 text-center dark:border-zinc-800 ${cellClass(m)} ${focus ? "outline outline-2 -outline-offset-2 outline-zinc-900 dark:outline-white" : ""}`}
                  >
                    {m === 1 ? "" : formatMultiplier(m).replace("×", "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`src/app/page.tsx` 整个替换为：

```tsx
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { TypeCalculator } from "@/components/TypeCalculator";
import { TypeChartTable } from "@/components/TypeChartTable";
import { homeFaq } from "@/lib/home-faq";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pokémon Type Chart & Weakness Calculator",
  description:
    "Interactive Pokémon type chart for all 18 types. Pick one or two types to see weaknesses, resistances and immunities instantly, or check what a move type is super effective against.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <Breadcrumbs items={[]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Type Chart &amp; Weakness Calculator</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Pick a Pokémon&apos;s types to see what it is weak to, or switch to Attacking to see what a move hits hard.
      </p>
      <TypeCalculator />
      <AdSlot id="home-1" />
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Full type chart</h2>
        <p className="mb-3 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Rows are the attacking type, columns the defending type. Tap a type to highlight its row or column.
        </p>
        <TypeChartTable />
      </section>
      <section className="mt-8 max-w-2xl space-y-3">
        <h2 className="text-xl font-semibold">How type matchups work</h2>
        <p>
          Every move has one type. Against a single-type Pokémon a move is super effective (2×), neutral (1×),
          not very effective (½×) or has no effect (0×). Against a dual-type Pokémon the two multipliers are
          multiplied, which is how 4× weaknesses and ¼× resistances happen.
        </p>
        <p>This chart uses the current rules from Generation 6 onward, including the Fairy type.</p>
      </section>
      <Faq items={homeFaq()} />
    </>
  );
}
```

- [ ] **Step 6: 构建确认**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: 全部成功。如果 lint 报 `react-hooks/set-state-in-effect`（新版 eslint-plugin-react-hooks 才有），在 `TypeCalculator.tsx` 的 `setState(parseCalcState(...))` 上一行加 `// eslint-disable-next-line react-hooks/set-state-in-effect`——这里必须在挂载后读网址参数，否则静态 HTML 和水合结果对不上。

- [ ] **Step 7: Commit**

```bash
git add src tests/unit/calculator.test.ts tests/unit/home-faq.test.ts
git commit -m "feat(home): add type calculator and full type chart"
```

---

### Task 12: 性格表页

**Files:**
- Create: `src/lib/natures.ts`、`src/components/NatureTable.tsx`、`src/app/natures/page.tsx`
- Test: `tests/data/natures.test.ts`

**Interfaces:**
- Consumes: `getNatures`、`Nature`、`StatKey`、`STAT_KEYS`、`pageMetadata`、`Breadcrumbs`、`Faq`、`AdSlot`
- Produces: `STAT_LABELS: Record<StatKey, string>`、`filterNatures(natures: readonly Nature[], up: StatKey | null, down: StatKey | null): Nature[]`

- [ ] **Step 1: 写失败的测试**

`tests/data/natures.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { getNatures } from "@/lib/data";
import { filterNatures, STAT_LABELS } from "@/lib/natures";

describe("filterNatures", () => {
  const natures = getNatures();

  it("returns all natures with no filter", () => {
    expect(filterNatures(natures, null, null)).toHaveLength(25);
  });

  it("filters by raised stat", () => {
    expect(filterNatures(natures, "atk", null).map((n) => n.name).sort()).toEqual(["Adamant", "Brave", "Lonely", "Naughty"]);
  });

  it("filters by raised and lowered stat", () => {
    expect(filterNatures(natures, "spe", "spa").map((n) => n.name)).toEqual(["Jolly"]);
  });

  it("labels stats", () => {
    expect(STAT_LABELS.spa).toBe("Sp. Atk");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/data/natures.test.ts`
Expected: FAIL，无法解析 `@/lib/natures`

- [ ] **Step 3: 实现**

`src/lib/natures.ts`：

```ts
import type { Nature, StatKey } from "./model";

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP", atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed",
};

export function filterNatures(natures: readonly Nature[], up: StatKey | null, down: StatKey | null): Nature[] {
  return natures.filter((n) => (!up || n.up === up) && (!down || n.down === down));
}
```

`src/components/NatureTable.tsx`：

```tsx
"use client";

import { useState } from "react";
import { STAT_KEYS, type Nature, type StatKey } from "@/lib/model";
import { filterNatures, STAT_LABELS } from "@/lib/natures";

const BATTLE_STATS = STAT_KEYS.filter((k) => k !== "hp");

function StatSelect({ label, value, onChange }: { label: string; value: StatKey | null; onChange: (v: StatKey | null) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || null) as StatKey | null)}
        className="rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
      >
        <option value="">Any</option>
        {BATTLE_STATS.map((k) => <option key={k} value={k}>{STAT_LABELS[k]}</option>)}
      </select>
    </label>
  );
}

export function NatureTable({ natures }: { natures: Nature[] }) {
  const [up, setUp] = useState<StatKey | null>(null);
  const [down, setDown] = useState<StatKey | null>(null);
  const rows = filterNatures(natures, up, down);
  return (
    <div className="my-6">
      <div className="mb-3 flex flex-wrap gap-4">
        <StatSelect label="Raises" value={up} onChange={setUp} />
        <StatSelect label="Lowers" value={down} onChange={setDown} />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Nature</th>
            <th className="py-2">Increases (+10%)</th>
            <th className="py-2">Decreases (−10%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.name} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="py-2 font-medium">{n.name}</td>
              <td className="py-2 text-green-700 dark:text-green-400">{n.up ? STAT_LABELS[n.up] : "—"}</td>
              <td className="py-2 text-red-700 dark:text-red-400">{n.down ? STAT_LABELS[n.down] : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`src/app/natures/page.tsx`：

```tsx
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { NatureTable } from "@/components/NatureTable";
import { getNatures } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pokémon Nature Chart – All 25 Natures",
  description:
    "All 25 Pokémon natures with the stat each one raises and lowers. Filter by stat to find the right nature for Attack, Speed, Sp. Atk and more.",
  path: "/natures",
});

const FAQ = [
  {
    q: "How many natures are there?",
    a: "There are 25 natures. 20 of them raise one stat by 10% and lower another by 10%; the 5 neutral natures (Bashful, Docile, Hardy, Quirky and Serious) change nothing.",
  },
  {
    q: "Which nature is best?",
    a: "It depends on the Pokémon. Physical attackers usually want Adamant (+Attack, −Sp. Atk) or Jolly (+Speed, −Sp. Atk); special attackers usually want Modest (+Sp. Atk, −Attack) or Timid (+Speed, −Attack).",
  },
  {
    q: "Does nature affect HP?",
    a: "No. Natures only affect Attack, Defense, Sp. Atk, Sp. Def and Speed.",
  },
];

export default function NaturesPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Natures", path: "/natures" }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Nature Chart</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Every nature and the stat it raises and lowers. Use the filters to find natures for a specific stat.
      </p>
      <NatureTable natures={getNatures()} />
      <AdSlot id="natures-1" />
      <Faq items={FAQ} />
    </>
  );
}
```

- [ ] **Step 4: 运行测试确认通过，并构建**

Run: `npm test && npm run build`
Expected: 测试全过；`out/natures.html` 存在。

- [ ] **Step 5: Commit**

```bash
git add src tests/data/natures.test.ts
git commit -m "feat(natures): add filterable nature chart page"
```

---

### Task 13: 宝可梦弱点页

**Files:**
- Create: `src/lib/pokemon-page.ts`、`src/components/StatBars.tsx`、`src/app/pokemon/[slug]/page.tsx`
- Test: `tests/data/pokemon-page.test.ts`

**Interfaces:**
- Consumes: `Pokemon`、`defensiveMatchups`、`abilityChanges`、`recommendCounters`、`offenseVs`、`getAllPokemon`、`getPokemon`、`getAbilityModifiers`、`getAbilityName`、`getEvolutionStages`、`hasEvolution`、`sameTypeCombo`、`formatMultiplier`、`typeLabel`、`joinList`、`Qa`、`pageMetadata`、`STAT_LABELS`、组件 `Breadcrumbs`/`Faq`/`Sprite`/`TypeBadge`/`AdSlot`
- Produces: `weaknessSummary(p: Pick<Pokemon, "types">): { weak: string[]; resist: string[]; immune: string[] }`、`pokemonDescription(p: Pokemon): string`、`pokemonFaq(p: Pokemon, counters: Pokemon[]): Qa[]`；路由 `/pokemon/{slug}`

- [ ] **Step 1: 写失败的测试**

`tests/data/pokemon-page.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { recommendCounters } from "@/lib/counters";
import { getAllPokemon, getPokemon } from "@/lib/data";
import { pokemonDescription, pokemonFaq, weaknessSummary } from "@/lib/pokemon-page";

const charizard = getPokemon("charizard")!;

describe("weaknessSummary", () => {
  it("annotates 4× and ¼× and leaves 2× / ½× plain", () => {
    const s = weaknessSummary(charizard);
    expect(s.weak).toEqual(["Rock (4×)", "Water", "Electric"]);
    expect(s.resist).toContain("Grass (¼×)");
    expect(s.resist).toContain("Fire");
    expect(s.immune).toEqual(["Ground"]);
  });
});

describe("pokemonDescription", () => {
  it("summarises types and matchups", () => {
    const d = pokemonDescription(charizard);
    expect(d.startsWith("Charizard is a Fire/Flying-type Pokémon. It is weak to Rock (4×), Water and Electric")).toBe(true);
    expect(d).toContain("immune to Ground");
  });

  it("is unique for every page", () => {
    const all = getAllPokemon().map(pokemonDescription);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("pokemonFaq", () => {
  it("answers weakness, resistance and counter questions from data", () => {
    const faq = pokemonFaq(charizard, recommendCounters(charizard, getAllPokemon()));
    expect(faq.map((x) => x.q)).toEqual([
      "What is Charizard weak to?",
      "What is Charizard resistant to?",
      "What are the best counters to Charizard?",
    ]);
    expect(faq[0].a).toContain("Rock (4×)");
    expect(faq[1].a).toContain("immune to Ground");
  });

  it("skips the counters question when there are none", () => {
    expect(pokemonFaq(charizard, []).map((x) => x.q)).not.toContain("What are the best counters to Charizard?");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/data/pokemon-page.test.ts`
Expected: FAIL，无法解析 `@/lib/pokemon-page`

- [ ] **Step 3: 实现内容函数**

`src/lib/pokemon-page.ts`：

```ts
import { defensiveMatchups } from "./matchups";
import type { Pokemon } from "./model";
import type { Qa } from "./seo";
import { joinList } from "./text";
import { formatMultiplier, typeLabel, type MatchupGroup } from "./typechart";

const PLAIN = new Set([2, 0.5, 0]);

function labels(groups: MatchupGroup[], keep: (m: number) => boolean): string[] {
  return groups
    .filter((g) => keep(g.multiplier))
    .flatMap((g) => g.types.map((t) => (PLAIN.has(g.multiplier) ? typeLabel(t) : `${typeLabel(t)} (${formatMultiplier(g.multiplier)})`)));
}

export function weaknessSummary(p: Pick<Pokemon, "types">) {
  const groups = defensiveMatchups(p);
  return {
    weak: labels(groups, (m) => m > 1),
    resist: labels(groups, (m) => m > 0 && m < 1),
    immune: labels(groups, (m) => m === 0),
  };
}

const typeString = (p: Pick<Pokemon, "types">) => p.types.map(typeLabel).join("/");

export function pokemonDescription(p: Pokemon): string {
  const { weak, resist, immune } = weaknessSummary(p);
  let s = `${p.name} is a ${typeString(p)}-type Pokémon. It is weak to ${weak.length ? joinList(weak) : "nothing"}`;
  if (resist.length) s += `, resists ${joinList(resist)}`;
  if (immune.length) s += ` and is immune to ${joinList(immune)}`;
  return `${s}. See its best counters, base stats and evolutions.`;
}

export function pokemonFaq(p: Pokemon, counters: Pokemon[]): Qa[] {
  const { weak, resist, immune } = weaknessSummary(p);
  const faq: Qa[] = [
    {
      q: `What is ${p.name} weak to?`,
      a: weak.length
        ? `As a ${typeString(p)} type, ${p.name} takes super-effective damage from ${joinList(weak)} moves.`
        : `${p.name} has no type weaknesses.`,
    },
    {
      q: `What is ${p.name} resistant to?`,
      a:
        (resist.length ? `${p.name} resists ${joinList(resist)} moves.` : `${p.name} has no type resistances.`) +
        (immune.length ? ` It is immune to ${joinList(immune)}.` : ""),
    },
  ];
  if (counters.length) {
    faq.push({
      q: `What are the best counters to ${p.name}?`,
      a: `Strong type-based picks include ${joinList(counters.slice(0, 3).map((c) => c.name))}, which hit ${p.name} with super-effective attacks.`,
    });
  }
  return faq;
}
```

注意：FAQ 第二条拼出来是 `... It is immune to Ground.`，测试里 `toContain("immune to Ground")` 能匹配。

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/data/pokemon-page.test.ts`
Expected: PASS（5 tests）。如果「unique for every page」失败，打印重复项：两个条目名字和属性都一样说明 Task 3 的去重有漏洞，回 Task 3 加测试修复。

- [ ] **Step 5: 写组件与页面**

`src/components/StatBars.tsx`：

```tsx
import { STAT_KEYS, type Stats } from "@/lib/model";
import { STAT_LABELS } from "@/lib/natures";

export function StatBars({ stats }: { stats: Stats }) {
  const total = STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
  return (
    <dl className="mt-2 space-y-1 text-sm">
      {STAT_KEYS.map((k) => (
        <div key={k} className="grid grid-cols-[5rem_3rem_1fr] items-center gap-2">
          <dt>{STAT_LABELS[k]}</dt>
          <dd className="text-right tabular-nums">{stats[k]}</dd>
          <dd aria-hidden="true" className="h-2 rounded bg-zinc-200 dark:bg-zinc-800">
            <div className="h-2 rounded bg-emerald-500" style={{ width: `${Math.min(100, (stats[k] / 255) * 100)}%` }} />
          </dd>
        </div>
      ))}
      <div className="grid grid-cols-[5rem_3rem_1fr] gap-2 font-semibold">
        <dt>Total</dt>
        <dd className="text-right tabular-nums">{total}</dd>
      </div>
    </dl>
  );
}
```

`src/app/pokemon/[slug]/page.tsx`：

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Sprite } from "@/components/Sprite";
import { StatBars } from "@/components/StatBars";
import { TypeBadge } from "@/components/TypeBadge";
import { offenseVs, recommendCounters } from "@/lib/counters";
import {
  getAbilityModifiers,
  getAbilityName,
  getAllPokemon,
  getEvolutionStages,
  getPokemon,
  hasEvolution,
  sameTypeCombo,
} from "@/lib/data";
import { abilityChanges, defensiveMatchups } from "@/lib/matchups";
import { pokemonDescription, pokemonFaq } from "@/lib/pokemon-page";
import { pageMetadata } from "@/lib/seo";
import { formatMultiplier, typeLabel } from "@/lib/typechart";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPokemon().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPokemon(slug);
  if (!p) return {};
  return pageMetadata({
    title: `${p.name} Weakness & Counters – Type Matchups`,
    description: pokemonDescription(p),
    path: `/pokemon/${p.slug}`,
  });
}

const h2 = "text-xl font-semibold";

export default async function PokemonPage({ params }: Props) {
  const { slug } = await params;
  const p = getPokemon(slug);
  if (!p) notFound();

  const groups = defensiveMatchups(p);
  const changes = abilityChanges(p, getAbilityModifiers());
  const counters = recommendCounters(p, getAllPokemon());
  const stages = getEvolutionStages(p);
  const same = sameTypeCombo(p).slice(0, 12);

  return (
    <article>
      <Breadcrumbs items={[{ name: "Pokémon", path: "/pokemon" }, { name: p.name, path: `/pokemon/${p.slug}` }]} />
      <header className="flex items-center gap-4">
        <Sprite src={p.sprite} name={p.name} type={p.types[0]} eager />
        <div>
          <p className="text-sm text-zinc-500">#{String(p.dex).padStart(4, "0")}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{p.name} Weakness &amp; Counters</h1>
          <div className="mt-2 flex gap-1">{p.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
        </div>
      </header>

      <section className="mt-6">
        <h2 className={h2}>Type matchups</h2>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="w-20 py-2">Damage</th>
              <th className="py-2">Attacking types</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.multiplier} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2 font-semibold">{formatMultiplier(g.multiplier)}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1">{g.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {changes.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {changes.map(({ ability, changes: c }) => (
              <li key={ability.slug}>
                <strong>With {getAbilityName(ability.slug)}:</strong>{" "}
                {c.map((x) => `${typeLabel(x.type)} ${formatMultiplier(x.from)} → ${formatMultiplier(x.to)}`).join(", ")}
                {ability.note ? ` (${ability.note})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdSlot id="pokemon-1" />

      <section className="mt-8">
        <h2 className={h2}>Base stats</h2>
        <StatBars stats={p.stats} />
      </section>

      {hasEvolution(p) && (
        <section className="mt-8">
          <h2 className={h2}>Evolution</h2>
          <ol className="mt-2 flex flex-wrap items-center gap-3">
            {stages.map((stage, i) => (
              <li key={i} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true">→</span>}
                <div className="flex flex-col gap-1">
                  {stage.map((e) => (
                    <Link key={e.slug} href={`/pokemon/${e.slug}`} className="flex items-center gap-1 hover:underline">
                      <Sprite src={e.sprite} name={e.name} type={e.types[0]} size={48} />
                      <span className={e.slug === p.speciesSlug ? "font-semibold" : ""}>{e.name}</span>
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {counters.length > 0 && (
        <section className="mt-8">
          <h2 className={h2}>Best counters to {p.name}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {counters.map((c) => (
              <li key={c.slug}>
                <Link href={`/pokemon/${c.slug}`} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <Sprite src={c.sprite} name={c.name} type={c.types[0]} size={56} />
                  <span>
                    <span className="block font-medium">{c.name}</span>
                    <span className="text-xs text-zinc-500">Hits for {formatMultiplier(offenseVs(c, p))}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {same.length > 0 && (
        <section className="mt-8">
          <h2 className={h2}>Other {p.types.map(typeLabel).join("/")} Pokémon</h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {same.map((o) => (
              <li key={o.slug}>
                <Link href={`/pokemon/${o.slug}`} className="underline">{o.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Faq items={pokemonFaq(p, counters)} />
    </article>
  );
}
```

- [ ] **Step 6: 构建确认**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: 成功；`ls out/pokemon | wc -l` 约 1300；`out/pokemon/charizard.html`、`out/pokemon/charizard-mega-x.html`、`out/pokemon/tauros.html` 存在。打开 `out/pokemon/tauros.html` 确认没有「Evolution」标题。

- [ ] **Step 7: Commit**

```bash
git add src tests/data/pokemon-page.test.ts
git commit -m "feat(pokemon): add per-Pokémon weakness and counters pages"
```

---

### Task 14: 宝可梦列表页

**Files:**
- Create: `src/components/PokemonBrowser.tsx`、`src/app/pokemon/page.tsx`

**Interfaces:**
- Consumes: `getAllPokemon`、`toSummary`、`PokemonSummary`、`filterPokemon`、`TYPE_NAMES`、`typeLabel`、`Sprite`、`TypeBadge`、`Breadcrumbs`、`pageMetadata`
- Produces: 路由 `/pokemon`；DOM 约定（Task 17 E2E）：搜索框 `aria-label="Search Pokémon"`

列表的过滤逻辑已在 Task 9 的 `filterPokemon` 测过；本任务只做界面，用构建和 Task 17 的 E2E 验证。

- [ ] **Step 1: 写组件与页面**

`src/components/PokemonBrowser.tsx`：

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PokemonSummary } from "@/lib/data";
import { TYPE_NAMES, type TypeName } from "@/lib/model";
import { filterPokemon } from "@/lib/search";
import { typeLabel } from "@/lib/typechart";
import { Sprite } from "./Sprite";
import { TypeBadge } from "./TypeBadge";

const PAGE = 60;
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const field = "rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";

export function PokemonBrowser({ all }: { all: PokemonSummary[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<TypeName | null>(null);
  const [gen, setGen] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const results = useMemo(() => filterPokemon(all, { q, type, gen }), [all, q, type, gen]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLimit((l) => l + PAGE);
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          aria-label="Search Pokémon"
          placeholder="Search by name or number"
          value={q}
          onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
          className={`${field} min-w-56 flex-1`}
        />
        <select aria-label="Filter by type" value={type ?? ""} onChange={(e) => { setType((e.target.value || null) as TypeName | null); setLimit(PAGE); }} className={field}>
          <option value="">All types</option>
          {TYPE_NAMES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
        <select aria-label="Filter by generation" value={gen ?? ""} onChange={(e) => { setGen(e.target.value ? Number(e.target.value) : null); setLimit(PAGE); }} className={field}>
          <option value="">All generations</option>
          {GENERATIONS.map((g) => <option key={g} value={g}>Gen {g}</option>)}
        </select>
      </div>
      <p className="mb-2 text-sm text-zinc-500">{results.length} Pokémon</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {results.slice(0, limit).map((p) => (
          <li key={p.slug}>
            <Link href={`/pokemon/${p.slug}`} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <Sprite src={p.sprite} name={p.name} type={p.types[0]} size={56} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="text-xs text-zinc-500">#{p.dex}</span>
                <span className="mt-1 flex gap-1">{p.types.map((t) => <TypeBadge key={t} type={t} link={false} />)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div ref={sentinel} aria-hidden="true" className={limit < results.length ? "h-10" : "h-0"} />
    </div>
  );
}
```

`src/app/pokemon/page.tsx`：

```tsx
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PokemonBrowser } from "@/components/PokemonBrowser";
import { getAllPokemon, toSummary } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pokémon Weakness List – Every Pokémon's Type Matchups",
  description:
    "Search every Pokémon, including Mega Evolutions and regional forms, and open its weaknesses, resistances, immunities and best counters.",
  path: "/pokemon",
});

export default function PokemonIndex() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Pokémon", path: "/pokemon" }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Weakness List</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Find any Pokémon to see what it is weak to, what it resists and which Pokémon counter it.
      </p>
      <PokemonBrowser all={getAllPokemon().map(toSummary)} />
    </>
  );
}
```

- [ ] **Step 2: 构建确认**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: 成功。`grep -o 'href="/pokemon/[^"]*"' out/pokemon.html | wc -l` 约为 60（首屏只渲染 60 张卡片）。

- [ ] **Step 3: Commit**

```bash
git add src
git commit -m "feat(pokemon): add searchable Pokémon list with incremental loading"
```

---

### Task 15: 属性页

**Files:**
- Create: `src/lib/type-page.ts`、`src/app/types/[type]/page.tsx`
- Test: `tests/unit/type-page.test.ts`

**Interfaces:**
- Consumes: `TYPE_NAMES`、`isTypeName`、`TypeName`、`defenseProfile`、`offenseProfile`、`groupByMultiplier`、`formatMultiplier`、`typeLabel`、`joinList`、`Qa`、`pokemonOfType`、`pageMetadata`、组件
- Produces: `typeMatchupLists(t: TypeName): { weakTo: string[]; resists: string[]; immuneTo: string[]; strongAgainst: string[]; weakAgainst: string[]; noEffectOn: string[] }`、`typeDescription(t: TypeName): string`、`typeFaq(t: TypeName): Qa[]`；路由 `/types/{type}`

- [ ] **Step 1: 写失败的测试**

`tests/unit/type-page.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { typeDescription, typeFaq, typeMatchupLists } from "@/lib/type-page";

describe("typeMatchupLists", () => {
  it("lists Fire matchups in chart order", () => {
    const l = typeMatchupLists("fire");
    expect(l.weakTo).toEqual(["Ground", "Rock", "Water"]);
    expect(l.strongAgainst).toEqual(["Bug", "Steel", "Grass", "Ice"]);
    expect(l.immuneTo).toEqual([]);
  });

  it("captures immunities", () => {
    expect(typeMatchupLists("ghost").immuneTo).toEqual(["Normal", "Fighting"]);
    expect(typeMatchupLists("normal").noEffectOn).toEqual(["Ghost"]);
  });
});

describe("typeDescription / typeFaq", () => {
  it("describes the type from data", () => {
    expect(typeDescription("fire")).toContain("weak to Ground, Rock and Water");
    expect(typeFaq("fire").map((x) => x.q)).toEqual(["What is Fire weak to?", "What is Fire strong against?"]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/type-page.test.ts`
Expected: FAIL，无法解析 `@/lib/type-page`

- [ ] **Step 3: 实现**

`src/lib/type-page.ts`：

```ts
import { TYPE_NAMES, type TypeName } from "./model";
import type { Qa } from "./seo";
import { joinList } from "./text";
import { defenseProfile, offenseProfile, typeLabel, type Profile } from "./typechart";

const pick = (profile: Profile, keep: (m: number) => boolean) =>
  TYPE_NAMES.filter((t) => keep(profile[t])).map(typeLabel);

export function typeMatchupLists(t: TypeName) {
  const def = defenseProfile([t]);
  const off = offenseProfile(t);
  return {
    weakTo: pick(def, (m) => m > 1),
    resists: pick(def, (m) => m > 0 && m < 1),
    immuneTo: pick(def, (m) => m === 0),
    strongAgainst: pick(off, (m) => m > 1),
    weakAgainst: pick(off, (m) => m > 0 && m < 1),
    noEffectOn: pick(off, (m) => m === 0),
  };
}

export function typeDescription(t: TypeName): string {
  const l = typeMatchupLists(t);
  const name = typeLabel(t);
  let s = `${name} type is weak to ${joinList(l.weakTo)}`;
  if (l.resists.length) s += ` and resists ${joinList(l.resists)}`;
  s += `. ${name} moves are super effective against ${l.strongAgainst.length ? joinList(l.strongAgainst) : "no types"}.`;
  return `${s} See every ${name}-type Pokémon and its matchups.`;
}

export function typeFaq(t: TypeName): Qa[] {
  const l = typeMatchupLists(t);
  const name = typeLabel(t);
  return [
    {
      q: `What is ${name} weak to?`,
      a: `${name}-type Pokémon take super-effective damage from ${joinList(l.weakTo)} moves.${l.immuneTo.length ? ` They are immune to ${joinList(l.immuneTo)}.` : ""}`,
    },
    {
      q: `What is ${name} strong against?`,
      a: l.strongAgainst.length
        ? `${name} moves are super effective against ${joinList(l.strongAgainst)} Pokémon.`
        : `${name} moves are not super effective against any type.`,
    },
  ];
}
```

`src/app/types/[type]/page.tsx`：

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Sprite } from "@/components/Sprite";
import { TypeBadge } from "@/components/TypeBadge";
import { pokemonOfType } from "@/lib/data";
import { isTypeName, TYPE_NAMES } from "@/lib/model";
import { pageMetadata } from "@/lib/seo";
import { typeDescription, typeFaq } from "@/lib/type-page";
import { defenseProfile, formatMultiplier, groupByMultiplier, offenseProfile, typeLabel } from "@/lib/typechart";

type Props = { params: Promise<{ type: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TYPE_NAMES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!isTypeName(type)) return {};
  return pageMetadata({
    title: `${typeLabel(type)} Type Weakness & Strengths`,
    description: typeDescription(type),
    path: `/types/${type}`,
  });
}

function Groups({ title, groups }: { title: string; groups: ReturnType<typeof groupByMultiplier> }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <dl className="mt-2 space-y-2">
        {groups.map((g) => (
          <div key={g.multiplier} className="flex flex-wrap items-center gap-2">
            <dt className="w-12 font-semibold">{formatMultiplier(g.multiplier)}</dt>
            <dd className="flex flex-wrap gap-1">{g.types.map((t) => <TypeBadge key={t} type={t} />)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function TypePage({ params }: Props) {
  const { type } = await params;
  if (!isTypeName(type)) notFound();
  const label = typeLabel(type);
  const members = pokemonOfType(type);
  return (
    <>
      <Breadcrumbs items={[{ name: `${label} type`, path: `/types/${type}` }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">{label} Type Weakness &amp; Strengths</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{typeDescription(type)}</p>
      <Groups title={`Defending: damage ${label} Pokémon take`} groups={groupByMultiplier(defenseProfile([type]))} />
      <Groups title={`Attacking: damage ${label} moves deal`} groups={groupByMultiplier(offenseProfile(type))} />
      <AdSlot id="type-1" />
      <section className="mt-8">
        <h2 className="text-xl font-semibold">All {label}-type Pokémon ({members.length})</h2>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {members.map((p) => (
            <li key={p.slug}>
              <Link href={`/pokemon/${p.slug}`} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                <Sprite src={p.sprite} name={p.name} type={p.types[0]} size={48} />
                <span className="truncate">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Faq items={typeFaq(type)} />
    </>
  );
}
```

- [ ] **Step 4: 运行测试确认通过，并构建**

Run: `npm test && npm run build`
Expected: 测试全过；`ls out/types | wc -l` = 18。

- [ ] **Step 5: Commit**

```bash
git add src tests/unit/type-page.test.ts
git commit -m "feat(types): add per-type weakness and strengths pages"
```

---

### Task 16: Winds & Waves 专题页

**Files:**
- Create: `data/winds-waves.json`、`src/lib/winds-waves.ts`、`src/app/winds-waves/page.tsx`
- Test: `tests/data/winds-waves.test.ts`

**Interfaces:**
- Consumes: `isTypeName`、`TypeName`、`defensiveMatchups`、`formatMultiplier`、`pageMetadata`、组件
- Produces: `type WwFact = { text: string; source: string; date: string }`、`type WwStarter = { name: string; type: TypeName }`、`type WindsWaves = { updated: string; release: string; facts: WwFact[]; starters: WwStarter[] }`、`validateWindsWaves(d: unknown): string[]`、`getWindsWaves(): WindsWaves`；路由 `/winds-waves`

- [ ] **Step 1: 核实官方信息**

用浏览器或 `curl -sL https://windswaves.pokemon.com/en-us/` 打开官方站，逐条核对下面三条事实。**只保留官方站（windswaves.pokemon.com、pokemon.com、nintendo.com）上能找到原文的事实**，`source` 填找到原文的那一页，`date` 填官方发布日期。哪一条核实不了就删掉；发售时间官方没写具体日期时 `release` 写 `"2027"`，官方连年份都没写就写 `"TBA"`。不确定时问用户，不要凭新闻稿或泄露补。

- [ ] **Step 2: 写数据文件**

`data/winds-waves.json`（`source` 和 `date` 按 Step 1 实际核实结果改）：

```json
{
  "updated": "2026-10-15",
  "release": "2027",
  "starters": [
    { "name": "Browt", "type": "grass" },
    { "name": "Pombon", "type": "fire" },
    { "name": "Gecqua", "type": "water" }
  ],
  "facts": [
    {
      "text": "Pokémon Winds and Pokémon Waves were announced on Pokémon Day, February 27, 2026.",
      "source": "https://windswaves.pokemon.com/en-us/",
      "date": "2026-02-27"
    },
    {
      "text": "The three starter Pokémon are Browt (Grass type), Pombon (Fire type) and Gecqua (Water type).",
      "source": "https://windswaves.pokemon.com/en-us/",
      "date": "2026-02-27"
    },
    {
      "text": "The games are scheduled for release in 2027 on Nintendo Switch 2.",
      "source": "https://windswaves.pokemon.com/en-us/",
      "date": "2026-02-27"
    }
  ]
}
```

- [ ] **Step 3: 写失败的测试**

`tests/data/winds-waves.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import raw from "../../data/winds-waves.json";
import { getWindsWaves, validateWindsWaves } from "@/lib/winds-waves";

describe("winds-waves data", () => {
  it("is valid", () => {
    expect(validateWindsWaves(raw)).toEqual([]);
  });

  it("rejects unsourced facts, bad dates and invalid types", () => {
    const errors = validateWindsWaves({
      updated: "yesterday",
      release: "",
      starters: [{ name: "X", type: "banana" }],
      facts: [{ text: "t", source: "http://leaks.example", date: "Feb 2026" }],
    });
    expect(errors).toEqual(expect.arrayContaining([
      "updated: not an ISO date",
      "release: empty",
      "starter X: invalid type banana",
      "fact 0: source must be an https URL on an official domain",
      "fact 0: date must be YYYY-MM-DD",
    ]));
  });

  it("exposes typed data", () => {
    expect(getWindsWaves().starters.map((s) => s.type)).toEqual(["grass", "fire", "water"]);
  });
});
```

- [ ] **Step 4: 运行测试确认失败**

Run: `npx vitest run tests/data/winds-waves.test.ts`
Expected: FAIL，无法解析 `@/lib/winds-waves`

- [ ] **Step 5: 实现**

`src/lib/winds-waves.ts`：

```ts
import raw from "../../data/winds-waves.json";
import { isTypeName, type TypeName } from "./model";

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
```

`src/app/winds-waves/page.tsx`：

```tsx
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { Sprite } from "@/components/Sprite";
import { TypeBadge } from "@/components/TypeBadge";
import { defensiveMatchups } from "@/lib/matchups";
import { pageMetadata } from "@/lib/seo";
import { joinList } from "@/lib/text";
import { typeLabel } from "@/lib/typechart";
import { getWindsWaves } from "@/lib/winds-waves";

const ww = getWindsWaves();
const starterNames = joinList(ww.starters.map((s) => s.name));

export const metadata = pageMetadata({
  title: "Pokémon Winds and Waves Starters, Release Date & Confirmed Info",
  description: `The Pokémon Winds and Waves starters are ${starterNames}. See their types and weaknesses, the release window and every officially confirmed detail with sources.`,
  path: "/winds-waves",
});

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function WindsWavesPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Winds & Waves", path: "/winds-waves" }]} />
      <h1 className="text-2xl font-bold sm:text-3xl">Pokémon Winds and Waves: Starters &amp; Confirmed Info</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated {formatDate(ww.updated)}. Official information only — no leaks.</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">The three starters</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {ww.starters.map((s) => {
            const weak = defensiveMatchups({ types: [s.type] }).filter((g) => g.multiplier > 1).flatMap((g) => g.types);
            return (
              <li key={s.name} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Sprite src={null} name={s.name} type={s.type} size={56} />
                  <div>
                    <p className="text-lg font-semibold">{s.name}</p>
                    <TypeBadge type={s.type} />
                  </div>
                </div>
                <p className="mt-3 text-sm">
                  Weak to: <span className="inline-flex flex-wrap gap-1 align-middle">{weak.map((t) => <TypeBadge key={t} type={t} />)}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <AdSlot id="ww-1" />

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Confirmed so far</h2>
        <p className="mt-1 text-sm">Release: {ww.release}</p>
        <ul className="mt-3 space-y-3">
          {ww.facts.map((f) => (
            <li key={f.text}>
              <p>{f.text}</p>
              <p className="text-xs text-zinc-500">
                Source: <a href={f.source} rel="noopener" className="underline">{new URL(f.source).hostname}</a>, {formatDate(f.date)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Faq
        items={[
          {
            q: "Who are the Pokémon Winds and Waves starters?",
            a: `The starters are ${joinList(ww.starters.map((s) => `${s.name} (${typeLabel(s.type)})`))}.`,
          },
          { q: "When does Pokémon Winds and Waves come out?", a: `The official release window is ${ww.release}.` },
        ]}
      />
    </>
  );
}
```

- [ ] **Step 6: 运行测试确认通过，并构建**

Run: `npm test && npm run build`
Expected: 测试全过；`out/winds-waves.html` 存在。

- [ ] **Step 7: Commit**

```bash
git add data/winds-waves.json src tests/data/winds-waves.test.ts
git commit -m "feat(ww): add Winds & Waves page with sourced official facts"
```

---

### Task 17: sitemap / robots、构建产物测试与 E2E

**Files:**
- Create: `src/app/sitemap.ts`、`src/app/robots.ts`、`tests/build/pages.test.ts`、`playwright.config.ts`、`tests/e2e/calculator.spec.ts`、`tests/e2e/browse.spec.ts`

**Interfaces:**
- Consumes: `getAllPokemon`、`TYPE_NAMES`、`absoluteUrl`；Task 11 / 14 的 DOM 约定
- Produces: `out/sitemap.xml`、`out/robots.txt`；`npm run test:build`、`npm run e2e`

- [ ] **Step 1: 写失败的构建产物测试**

`tests/build/pages.test.ts`：

```ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

const OUT = path.resolve(__dirname, "../../out");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name.startsWith("_") ? [] : htmlFiles(full);
    return name.endsWith(".html") && !name.startsWith("_") && name !== "404.html" ? [full] : [];
  });
}

const pages = htmlFiles(OUT).map((f) => {
  const html = readFileSync(f, "utf8");
  const root = parse(html);
  return {
    file: path.relative(OUT, f),
    html,
    title: root.querySelector("title")?.text.trim() ?? "",
    h1: root.querySelectorAll("h1").length,
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    jsonLd: root.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.text)),
  };
});
const find = (file: string) => pages.find((p) => p.file === file)!;

describe("built site", () => {
  it("has about 1300 Pokémon pages and 18 type pages", () => {
    const pokemon = pages.filter((p) => p.file.startsWith("pokemon/")).length;
    expect(pokemon).toBeGreaterThan(1100);
    expect(pokemon).toBeLessThan(1500);
    expect(pages.filter((p) => p.file.startsWith("types/"))).toHaveLength(18);
  });

  it("every page has a title, one h1, a slash-free canonical and breadcrumb JSON-LD", () => {
    for (const p of pages) {
      expect(p.title, p.file).not.toBe("");
      expect(p.h1, p.file).toBe(1);
      expect(p.canonical, p.file).toMatch(/^https:\/\/monpedia\.net(\/[^?#]*[^/])?$/);
      expect(p.jsonLd.some((j) => j["@type"] === "BreadcrumbList"), p.file).toBe(true);
    }
  });

  it("titles are unique", () => {
    const titles = pages.map((p) => p.title);
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });

  it("uses the spec title templates", () => {
    expect(find("index.html").title).toBe("Pokémon Type Chart & Weakness Calculator | Monpedia");
    expect(find("pokemon/charizard.html").title).toBe("Charizard Weakness & Counters – Type Matchups | Monpedia");
    expect(find("types/fire.html").title).toBe("Fire Type Weakness & Strengths | Monpedia");
    expect(find("natures.html").title).toBe("Pokémon Nature Chart – All 25 Natures | Monpedia");
  });

  it("canonicalises the home page to the bare domain", () => {
    expect(find("index.html").canonical).toBe("https://monpedia.net");
  });

  it("emits FAQPage JSON-LD on Pokémon pages", () => {
    expect(find("pokemon/charizard.html").jsonLd.some((j) => j["@type"] === "FAQPage")).toBe(true);
  });

  it("lists every page in the sitemap and links it from robots.txt", () => {
    const xml = readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
    expect((xml.match(/<loc>/g) ?? []).length).toBe(pages.length);
    expect(readFileSync(path.join(OUT, "robots.txt"), "utf8")).toContain("Sitemap: https://monpedia.net/sitemap.xml");
  });

  it("never references raw.githubusercontent.com", () => {
    expect(pages.filter((p) => p.html.includes("raw.githubusercontent.com")).map((p) => p.file)).toEqual([]);
  });

  it("has a 404 page", () => {
    expect(existsSync(path.join(OUT, "404.html"))).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm run build && npm run test:build`
Expected: FAIL，`ENOENT ... sitemap.xml`

- [ ] **Step 3: 实现 sitemap 与 robots**

`src/app/sitemap.ts`：

```ts
import type { MetadataRoute } from "next";
import { getAllPokemon } from "@/lib/data";
import { TYPE_NAMES } from "@/lib/model";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/", "/natures", "/pokemon", "/winds-waves", "/about", "/privacy", "/terms",
    ...TYPE_NAMES.map((t) => `/types/${t}`),
    ...getAllPokemon().map((p) => `/pokemon/${p.slug}`),
  ];
  return paths.map((p) => ({ url: absoluteUrl(p) }));
}
```

`src/app/robots.ts`：

```ts
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: absoluteUrl("/sitemap.xml") };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npm run build && npm run test:build`
Expected: PASS（9 tests）。如果「titles are unique」失败：看重复的 title，多半是两个形态同名，回 Task 3 的去重 / 改名规则修，并补测试。

- [ ] **Step 5: 写 E2E**

`playwright.config.ts`：

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3100" },
  webServer: { command: "npx serve out -l 3100", url: "http://localhost:3100", reuseExistingServer: true },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
});
```

`tests/e2e/calculator.spec.ts`：

```ts
import { expect, test } from "@playwright/test";

test("defense calculator groups matchups and updates the URL", async ({ page }) => {
  await page.goto("/");
  const calc = page.getByRole("region", { name: "Type calculator" });
  await expect(calc.getByRole("button", { name: "Fire", exact: true })).toHaveAttribute("aria-pressed", "true");

  await calc.getByRole("button", { name: "Flying", exact: true }).click();
  const results = calc.getByTestId("calc-results");
  await expect(results.locator('[data-multiplier="4"]')).toContainText("Rock");
  await expect(results.locator('[data-multiplier="0"]')).toContainText("Ground");
  await expect(page).toHaveURL(/\/\?t=fire,flying$/);
});

test("garbage query parameters are cleaned up", async ({ page }) => {
  await page.goto("/?t=WATER,banana,water,grass,ice");
  const calc = page.getByRole("region", { name: "Type calculator" });
  const pressed = calc.locator('button[aria-pressed="true"]');
  await expect(pressed).toHaveCount(2);
  await expect(pressed.nth(0)).toHaveText("Water");
  await expect(pressed.nth(1)).toHaveText("Grass");
});

test("attack mode keeps a single type", async ({ page }) => {
  await page.goto("/");
  const calc = page.getByRole("region", { name: "Type calculator" });
  await calc.getByRole("tab", { name: "Attacking" }).click();
  await calc.getByRole("button", { name: "Ground", exact: true }).click();
  await expect(calc.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(calc.getByTestId("calc-results").locator('[data-multiplier="0"]')).toContainText("Flying");
  await expect(page).toHaveURL(/\?m=attack&t=ground$/);
});
```

`tests/e2e/browse.spec.ts`：

```ts
import { expect, test } from "@playwright/test";

test("search finds Pokémon by accent-free name", async ({ page }) => {
  await page.goto("/pokemon");
  await page.getByLabel("Search Pokémon").fill("flabebe");
  await expect(page.getByRole("link", { name: /Flabébé/ })).toBeVisible();
});

test("a Pokémon page shows its weaknesses and links to counters", async ({ page }) => {
  await page.goto("/pokemon/charizard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Charizard Weakness & Counters");
  await expect(page.getByRole("heading", { name: "Best counters to Charizard" })).toBeVisible();
});

test("unknown pages show the 404 with a way back", async ({ page }) => {
  await page.goto("/pokemon/not-a-real-mon");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search all Pokémon" })).toBeVisible();
});
```

- [ ] **Step 6: 运行 E2E**

Run: `npm run build && npm run e2e`
Expected: 6 passed。

- [ ] **Step 7: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts tests/build tests/e2e playwright.config.ts
git commit -m "test: add sitemap/robots, built-page checks and E2E"
```

---

### Task 18: 部署与上线验收

**Files:**
- 无代码改动（除非 Lighthouse 不达标需要修）

**Interfaces:**
- Consumes: 完整的 `out/` 构建产物
- Produces: 线上 https://monpedia.net

以下有几步需要用户本人操作（登录、DNS、GSC），遇到时停下来请用户执行，用户可以在提示符里输入 `! <命令>` 直接运行。

- [ ] **Step 1: 全量检查**

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:build && npm run e2e
```

Expected: 全部通过。

- [ ] **Step 2: 创建 Cloudflare Pages 项目并首次部署**

请用户运行 `! npx wrangler login`，然后：

```bash
npx wrangler pages project create monpedia --production-branch main
npx wrangler pages deploy out --project-name monpedia --branch main
```

Expected: 输出 `*.monpedia.pages.dev` 地址；用 `curl -sI https://monpedia.pages.dev/pokemon/charizard` 确认返回 200。

- [ ] **Step 3: 绑定域名、邮箱与统计（用户在 Cloudflare 控制台操作）**

请用户完成：
1. Pages 项目 → Custom domains → 添加 `monpedia.net`（域名需已接入 Cloudflare DNS）。
2. Email Routing：把 `contact@monpedia.net` 转发到用户自己的邮箱（法务页里写了这个地址）。
3. Web Analytics：给 monpedia.net 创建站点，复制 token。

拿到 token 后重新构建部署：

```bash
NEXT_PUBLIC_CF_BEACON_TOKEN=<token> npm run build
npx wrangler pages deploy out --project-name monpedia --branch main
```

Expected: `curl -s https://monpedia.net | grep -c cloudflareinsights` ≥ 1；`curl -sI https://monpedia.net/pokemon/charizard/` 会跳转到不带斜杠的地址，或返回同一页面且 canonical 不带斜杠。

- [ ] **Step 4: Lighthouse 验收（手机端）**

```bash
for u in https://monpedia.net/ https://monpedia.net/pokemon/charizard https://monpedia.net/pokemon; do
  npx lighthouse "$u" --form-factor=mobile --only-categories=performance,seo --output=json --output-path=stdout --quiet --chrome-flags="--headless" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);console.log(r.finalDisplayedUrl, "perf", r.categories.performance.score*100, "seo", r.categories.seo.score*100)})'
done
```

Expected: 每个 URL 性能 ≥ 90、SEO = 100。不达标时看报告里扣分最多的项，修复后从 Step 1 重新跑，再部署。

- [ ] **Step 5: 提交 GSC（用户操作）**

请用户在 Google Search Console 添加 `monpedia.net`（DNS 验证），提交 `https://monpedia.net/sitemap.xml`。

- [ ] **Step 6: 记录上线**

```bash
git tag phase1-launch
git log --oneline | head -1
```

报告给用户：线上地址、Lighthouse 三个页面的分数、sitemap 里的 URL 数量，并提醒上线 2~4 周后在 GSC 看「已抓取但未编入索引」的比例（spec 第 7 节）。
