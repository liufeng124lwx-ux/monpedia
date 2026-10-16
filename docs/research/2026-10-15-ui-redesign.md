# UI 改版：「图鉴机」方向（2026-10-15）

## 调研

- **Refero styles**（全量读取 3 个）：Playdate（主）、Duolingo（借按压按钮）、Discord（作为暗色备选，未采用）。
  另检索过 Cards Against Humanity、Quizlet、Honk、Bento、Xbox 等预览。
- **Refero screens**：LEGO 角色目录页（彩色顶部底板 + 角色图 + 名称的卡片结构）、Xbox / Epic 详情页。
  Refero 里没有任何宝可梦官方站。
- **官方站实测**（Playwright + 本机 Chrome）：
  - pokemon.com/us/pokedex：顶部「Name or Number」搜索、**Surprise Me!**、Sort By、**Load more Pokémon**、
    详情页**上一只 / 下一只**（#0444 Gabite ← → #0446 Munchlax）、Stats、Type、Weaknesses、带属性的进化链。
    字体 Flexo；主按钮 #EE6B2F，圆角 5px。
  - windswaves.pokemon.com：天空→海洋渐变、波浪纹分隔、白色大圆角卡片配青蓝渐变描边、右上角「Reduced motion」开关。
  - pokemon.com/us/WindsWaves 是 404，官方专题在 windswaves.pokemon.com。
- **竞品**：pkmn.help（左侧导航，属性按钮带图标，「Copy link」）、pokemondb（属性三字母缩写表）、pokesynergy（深色、霓虹青）。

## Reference lock

- **主参考**：Playdate —— 大块平涂色、单一几何无衬线字体（800 字重、紧字距）、全出血色带交替（亮黄 / 炭黑 / 白）、
  几乎无阴影、按钮 6px 圆角、胶囊形用于标签与主操作。
- **必须保留**：黄色全出血色带作为页首舞台；炭黑色带承载「全表」等数据块；单一字体家族；平面无阴影卡片；高对比。
- **只借**：Duolingo 的「实体按键」底部硬阴影（`0 4px 0` 深色）——**只用于属性按键与主按钮**；
  LEGO 的「彩色顶板 + 角色图」卡片结构。
- **角色规则**：
  - 宝可梦红 `#E3350D` = 主操作 + 激活态专用（承接 Playdate 紫色 CTA 的角色），不做大面积背景。
  - 黄 `#FFCB05` = 页首舞台 / 信息胶囊，不做按钮。
  - 18 种属性色 = 只表示属性（沿用朱紫游戏内色板），不挪作装饰。
  - 伤害倍率色（4× / 2× / ½ / ¼ / 0）是独立的数据色，只出现在倍率上。
- **图像**：PokeAPI 同仓库的官方立绘（`other/official-artwork`），1221 个全部存在；W&W 新御三家没有立绘，
  用属性色圆形占位 + 指向官方站的说明，不画假图。
- **拒绝**：米白 / 暖奶油底、玫瑰金、衬线体标题换词、玻璃拟态、大面积紫色渐变、到处投影。

## 交互升级（每项对应的来源）

| 交互 | 来源 | 作用 |
|---|---|---|
| 属性按键按下（下沉 + 底影收起） | Duolingo 按压按钮 | 反馈 |
| 结果徽章逐个弹入 | motion 指南 Level 1–2 | 状态变化可见 |
| 全表十字高亮（悬停 / 点按行列） | pokemondb、pkmn.help 的查表习惯 | 查表更快 |
| 列表 → 详情立绘形变（ViewTransition） | Next 16 官方 view transitions 指南 | 连续性 |
| 详情页上一只 / 下一只 | pokemon.com Pokédex | 官方使用习惯 |
| Surprise me 随机跳转 | pokemon.com Pokédex「Surprise Me!」 | 官方使用习惯、可玩性 |
| 立绘全息卡倾斜（指针驱动） | 宝可梦集换卡的闪卡 | 记忆点；`prefers-reduced-motion` 与触屏下关闭 |
| 能力值条入场生长 | motion 指南 Level 2 | 层级 |
| 顶部全局「名字或编号」搜索，`/` 聚焦 | pokemon.com 顶部搜索 | 官方使用习惯 |
| 属性筛选做成横向胶囊而不是下拉 | pkmn.help | 少一次点击 |

## Tokens

- 字体：Outfit（next/font 自托管），400 / 600 / 800；标题 800、字距 -0.02em。
- 颜色：ink `#211F1A`、paper `#FFFFFF`、panel `#F1F0EC`、line `#DEDCD5`、yellow `#FFCB05`、red `#E3350D`。
  暗色：canvas `#16150F`、panel `#24221B`、line `#3A372D`，黄与红不变。
- 圆角：按钮 / 输入 6px；卡片 10px；胶囊 999px。
- 动效：fast 120ms、default 200ms、slow 320ms；enter 用 ease-out。
