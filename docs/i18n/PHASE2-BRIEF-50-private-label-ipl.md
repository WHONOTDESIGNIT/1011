# Phase 2 本地化任务书 —— `50-private-label-ipl-gudid-registration-and-responsibility`

## 任务

把一篇**英文法规类博客**本地化为指定语种，写入：

```
astro/src/content/blog/<locale>/50-private-label-ipl-gudid-registration-and-responsibility.mdx
```

英文源文件（**唯一权威语义来源**）：

```
astro/src/content/blog/en/50-private-label-ipl-gudid-registration-and-responsibility.mdx
```

## 硬性规则（违反即返工）

### 1. 以下 8 个字段**逐字节照抄英文，不要翻译、不要改大小写**

```yaml
pubDate: "2026-10-13"
author: "Eric"
category: "Regulatory"          # 必须是 BLOG_CATEGORIES 白名单里的原值，不得本地化
heroImage: "/images/blog/blog-03-fda-clearance-for-ipl-devices-a-complete-guide.webp"
slug: "50-private-label-ipl-gudid-registration-and-responsibility"
translationKey: "50-private-label-ipl-gudid-registration-and-responsibility"
```

`slug` 与 `translationKey` **所有语种完全相同**（这是本项目的既有做法，已核实：schema 里没有 `canonicalSlug`，且 45-best 等文章 22 语种共用同一 slug）。**文件名也必须与 slug 完全一致。**

### 2. 需要翻译的字段

`title` / `description` / `citableSummary`，以及**正文全部内容**。

### 3. ⭐ 关键法规术语**保留英文原文，不要翻译**

这是本任务最重要的规则。以下术语在非英语市场的法规语境中通常直接使用英文，机翻会造成误导。**保留英文**，可在该术语**首次出现**时用括号加一个目标语言的简短解释：

| 保留不译的术语 |
| --- |
| `labeler of record` |
| `specification developer` |
| `letter-to-file` |
| `510(k)` |
| `GUDID` |
| `DI`（device identifier）/ `UDI` |
| `Flowchart A` / `Flowchart B` / `Flowchart C` |
| `device master record` |
| `initial importer` |
| `US agent` |
| `establishment registration` / `device listing` |

**其余品牌与技术名同样保留**：iShine、Shenzhen iShine Technology Co., Ltd、Braun、Philips、RoseSkinCo、IPL、FDA、CDRH、DUNS、FEI、CFR 条款号（`21 CFR 820.30` 等）、`FD&C Act §704(e)`、K222537、3021338880、10086240、620658743、`®`、`™`。

### 4. 其他

- **禁止机器直译**。按目标语言商务/法规文体写，术语与敬语全篇一致（见下方各语种规范）。
- **表格、加粗、内链、标题层级全部保留**；内链 URL 原样不动（`/blog/35-...`、`/blog/14-...`、`/blog/08-...`）。
- **保留三处谨慎表述**，不得删改：① GUDID 品牌名字段字符集那段标注为"我方运营理解、需对照 FDA 数据字典确认"；② 结尾免责声明（"不是法律意见 / device-specific determinations 需 regulatory 签署"）；③ `documentation` 不等于"什么都不做"的加粗强调。
- **不要新增或删减小节**，章节顺序与英文一致。
- **不要改 frontmatter 的键名或顺序**。

### 5. 语种规范

- 通用规范：`docs/i18n/翻译规范准则-STYLE-GUIDE.md`
- 语种专属（存在哪个读哪个，命名可能是 `-基准与审计` / `-本地化分析` / `-语言风格审计`）：`docs/i18n/<locale>-翻译规范-*.md`
- 该目录**可能没有你的语种**（例如 it / pt-PT 就没有）——那就只按通用规范 + 该语种既有博客的实际文体来写。
- **敬语/文体必须与该语种既有博客一致**：可以读同语种的一篇文章（如 `45-best-ipl-hair-removal-device.mdx`）对齐称谓与语气。

## 交付前自检

1. `category` 是否仍为 `Regulatory`（未被本地化）；
2. `slug` / `translationKey` 是否与英文逐字节相同；
3. 文件名是否 = `<slug>.mdx`；
4. 关键术语是否仍是英文（`labeler of record`、`specification developer`、`letter-to-file` 等）；
5. 表格与内链是否完整；
6. YAML 是否能解析（不要引入未加引号的冒号、不要破坏缩进）。

## 回传

用结构化结果回传：语种、文件路径、各字段翻译要点、术语保留情况、自检结果、遇到的问题。**如实报告**任何与本任务书不符之处，不要猜测或强行套用。
