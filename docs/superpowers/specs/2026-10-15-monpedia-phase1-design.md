# Monpedia 子项目 1 设计：站点骨架 + 数据层 + 属性计算器 + 性格表 + 宝可梦弱点页

日期：2026-10-15 · 依据：`docs/research/2026-10-15-direction.md`

## 1. 目标与边界

**目标**：在 monpedia.net 上线一个英文宝可梦工具站的第一阶段，靠常青工具词养站，为 2027 年 Pokémon Winds & Waves 发售做准备。

**目标关键词（美国口径，规划师月均 / 哥飞版 KD）**

| 页面 | 关键词 | 月均 | KD |
|---|---|---|---|
| `/` | pokemon type chart | 20.1 万 | 44.8 |
| `/` | pokemon weakness chart | 6.05 万 | 26.6 |
| `/natures` | pokemon nature chart | 4.05 万 | 31.1 |
| `/pokemon/{slug}` | {name} weakness（长尾） | — | — |
| `/winds-waves` | pokemon winds and waves starters | 3.31 万 | 未精评 |

**约束**
- 品牌与版权：站名、域名、Logo 不含 Pokémon；不使用官方美术 / 立绘；精灵图仅用 PokeAPI 小像素 sprite 热链；不发布泄露内容；页脚与 `/about` 声明非官方粉丝站。
- 仅英文，URL 无语言前缀；将来新增语言用 `/es/`、`/pt/` 子目录，英文根路径不变。
- 属性克制按第 6 代及以后的现行规则（含妖精），不做历代切换。
- 无登录、无数据库、无运行时 API。

**本期不做**：配队器、伤害计算器、多语言、Adsense 实际接入、Winds & Waves 泄露内容。

## 2. 技术方案

- Next.js（App Router），`output: "export"` 全静态导出，部署 Cloudflare Pages。
- TypeScript、Tailwind CSS，不引组件库。
- 数据来源：PokeAPI 仓库的原始 CSV（`data/v2/csv`），由脚本一次性转换为精简 JSON 并提交到仓库；构建时只读本地 JSON。

### 2.1 目录结构

```
scripts/build-data.ts   # 下载 PokeAPI CSV → 校验 → 写 data/*.json
data/
  types.json            # 18 属性 + 18×18 倍率矩阵
  pokemon.json          # 物种 + 出页形态，约 1300 条
  natures.json          # 25 种性格
  abilities.json        # 手写：影响属性克制的特性表
src/lib/
  data.ts               # 读 JSON 的唯一入口，导出带类型的访问函数
  typechart.ts          # effectiveness(attackType, defenderTypes) → 0|0.25|0.5|1|2|4
  matchups.ts           # defensiveMatchups(pokemon) → 按倍率分组，含特性修正
  counters.ts           # recommendCounters(pokemon, n=6)
src/app/                # 路由（见第 3 节）
src/components/
tests/
```

`src/lib/` 内均为纯函数，不依赖 React，可独立测试。

### 2.2 数据模型

```ts
type TypeName = "normal" | "fire" | ... ;          // 18 种

type Pokemon = {
  slug: string;              // "charizard-mega-x"，全局唯一
  name: string;              // "Mega Charizard X"
  speciesSlug: string;       // "charizard"
  dex: number;               // 6
  generation: number;        // 1..9
  form: string | null;       // "mega-x"，基础形态为 null
  types: [TypeName] | [TypeName, TypeName];
  abilities: string[];       // 特性 slug
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  evolution: string[];       // 进化线上各物种 slug，按顺序
  sprite: string;            // PokeAPI sprites 的 raw.githubusercontent.com URL
};

type Nature = { name: string; up: StatKey | null; down: StatKey | null };

type AbilityModifier = {
  slug: string; name: string;
  // 对特定攻击属性的倍率覆盖，如 levitate: { ground: 0 }
  multipliers?: Partial<Record<TypeName, number>>;
  wonderGuard?: true;        // 仅效果绝佳的攻击能命中
};
```

**出页规则**：一个形态只有在 `types` 或 `abilities` 与基础形态不同时才作为独立条目（独立页面）；纯外观变体合并入基础形态。规则写在 `build-data`，输出确定。

**特性**：只收录影响属性克制的十几个特性（Levitate、Flash Fire、Water Absorb、Volt Absorb、Lightning Rod、Storm Drain、Motor Drive、Sap Sipper、Dry Skin、Thick Fat、Heatproof、Fluffy、Purifying Salt、Earth Eater、Well-Baked Body、Wonder Guard 等），手写在 `abilities.json`，不解析描述文字。弱点页按「默认（不计特性）」显示主表，另起一行列出某特性会改变的倍率。

### 2.3 数据流

1. 新数据出现时手动跑 `npm run build:data` → 下载 CSV → 转换 → 校验 → 写 `data/*.json` → 人工 review diff 后提交。
2. `next build` 时 `generateStaticParams` 经 `data.ts` 读 JSON，生成全部静态页。
3. 部署到 Cloudflare Pages。运行时唯一的外部请求是精灵图热链。

## 3. 页面

| URL | 目标词 | 第一屏 | 第一屏下面 |
|---|---|---|---|
| `/` | type chart / weakness chart | 属性计算器：选 1~2 个防御属性 → 4× / 2× / ½× / ¼× / 0× 分组；可切换「攻击方向」看它克制谁 | 18×18 完整克制表（可点击高亮行列，手机横向滚动）、属性说明、FAQ |
| `/natures` | nature chart | 25 种性格表，按升 / 降能力筛选 | 性格选择说明、FAQ |
| `/pokemon` | pokemon weakness list | 搜索框 + 全部列表，按属性、世代筛选 | — |
| `/pokemon/{slug}` | {name} weakness | sprite、属性标签、弱点 / 抵抗 / 免疫倍率表，特性修正单独标注 | 种族值条形图、进化线（链接）、推荐对策 6 只、同属性组合的宝可梦、FAQ |
| `/types/{type}` | {type} type weakness | 该属性的攻防克制关系 | 该属性的宝可梦列表（链接） |
| `/winds-waves` | winds and waves starters | 三只初始精灵卡片（属性、弱点） | 官方已确认信息，每条带出处与日期；发售日未定档时只写「2027」 |
| `/about` `/privacy` `/terms` | — | 非官方粉丝站声明、隐私、条款（Adsense 前置条件） | — |

**推荐对策算法**（`counters.ts`）：候选为至少有一个属性能对目标打出 ≥2× 的宝可梦，且自身对目标的属性抵抗或免疫越多越好；按「进攻倍率 → 承受倍率 → 种族值总和」排序取前 6；排除与目标同一物种的条目；候选中排除 Mega 形态，避免列表被 Mega 占满。

### 3.1 SEO

- **标题模板**：
  - 首页：`Pokémon Type Chart & Weakness Calculator | Monpedia`
  - 宝可梦页：`{Name} Weakness & Counters – Type Matchups | Monpedia`
  - 属性页：`{Type} Type Weakness & Strengths | Monpedia`
  - 性格页：`Pokémon Nature Chart – All 25 Natures | Monpedia`
- 每页一个 H1，等于目标词；meta description 由数据拼出，保证每页唯一。
- JSON-LD：所有页面 `BreadcrumbList`；有 FAQ 的页面 `FAQPage`，问答由数据生成（例：「What is Charizard weak to?」→ 真实倍率）。
- 内链：宝可梦页 ↔ 属性页 ↔ 首页；进化线、对策、同属性组合互链。
- 自动生成 `sitemap.xml`、`robots.txt`；每页声明 canonical。
- 首页计算器状态写入网址参数 `?t=fire,flying` 便于分享，canonical 固定为 `/`。

### 3.2 交互与广告位

- 仅首页计算器、性格表筛选、宝可梦列表搜索为客户端组件；其余内容服务端生成 HTML。
- 预留固定尺寸的广告位（不在工具区域内），防止布局跳动；本期不接 Adsense。

## 4. 界面

- 手机优先；Tailwind；支持深色模式。
- 18 种属性用色块 + 文字标签，配色沿用游戏惯例，图标自绘，不用官方素材。

## 5. 错误处理

- **数据校验**（`build-data` 写文件前，任一失败即报错退出、不写文件）：
  - 每只宝可梦 1~2 个属性，且都属于 18 种之一
  - 克制矩阵完整 18×18，值只能是 0 / 0.5 / 1 / 2
  - slug 全局唯一
  - 进化线与特性引用的 slug 都存在
- **构建**：`data.ts` 带类型；不存在的 slug 返回 404 页面，页面上放搜索框和热门宝可梦链接。
- **图片**：sprite 加载失败时退回属性色块 + 名字首字母；所有图片声明宽高。
- 运行时无接口请求，无网络错误路径。

## 6. 测试

- **单元测试（Vitest）**：`typechart` / `matchups` / `counters` 用已知案例：
  - 喷火龙（火 / 飞行）：岩石 4×，电、水 2×，地面 0×
  - 耿鬼带 Levitate：地面 0×
  - 快拳郎（Shedinja，Wonder Guard）：仅效果绝佳的攻击可命中
  - 冰 / 飞行组合：岩石 4×
- **数据测试**：JSON 结构符合类型定义；物种数等于 PokeAPI 当前物种数（撰写时为 1025），出页形态数在预期区间。
- **页面测试**：构建后抽查页面，确认 title、H1、canonical、JSON-LD 存在；全站 title 无重复。
- **E2E（Playwright）**：首页计算器选属性 → 结果分组正确、URL 参数更新。

## 7. 上线验收

- 约 1300 个宝可梦页 + 首页、`/natures`、`/pokemon`、18 个属性页、`/winds-waves`、`/about` `/privacy` `/terms` 全部构建成功，部署到 monpedia.net。
- 手机端 Lighthouse：性能 ≥ 90，SEO = 100。
- `sitemap.xml` 提交 GSC；接入 Cloudflare Web Analytics。
- 关于、隐私、条款三页齐全，满足 Adsense 申请前提。

## 8. 后续子项目

1. 配队器 `/team-builder`（目标词 pokemon team builder，11 万 / KD 41），单独 spec。
2. Winds & Waves 专题扩展（发售前 1~2 个月：W&W 配队器、图鉴、兑换码页）。
3. Adsense 接入。
