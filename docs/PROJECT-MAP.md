# PROJECT MAP · iplmanufacturer.com（内部代号 1011）

> 给下一个 agent 的第一页。这个文档回答六个问题：这是什么、代码在哪、内容怎么流、哪些数字是权威的、哪些地方别碰、下一步该做什么。
>
> 最后核对：2026-11-18（基于 `astro/dist` 一次完整构建的实测，不是推算）。
> 读过本文件后仍需读 `AGENTS.md`（已定决策）与 `ops/RUNBOOK.md`（守卫故障排查）。

---

## 0. 三十秒摘要

一个**纯静态、22 语言、内容驱动**的 B2B 制造业官网。卖的是家用 IPL 脱毛仪的 OEM/ODM 代工，不是零售整机。网站的主要功能不是卖货，是**让海外品牌方在选厂阶段找到它、并且相信它**。

| 事实 | 数值 | 来源 |
|---|---|---|
| 构建产出的 HTML 页数 | **4,225** | `astro/dist` 实测 |
| 可索引 URL（sitemap） | **4,202** | `site-urls.txt` |
| 不可索引页 | 23（22×404 + Netlify forms 占位） | `scripts/baseline.json` |
| 语言数 | 22（en 无前缀 + 21 个 `/xx/`） | `astro.config.mjs` |
| 每个语言的 URL 数 | 191 = 113 文章 + 56 静态路由 + 21 分类 + 1 博客首页 | `site-urls.txt` |
| 英文文章 | 113 篇，137,939 词，中位 1,151 词 | 全量解析 |
| 全语言 MDX 文件 | 2,486（113 × 22） | `src/content/blog` |
| 构建产物体积 | **649 MB**，其中 HTML 590.7 MB | `dist` 实测 |
| 单页 HTML 均值 | 146 KB（最大 260 KB） | `dist` 实测 |
| 站点主域名 | `https://iplmanufacturer.com` | `astro.config.mjs` |

**注意：`AGENTS.md` 里的「3,433 页」与 `RUNBOOK.md` 里的「约 3,285 个 .html」都是旧数字**，`astro.config.mjs` 注释里的「61 篇文章」也是旧的。真实值见上表。这三个数字已经漂移了 19%~23%，足以误导下一个 agent 写错验收条件。

---

## 1. 业务层：这家公司在卖什么

- **主体**：Shenzhen iShine Technology Co., Ltd.（深圳市爱诗恩科技有限公司），英文贸易名 iShine。
- **产品**：家用 IPL 脱毛仪（整机），另有 LED 面罩 / LED 面板两条副线。
- **客户**：海外品牌方、经销商、连锁零售（Costco Canada）、DTC 品牌（RoseSkinCo、HappySkinCo、KU-2）。
- **商业模式**：OEM/ODM 代工 + 私有品牌 + 包装定制 + 物流。不是零售。
- **转化目标**：询盘（Contact 表单 / WhatsApp / WeChat），不是下单。
- **信任资产**：FDA 510(k) K222537（SKN001/002/005/006 与 RoseSkinCo Lumi）、CE、四个客户案例页、15 条公开专利记录、工厂参观。

**这条决定了很多内容决策**：任何「卖货」型内容（价格、促销、对比评测）都不是这套站的主线；主线是**采购者的决策材料**（认证、MOQ、交期、验厂、包装、责任划分）。

---

## 2. 仓库地图

```
1011/
├── AGENTS.md                 已定决策（禁改，先读）
├── netlify.toml              部署配置：base=astro/, 缓存头, CSP(Report-Only), 404 兜底, /en/* 301
├── site-urls.txt             构建产物：可索引 URL 清单（4,202 行），不入 git
├── astro/                    ← 站点本体，Netlify 的 base 目录
│   ├── package.json          build = 19 步链（见 §4）
│   ├── astro.config.mjs      site/i18n/trailingSlash/concurrency=1/rehype 内链语言前缀插件
│   ├── messages/*.json       22 个语言包（UI 文案 + 各页 meta）
│   ├── public/               robots.txt, llms.txt(42KB), _redirects, _headers, sitemap-*.xml
│   ├── scripts/              构建守卫 19 个 + 工具（见附录 B）
│   ├── src/
│   │   ├── content/blog/<locale>/<slug>.mdx   2,486 篇
│   │   ├── pages/            41 个 .astro → 56 条路由
│   │   ├── components/       27 个（SeoHead 是全站 head 的唯一出口）
│   │   ├── lib/              blog.ts(内容引擎) / seo-title.ts / i18n.ts / blog-recommendations.ts
│   │   ├── layouts/          BaseLayout.astro（唯一布局）
│   │   └── middleware/index.ts   写 language cookie（无实际路由逻辑）
│   └── dist/                 构建产物（.gitignore）
├── ops/
│   ├── RUNBOOK.md            守卫失败先查什么
│   └── seo/                  采集提交、GSC、Bing、日报（Python + PS，Windows 计划任务读它）
└── docs/                     合规证据、i18n 规范、性能决策、本文件
```

---

## 3. 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 框架 | **Astro 5.18.1**，`output: 'static'` | 无 SSR，无 adapter（2026-08-21 主动移除） |
| 交互 | React 18.2，仅 `**/react/*.tsx` 水合 | 用得很克制 |
| 样式 | Tailwind 3.3.3 + 页面级 `is:inline` CSS + `critical.css` | 一半页面自带几百行内联样式 |
| 内容 | MDX（`@astrojs/mdx`），非 Content Collections API | 自己用 `fs` + `js-yaml` 读 frontmatter（`lib/blog.ts`） |
| i18n | Astro 内置 i18n，`prefixDefaultLocale:false`，`fallbackType:'rewrite'` | 21 语言全部 fallback → en |
| 部署 | Netlify 静态托管，`base="astro/"`, `publish="dist/"` | 构建 `npm install && npm run build` |
| 运行时 | Node 20，`NODE_OPTIONS=--max-old-space-size=8192`，`build.concurrency=1` | 多语言构建吃内存，曾 OOM |
| 图片 | Netlify Image CDN（`/.netlify/images?url=...`），public 下静态文件 | 已放弃两条 force 重写，避免自指回环 |
| 分析 | GA4 + Simple Analytics + Ahrefs Analytics + Microsoft Clarity | 全在 CSP Report-Only 白名单里 |
| 表单 | Netlify Forms（`/__forms` 占位） | 一条线索通道 |
| 运维 | Windows 计划任务 → `ops/seo/run-task.ps1` → Python | 收录提交、GSC 拉数、日报、Bing 批处理 |

**没有用什么（别引入）**：没有 CMS、没有数据库、没有 SSR、没有客户端路由。内容即文件，改内容就是改 MDX。

---

## 4. 构建与部署

`npm run build` 是一条 **19 步链**，任何一步红了就不发布：

```
check-frontmatter          frontmatter 必填字段与枚举
check-meganav-drift        导航与 baseline 漂移
generate-site-urls         生成 site-urls.txt
check-site-urls            URL 清单完整性
check-claims-parity        译文不得出现英文源没有的标准号/声明
check-claims-messages      语言包里的合规声明一致性
astro build                4,225 页
flatten-html               foo/index.html → foo.html，并生成 _redirects
check-hero-video-autoplay  视频自动播放
check-robots               robots 不许封任何爬虫
check-llms / -coverage / -specs   llms.txt 存在性、覆盖、与产品参数一致
check-jsonld               JSON-LD 结构
generate-sitemap           22 语言子 sitemap + 索引
check-meta-length          标题/描述长度棘轮（只许变好）
check-claims-dist          产物里的声明
verify-baseline            页数/URL 数/重定向/hreflang 不变量
submit-indexnow            IndexNow 推送（本地构建跳过）
```

**关键机制**：`scripts/baseline.json` 是「只升不降」的棘轮。页数、每语言文章数、meta 超标数、sitemap 上限全写死在这里；新内容必须同步更新它并写清理由（文件里 `updateReason` 已积累了几千字的变更记录）。**这是这个仓库最独特的设计，也是最容易踩雷的地方**：新增文章却没有 21 个语言版本时，会产生 meta-refresh shim，必须重新声明 `sitemapCanonicalMismatch` 并给出回填计划。

---

## 5. 博客系统

### 5.1 内容模型

`src/content/blog/<locale>/<slug>.mdx`。字段定义在 `src/content.config.ts`，但**那个 zod schema 实际没有被引用**（见 §9-11），真正执行校验的是 `scripts/check-frontmatter.mjs`：

```yaml
title: 必填
description: 可选（缺失时从正文首段自动派生）
citableSummary: 可选但实际 113/113 全有 —— 站点的「AI 摘要块」
pubDate / updatedDate: 必填/可选
author: 必填（统一 "iShine Team"）
category: 必填，21 个枚举值之一
heroImage / ogImage: 可选
slug / translationKey: 必填（跨语言对齐靠 translationKey）
readTime / faqs / draft: 可选
primary_keyword / secondary_keywords: schema 里有，但 113 篇里只有 5 篇填了
```

### 5.2 加载与路由（`lib/blog.ts`）

- 用 `import.meta.glob` + `fs` 直接读文件，**不走 Astro Content Collections**。
- 三层 locale 解耦：内容目录名（`pt-BR`）↔ 内部 code（`pt-BR` / `es-ES`）↔ URL 前缀（`/pt-br/`）。`resolveBlogLocale()` 是唯一归一化入口。
- `getStaticPaths()` 聚合**全语言全部 slug**，每个 slug 只生成一次；i18n fallback 会自动克隆出 `/<locale>/blog/<slug>`，页内再按「URL 语言 + slug」决定渲染哪种语言，或 301 到正确地址。
- 原文缺译时：**rewrite 英文正文，URL 不变，canonical 指向英文**，不做 meta-refresh（那是早期 shim 方案，已废弃）。

### 5.3 文章页（`pages/blog/[slug].astro`）

输出 4 个 JSON-LD：`BreadcrumbList` / `WebPage` / `Article` / `FAQPage`（有 faqs 时）。
页面结构：面包屑 → 分类徽章 → H1 → 描述 → 作者/日期 → **citableSummary 摘要块** → 主图（AVIF/WebP srcset）→ 目录（H2≥3 才显示）→ 正文 → FAQ 折叠 → CTA（contact + products）→ 更新时间 → 点赞/点踩 → 相关文章 3 篇。

### 5.4 内容规模与质量（实测）

| 指标 | 数值 |
|---|---|
| 篇数 / 词数 | 113 篇 / 137,939 词（中位 1,151） |
| 有 `citableSummary` | 113/113（100%） |
| 有 `faqs`（→FAQPage schema） | 36/113（32%） |
| 有 `primary_keyword` | **5/113（4%）** |
| 内链为 0 的篇数 | **34/113（30%）** |
| 外链为 0 的篇数 | 24/113（21%） |
| 内链总数 | 357（均值 3.2/篇） |
| 2023 年旧文（未更新、400~630 词） | 9 篇 |
| 标题宽度超出 50–60 的 | 39/113 |

### 5.5 发布流水线（人工）

写作 → 英文 MDX → 21 个语言的翻译文件（同一 commit）→ 更新 `baseline.json`（页数、`blogPerLocale`、`updateReason`）→ 构建 → IndexNow → `site-urls.txt` 被 `ops/seo` 的计划任务读取。

**跨语言一致性由守卫强制**：`check-claims-parity.mjs` 会在译文提到英文没有的标准号时让构建失败。

---

## 6. SEO 资产盘点（哪些已经做对了）

| 项 | 状态 | 证据 |
|---|---|---|
| canonical | 100% 页面有 | 299 页采样，0 缺失 |
| hreflang | 100% 页面 22 条 + x-default | 采样 299/299 |
| H1 | 0 页缺失，0 页多个 | 采样 299/299 |
| JSON-LD | 100% 页面至少 1 块 | 采样 299/299 |
| robots meta | 全站 `index, follow, max-image-preview:large` | `SeoHead.astro` |
| sitemap | 1 索引 + 22 语言子文件，无大写路径 | `generate-sitemap.mjs` |
| robots.txt | 全放行，厂家中立，构架守卫 | `check-robots.mjs` |
| llms.txt | 42 KB，带维护元数据、版本日志、证据策略 | `public/llms.txt` |
| 结构化数据 | Organization / WebSite / Article / FAQPage / BreadcrumbList / Product+Offer / ItemList / VideoObject | 逐页核对 |
| 404 | 真 404（曾修过软 404） | `netlify.toml` |
| 尾斜杠 | 统一无尾斜杠 + 301 | `flatten-html.mjs` |

**缺的 schema**：13 个 services 子页**没有 `Service` schema**；教程类文章没有 `HowTo`；没有 `Review`/`AggregateRating`（不做假评分是对的）。

### 6.1 标题/描述的实测分布（这是最大的存量问题）

299 页采样：

| 指标 | 结果 |
|---|---|
| 标题宽度 < 50 | 112/299（37%） |
| 标题宽度 > 60 | 117/299（39%） |
| 落在 50–60 理想带 | 约 24% |
| 描述宽度 > 160 | 159/299（53%） |
| 描述宽度中位数 | 170 |

`baseline.json` 的全量计数：`titleOutOfRange: 3208`（76%）、`descriptionOverLimit: 2324`（55%）。

**这是棘轮机制的副作用**：守卫只保证不再变差，从不回头修，于是 76% 的超标被永久固化。

---

## 7. 关键词布局

### 7.1 静态路由（56 条，EN 实测 title 与判断）

| 路由 | 当前 title | 宽度 | 实际瞄的词 | 判断 |
|---|---|---|---|---|
| `/` | iShine - Professional IPL Hair Removal Device Manufacturer | 58 | ipl hair removal device manufacturer | 该词组量极低（Semrush 实测 `ipl manufacturer` 美国 0），首页应转打品类词而不是「manufacturer」 |
| `/products` | IPL Hair Removal Devices for OEM/ODM Private Label | 59 | ipl hair removal devices oem | 合格 |
| `/products/venus` | Venus IPL | 18 | 无 | **不合格**：型号名，无品类词 |
| `/products/lumi` | Lumi IPL | 17 | 无 | 同上；描述 235 宽也超标 |
| `/products/lumi-2` … `/euno`（其余 10 个型号） | `{型号} IPL` | 17–20 | 无 | **全部不合格**，同一模板 |
| `/products/wooden` | Golden Luxury IPL (Wooden) | 35 | 无 | 不合格 |
| `/products/led-therapy-mask-001a` | LED Therapy Mask 001A | 30 | led face mask | 描述 316 宽，严重超标 |
| `/services/private-label` | Private Label IPL Hair Removal Device Supplier | 55 | private label ipl | 合格（但这个词 Semrush 实测无量） |
| `/services/oem-odm` | IPL Hair Removal Device OEM & ODM Manufacturer | 59 | ipl oem manufacturer | 合格 |
| `/services/product-design` | Product Design \| iShine | 23 | 无 | 不合格 |
| `/services/logo-printing` | Logo Printing \| iShine | 22 | 无 | 不合格 |
| `/services/box-custom` | Box Customization \| iShine | 26 | 无 | 不合格 |
| `/services/dropshipping` | Dropshipping Support \| iShine | 29 | 无 | 不合格 |
| `/services/user-manual-guide-custom` | User Manual & Guide Customization \| iShine | 46 | 无 | 偏弱 |
| `/services/build-a-new-ipl` | Build a New IPL Device \| iShine | 31 | 无 | 不合格 |
| `/services/find-a-technology-partner` | Find a IPL Technology Partner \| iShine | 38 | 无（且有语法错 "a IPL"） | 不合格 |
| `/services/maintain-or-fix-ipl-project` | Maintain or Fix IPL Project \| iShine | 36 | 无 | 不合格 |
| `/services/packaging-logistics` | Packaging & Logistics \| iShine | 34 | 无 | 不合格 |
| `/services/no-moq` | Custom Logo & Packaging from Your First Sample Order | 65 | no moq ipl | 超宽 |
| `/components` | IPL Components & Parts | 55 | ipl components | 合格 |
| `/components/lamp-cartridges` | Lamp Cartridges \| iShine | 24 | 无 | 不合格 |
| `/components/optical-filters` | Optical Filters \| iShine | 24 | 无 | 不合格 |
| `/components/cooling-system` | Advanced Cooling Systems \| iShine | 33 | 无 | 不合格 |
| `/components/power-supply` | Power Supply \| iShine | 21 | 无 | 不合格 |
| `/clients` | Our Clients \| iShine IPL Hair Removal Manufacturer | 50 | 无（导航词） | 可接受 |
| `/clients/roseskin-ipl` 等 4 条 | 客户联合标题 | 50–64 | 品牌名 + iShine | 品牌词，正确用法 |
| `/ipl-hair-removal-is-safe` | Why IPL Hair Removal Is Safe… | **76** | ipl safe | 超宽 16，描述 263 宽，严重超标 |
| `/ipl-for-brands` | IPL Devices for Brands, Creators & Retail | 54 | 无明确词 | 偏弱 |
| `/faq` | FAQ \| iShine IPL Manufacturing | 30 | 无 | 不合格 |
| `/catalogue` | IPL Product Catalogue & Comparison | 47 | ipl catalogue | 偏弱 |
| `/marketplace` | iShine Marketplace \| Digital Creative Asset Trading Platform | 60 | 无 | 业务不清晰，描述 225 宽 |
| `/meet-the-team` | Meet the Team \| iShine | 22 | 无 | 不合格 |
| `/careers` `/contact` `/about*` `/privacy-policy` `/return-policy` | 品牌/导航词标题（`About iShine…`、`Contact Our Team…`） | 23–59 | 品牌词 | 可接受；`/privacy-policy` 23、`/return-policy` 38 偏窄 |

**结论**：56 条静态路由里，**28 条标题没有任何商业关键词**（15 个产品页 + 9 个服务子页 + 4 个组件子页），而且这些恰好是询盘最可能落地的页面。

### 7.2 文章聚类（113 篇 → 6 个簇）

按分类归并后（合计 113）：

| 簇 | 篇数 | 构成 | 关键词主轴 | 代表篇 | 现状 |
|---|---|---|---|---|---|
| 合规与准入 | 20 | Regulatory 20 | `ipl fda 510k` / `eu gpsr ipl` / `japan pse` / `hs code ipl` | fda-510k-vs-eu-mdr-ipl、eu-gpsr-ipl-devices | 最扎实的一簇，每篇 3–6 内链，成网 |
| 安全与使用 | 28 | Safety 16 + Technology 7 + Education 3 + Science 2 | `is ipl safe` / `ipl side effects` / `ipl how often` | 29/30/32/33/34 系列 | 成网，但簇内无支柱页 |
| 采购与制造 | 37 | Sourcing 19 + Manufacturing 6 + OEM/ODM 6 + Components 4 + Customization 2 | `ipl device manufacturer price` / `moq` / `vet supplier` | ipl-device-sourcing-guide（13 内链，事实上的枢纽） | 最强枢纽，应升级为 pillar |
| 市场与商业 | 22 | Market 5 + Marketing 5 + B2B 5 + Industry Insights 5 + Business 1 + Brand Building 1 | `ulike` / `dropshipping` / `ipl niche` / `salon` | 26-the-ulike-question、salon-home-ipl-retail | 观点型，搜索量弱但 AI 引用价值高 |
| 对比与选型 | 2 | Buying Guide 2 | `best ipl` / `braun vs philips` | best-ipl-hair-removal-device（2,687 词，10 内链） | 商业化最强，但只在英文有效 |
| 公司/品牌 | 4 | Press 1 + Innovation 1 + Research 1 + Sustainability 1 | 品牌词 | ishine-technology-milestones（18 内链） | 信任资产 |

**关键缺口**：没有一篇能同时吃掉「品类词 + 采购意图」的支柱页。`ipl-device-sourcing-guide` 最接近，但它只有 1,290 词、没有对比表、没有 FAQ。

### 7.3 分类页（21 个，其中 8 个是薄页）

`Technology 7 / Regulatory 20 / Sourcing 19 / Safety 16 / Manufacturing 6 / OEM-ODM 6 / Marketing 5 / Market 5 / B2B 5 / Industry-Insights 5 / Components 4 / Education 3 / Science 2 / Buying-Guide 2 / Customization 2 / Business 1 / Sustainability 1 / Research 1 / Innovation 1 / Press 1 / Brand-Building 1`

→ 21 × 22 语言 = **462 个分类页**，其中 8 个分类只有 1–2 篇文章，等于 176 个「只有 1–2 条链接」的薄页。这是明确的抓取预算浪费。

---

## 8. 优势（可验证的五条）

1. **head 层没有技术债**。canonical / hreflang / JSON-LD / H1 / robots 五项在采样里 100% 覆盖。多数同类制造业站在这一层就是烂的，这里不是。
2. **合规声明有守卫**。`check-claims-parity` + `check-claims-messages` + `check-claims-dist` 三道闸，译文不能凭空多出标准号；认证失效时是从 `llms.txt` 里**删除**而不是改写（ISO 13485/MDSAP 就这么处理的）。这是 E-E-A-T 层面的真资产，也是竞品最难抄的部分。
3. **`llms.txt` 是认真的**。42 KB，带证据分级（可独立核实 / 公司自述）、失效日期、变更日志。AI 引用场景下这是先手。
4. **多语言工程做得比内容更成熟**。三层 locale 解耦、fallback rewrite、shim 记账、baseline 不变量——这套东西一般团队写不出来。
5. **内容密度够**。113 篇 / 13.8 万英文词，中位 1,151 词，全部带 `citableSummary`。不是空站。

---

## 9. 短板（按损失排序）

| # | 短板 | 量化 | 后果 |
|---|---|---|---|
| 1 | **28 个静态商业页没有关键词标题** | 15 产品 + 9 服务子页 + 4 组件子页 | 询盘页在 SERP 里只显示型号名，没有品类词，等于自动放弃点击 |
| 2 | **76% 页面标题超带宽，55% 描述超长** | 3,208 / 2,324（全量） | 截断、信息丢失；棘轮只防恶化不修复 |
| 3 | **无关键词治理** | `primary_keyword` 仅 5/113；仓库无 keyword map | 内容按「选题直觉」写，不按查询写；无法判断某词是否已被覆盖 |
| 4 | **30% 文章零内链** | 34/113 | 2023 那批（400–630 词）既短又孤立，等于 9 个孤岛 |
| 5 | **分类碎片化** | 21 类 / 8 类≤2 篇 / 462 页 | 薄聚合页稀释抓取预算，真正的枢纽（Sourcing、Regulatory）没被强化 |
| 6 | **HTML 过重** | 590 MB HTML，均值 146 KB，最大 260 KB | 移动端 LCP 风险；`/blog` 单页 192 KB，其中约 104 KB 是内联 JS（113 篇文章的客户端筛选数据） |
| 7 | **翻译面铺得过大** | 22 语言 × 113 篇，多数语种无需求证据 | 机器翻译近重复风险；低需求语种（th/vi/cs/el/he/fa）投入产出倒挂 |
| 8 | **没有查询级反馈回路** | 仓库内无 GSC 导出；计划任务已禁用 | 所有关键词判断停留在 5 个词的一次 Semrush 实测 |
| 9 | **文档漂移** | AGENTS.md 3,433 / 实际 4,225 | 下一个 agent 会按错数字验收 |
| 10 | **模板残留** | `develoCore`/`develoContent`/`develoSocial` 仍在 22 个语言包里 | 死键，一旦被引用就是 Develo 文案泄漏 |
| 11 | **frontmatter 有两套「真相」** | `src/content.config.ts` 的 zod schema 无人引用（全仓无 `getCollection`/`astro:content` 调用），真正校验的是 `scripts/check-frontmatter.mjs` | 下一个 agent 往 schema 里加字段会以为生效了，其实没有 |

---

## 10. 优化方案

### P0（本周，改动小、收益确定）

**P0-1 修 28 个商业页的标题与描述。**
只改 `messages/*.json` 里对应页面的 meta，不动页面结构。模板：`{品类词} {限定词} | {型号} | iShine`，宽 50–60。
例：`Venus IPL` → `IPL Hair Removal Device for Salon Use | Venus | iShine`（54）。
同时把 9 个服务子页标题补上 IPL 语境：`Logo Printing` → `IPL Device Logo Printing for Private Label | iShine`（51）。
**注意：这些标题来自 `messages/<locale>.json`，只改 en 只修好英文页；21 个语言包要一起改，否则德语的 `/de/products/venus` 还是 `Venus IPL`。**
验收：`npm run check:meta-length` 的超标数下降后，用 `--update` 把新基线写回 `baseline.json` 并记理由。

**P0-2 给 34 篇零内链文章各插 2–3 条内链。**
优先级最高的是 9 篇 2023 年旧文（04/05/06/07/08/09/10/12/13），外加 01 这篇 503 词的短文。它们分别指向 `what-is-ipl`、`ipl-hair-removal-wavelength-range`、`ipl-device-sourcing-guide`、`uvc-vs-ipl-claims`。只改 MDX 正文，不动 frontmatter。
验收：`node scripts/check-links.mjs` 与内链计数脚本对比，零内链篇数 ≤ 10。

**P0-3 把分类从 21 压到 6。**
`Regulatory / Safety / Sourcing & Manufacturing / Market & Business / Technology & Science / Company`。
改 `blog-categories.ts` 枚举 + `normalize-categories.mjs` 映射 + `category-descriptions.ts`，保留旧分类 URL 的 301（写进 `flatten-html.mjs` 生成的 `_redirects`）。
收益：462 个分类页降到 132 个，同时 Sourcing & Manufacturing 从 19 升到 37，成为真正的枢纽。

**P0-4 修文档。**
`AGENTS.md` 页数 3,433 → 4,225；`RUNBOOK.md` 3,285 → 4,225；`astro.config.mjs` 注释里的「61 篇文章」→ 113。这三处不改，下一个 agent 一定会写错验收。

### P1（2–4 周）

**P1-1 建关键词表并纳入守卫。**
新增 `astro/src/lib/keyword-map.ts`（或 `docs/keyword-map.csv`）：`slug | primary | secondary[] | 意图 | 目标页`。
然后改 `check-frontmatter.mjs`：每篇必须有 `primary_keyword`，且全局不重复。113 篇一次性补齐。
这是把「按选题写」改成「按查询写」的唯一开关。

**P1-2 建 3 个支柱页。**
`/blog/ipl-device-sourcing-guide`（已有，扩到 2,500 词 + 对比表 + FAQ + 全部 37 篇采购簇内链）、
`/blog/ipl-safety-evidence`（新，聚合 28 篇安全簇，主打 `is ipl hair removal safe`）、
`/blog/ipl-certification-by-market`（新，聚合 20 篇合规簇，主打 `ipl certification by country`）。
三根支柱各吸收 15–25 条内链，现有 113 篇才有机会把权重传给商业页。

**P1-3 给 13 个 services 子页加 `Service` schema，给协议类文章加 `HowTo`。**
`Service`：name/description/provider/areaServed/offers。成本极低，是 B2B 询盘页的富结果入口。

**P1-4 `/blog` 首页分页，并把筛选数据移出内联脚本。**
现在 `/blog` 单页 192 KB：正文文字 5.7 KB，内联 `<script>` 104 KB（113 篇文章的客户端筛选数据），内联 `<style>` 29 KB。
改成 24 条/页 + `/blog/page/2` 真分页 URL + `link rel=next/prev`；筛选数据改为按需 `fetch('/blog-index.json')`，首屏不再携带全量 JSON。

**P1-5 缩新增翻译面（存量不动）。**
策略：`en + de + fr + es + tr + ar + ja` 这 7 个语言继续全量翻译；其余 15 个语言**只翻商业页**（56 条静态路由），新文章不再新建翻译文件，自动走英文 rewrite（canonical 已指向英文，机制现成）。
存量 15 个语言的旧文章**不删**——删页的排名与收录风险大于省下的抓取预算。
这一条只影响 `blogPerLocale` 的增长，不改现有数字。

### P2（1–2 个季度）

**P2-1 接上查询级数据。** 把 `ops/seo` 的 GSC 采集重新启用（README 说任务已禁用），每周输出「查询 → 落地页 → 展现/点击」三列表，回填到 `docs/keyword-map.csv`。没有这一步，P1-1 的关键词表就是猜的。

**P2-2 相关文章改成相似度。** 现在 `getRelatedPosts` 按 category 取同类的最近 3 篇；分类压到 6 个以后这会失效。改用关键词 + 标签交集，或离线算好写进 frontmatter 的 `related` 字段。

**P2-3 商业页加样品/报价入口。** 15 个产品页现在只有描述和 CTA 到 `/contact`。加一个带型号预填的询盘表单（Netlify Forms），并挂 Clarity 事件。B2B 站的转化损耗一半在这里。

**P2-4 清 `develo*` 死键。** 从 22 个语言包里删掉，删之前 grep 一遍确认无引用。

---

## 11. 下一个 agent 的操作守则

**先读**：`AGENTS.md` → 本文件 → `ops/RUNBOOK.md`。三者冲突时以 `AGENTS.md` 为准，但页数这类硬数字以本文件为准（本文件是实测的）。

**不要做**：
- 不要为了让构建通过去放宽守卫（`RUNBOOK.md` §4）。
- 不要手改 `dist/_redirects`（构建期覆盖）。
- 不要在仓库根新建文件（`clean_check.py` R1 会拦）。
- 不要一次 commit 混两件事：内容改动与 baseline 更新必须能对应上。
- 不要在同一个 checkout 里并发写（`AGENTS.md`「one writer per checkout」）。
- 不要在文档里写绝对路径（会被 pre-commit 拦），写相对路径。

**必须做**：
- 新增英文文章 → 同 commit 补齐 21 个语言版本；补不齐就重新声明 `sitemapCanonicalMismatch` 并写回填计划。
- 改任何合规/认证表述 → 先看 `docs/claims-evidence.md`，改完跑 `npm run check:claims`。
- 改标题/描述 → 跑 `npm run check:meta-length`，变好之后 `--update` 锁基线。
- 任何「构建全绿」的结论，必须来自真实构建，不能来自单条守卫通过（`RUNBOOK.md` §1）。

---

## 附录 A · 113 篇英文文章清单

| 分类 | slug | 日期 | 词数 | 内链 | 外链 | FAQ |
|---|---|---|---|---|---|---|
| B2B | ipl-after-hair-transplant | 2026-11-04 | 979 | 4 | 3 | 4 |
| B2B | ipl-label-warning-block | 2026-11-16 | 818 | 4 | 3 | 0 |
| B2B | ipl-packaging-drop-test | 2026-11-11 | 814 | 4 | 3 | 0 |
| B2B | ipl-validation-services | 2026-08-22 | 1699 | 1 | 3 | 7 |
| B2B | uvc-vs-ipl-claims | 2026-11-09 | 762 | 2 | 3 | 0 |
| Brand Building | zero-to-one-beauty-brand | 2026-08-11 | 903 | 0 | 1 | 0 |
| Business | 06-quality-control-in-ipl-manufacturing-best-practices | 2023-12-10 | 486 | 0 | 1 | 0 |
| Buying Guide | best-ipl-hair-removal-device | 2026-08-22 | 2687 | 10 | 3 | 5 |
| Buying Guide | cooling-ipl-hair-remover-buying-guide | 2026-08-31 | 1309 | 0 | 3 | 5 |
| Components | components-that-stand-up-to-scrutiny | 2026-08-11 | 584 | 0 | 3 | 0 |
| Components | iec-62133-2-cell-safety | 2026-10-21 | 923 | 3 | 0 | 0 |
| Components | ipl-device-power-adapter-travel-plug | 2026-09-12 | 1443 | 6 | 14 | 4 |
| Components | verify-ipl-fluence-claim | 2026-10-21 | 833 | 4 | 0 | 0 |
| Customization | piano-gloss-vs-matte-abs-hand-feel | 2026-09-18 | 1721 | 8 | 15 | 0 |
| Customization | private-label-artwork-files | 2026-10-21 | 918 | 3 | 0 | 0 |
| Education | is-ipl-hair-removal-permanent | 2026-08-22 | 1314 | 1 | 9 | 5 |
| Education | mens-permanent-hair-removal-ipl-vs-laser | 2026-06-09 | 1295 | 0 | 1 | 0 |
| Education | what-is-ipl | 2026-08-22 | 1706 | 6 | 8 | 7 |
| Industry Insights | beating-the-philips-lumea | 2026-08-25 | 1627 | 0 | 5 | 0 |
| Industry Insights | how-regulators-classify-home-ipl | 2026-08-25 | 2467 | 1 | 8 | 0 |
| Industry Insights | ipl-device-bundle-vs-single | 2026-08-25 | 2491 | 1 | 12 | 0 |
| Industry Insights | roseskinco-closed-lumi-factory | 2026-09-10 | 1346 | 8 | 4 | 0 |
| Industry Insights | the-truth-about-ipl-energy | 2026-08-13 | 1282 | 0 | 2 | 0 |
| Innovation | 12-smart-ipl-devices-the-app-connected-revolution | 2023-11-10 | 454 | 0 | 1 | 0 |
| Manufacturing | 02-oem-vs-odm-choosing-the-right-manufacturing-model | 2024-01-15 | 2211 | 1 | 1 | 0 |
| Manufacturing | ipl-device-shipping-packaging-gift-box-remailer-master-carton | 2026-09-29 | 1612 | 4 | 3 | 0 |
| Manufacturing | ipl-hair-removal-device-development-timeline | 2026-09-04 | 1099 | 1 | 3 | 4 |
| Manufacturing | ipl-warranty-after-sales | 2026-11-02 | 815 | 2 | 0 | 4 |
| Manufacturing | sapphire-windows-rocket-cameras-to-ipl | 2026-09-19 | 1798 | 0 | 32 | 5 |
| Manufacturing | why-premium-ipl-devices-feel-different | 2026-09-03 | 1112 | 1 | 18 | 0 |
| Market | 24-the-data-doesnt-lie-3-categories-still-printing-money-2026 | 2026-07-02 | 1717 | 0 | 1 | 0 |
| Market | 26-the-ulike-question-consumer-insight-home-ipl-market | 2026-07-02 | 1754 | 0 | 1 | 0 |
| Market | 27-our-ipl-hair-removal-factory-is-increasingly-being-selected-by-chatgpt | 2026-07-03 | 1528 | 0 | 1 | 0 |
| Market | beach-nations-ipl-sales-israel-technology | 2026-06-11 | 1646 | 0 | 1 | 0 |
| Market | big-capital-avoids-ipl-no-monopoly | 2026-06-11 | 1790 | 0 | 1 | 0 |
| Marketing | 10-marketing-strategies-for-ipl-devices | 2023-11-20 | 508 | 0 | 2 | 0 |
| Marketing | 16-abm-meta-ads-ipl-manufacturer-guide | 2026-05-22 | 1581 | 0 | 4 | 0 |
| Marketing | 17-ipl-dropshipping-best-products-2026 | 2026-05-22 | 2081 | 0 | 5 | 0 |
| Marketing | ipl-niche-kings-3000-units-per-month | 2026-06-10 | 1724 | 0 | 1 | 0 |
| Marketing | on-site-marketing-at-home-ipl-device-shopify | 2026-10-09 | 2387 | 0 | 13 | 0 |
| OEM/ODM | bar-style-vs-handle-style-home-ipl | 2026-10-23 | 974 | 4 | 4 | 4 |
| OEM/ODM | clinic-ipl-vs-home-ipl | 2026-10-29 | 1191 | 4 | 3 | 4 |
| OEM/ODM | custom-gradient-housing-for-a-sourcing-agent | 2026-08-19 | 654 | 1 | 3 | 0 |
| OEM/ODM | device-housing-moulding-tolerance | 2026-11-17 | 934 | 4 | 3 | 0 |
| OEM/ODM | equipment-brands-home-ipl-line | 2026-11-03 | 1151 | 4 | 3 | 4 |
| OEM/ODM | you-design-it-we-build-it-box-it | 2026-08-11 | 1185 | 0 | 1 | 0 |
| Press | factory-visits-canton-fair-2026 | 2026-09-15 | 1179 | 0 | 3 | 5 |
| Regulatory | 08-global-regulatory-landscape-for-ipl-devices | 2023-09-18 | 431 | 0 | 2 | 0 |
| Regulatory | 14-fda-cleared-ipl-device-manufacturer-guide | 2026-05-21 | 1450 | 2 | 4 | 0 |
| Regulatory | 35-fda-establishment-registration-device-listing-roles-manufacturer-contract-manufacturer-foreign-exporter | 2026-07-16 | 1747 | 2 | 2 | 0 |
| Regulatory | 50-private-label-ipl-gudid-registration-and-responsibility | 2026-10-13 | 2593 | 2 | 0 | 0 |
| Regulatory | australia-tga-artg-ipl-devices | 2026-10-21 | 1198 | 4 | 0 | 0 |
| Regulatory | braun-ipl-vs-philips-lumea-long-term-hair-reduction | 2026-09-29 | 1839 | 4 | 6 | 0 |
| Regulatory | declaration-of-conformity-ipl-devices | 2026-10-21 | 1036 | 4 | 0 | 0 |
| Regulatory | do-you-need-canada-mdl-ipl-device | 2026-09-04 | 1253 | 0 | 7 | 0 |
| Regulatory | eu-gpsr-ipl-devices | 2026-10-21 | 1308 | 4 | 0 | 0 |
| Regulatory | eu-mdr-home-ipl-devices | 2026-08-19 | 960 | 1 | 4 | 0 |
| Regulatory | fda-510k-vs-eu-mdr-ipl | 2026-10-21 | 929 | 6 | 0 | 3 |
| Regulatory | iec-62471-photobiological-safety-ipl | 2026-10-21 | 1189 | 4 | 0 | 3 |
| Regulatory | ipl-device-emc-testing | 2026-10-21 | 914 | 4 | 0 | 3 |
| Regulatory | ipl-labeling-and-claims | 2026-10-21 | 854 | 4 | 0 | 3 |
| Regulatory | japan-pse-ipl-devices | 2026-10-21 | 1313 | 4 | 0 | 0 |
| Regulatory | korea-kc-ipl-devices | 2026-10-21 | 875 | 3 | 0 | 0 |
| Regulatory | russia-eac-ipl-devices | 2026-10-21 | 915 | 3 | 0 | 0 |
| Regulatory | saso-saber-ipl-devices | 2026-10-21 | 1056 | 4 | 0 | 0 |
| Regulatory | ukca-ce-great-britain-ipl-devices | 2026-10-21 | 912 | 4 | 0 | 0 |
| Regulatory | un38-3-lithium-cells-ipl-shipping | 2026-10-21 | 1131 | 4 | 0 | 0 |
| Research | 09-latest-advances-in-ipl-research | 2023-09-12 | 453 | 0 | 1 | 0 |
| Safety | 11-consumer-safety-features-in-modern-ipl-devices | 2026-06-09 | 1635 | 0 | 1 | 0 |
| Safety | 25-ipl-hair-removal-safe-skin-types-fitzpatrick | 2026-06-08 | 1642 | 0 | 1 | 0 |
| Safety | 28-clinical-data-why-ipl-hair-removal-is-safe | 2026-07-07 | 675 | 5 | 2 | 0 |
| Safety | 29-safe-ipl-hair-removal-at-home-protocol | 2026-07-07 | 1151 | 10 | 1 | 0 |
| Safety | 30-ipl-vs-laser-which-is-safer | 2026-07-07 | 825 | 6 | 1 | 0 |
| Safety | 31-uv-filtering-wavelengths-why-ipl-is-safe | 2026-07-07 | 907 | 6 | 2 | 0 |
| Safety | 32-ipl-hair-removal-side-effects-what-is-normal | 2026-07-07 | 1090 | 7 | 1 | 0 |
| Safety | 33-who-should-not-use-ipl-hair-removal-contraindications | 2026-07-07 | 1518 | 8 | 2 | 0 |
| Safety | 34-ipl-hair-removal-before-and-aftercare-for-safety | 2026-07-07 | 877 | 8 | 2 | 0 |
| Safety | 36-two-waxing-sessions-leg-hair-never-grew-back-real-story | 2026-07-03 | 1455 | 7 | 3 | 0 |
| Safety | how-often-can-you-use-ipl-hair-removal-device | 2026-09-29 | 1770 | 5 | 2 | 5 |
| Safety | ipl-aftercare | 2026-08-22 | 1041 | 2 | 5 | 4 |
| Safety | ipl-and-gel | 2026-08-26 | 1403 | 1 | 5 | 5 |
| Safety | ipl-coarse-male-body-hair | 2026-09-02 | 892 | 2 | 2 | 3 |
| Safety | ipl-side-effects-by-skin-type | 2026-08-22 | 1529 | 4 | 7 | 6 |
| Safety | is-ipl-hair-removal-safe-fda-studies | 2026-06-09 | 1207 | 0 | 2 | 0 |
| Science | 04-the-science-of-ipl-how-light-targets-hair-follicles | 2023-12-28 | 533 | 0 | 1 | 0 |
| Science | pulsed-vs-continuous-wave-pbm-parameters | 2026-09-12 | 2101 | 9 | 9 | 4 |
| Sourcing | carton-cbm-freight-ipl | 2026-10-21 | 880 | 3 | 0 | 0 |
| Sourcing | distributor-adding-device-sku | 2026-11-10 | 932 | 4 | 3 | 0 |
| Sourcing | export-documents-ipl-shipment | 2026-10-21 | 1016 | 4 | 0 | 0 |
| Sourcing | hair-salon-hair-removal-retail | 2026-11-05 | 825 | 4 | 3 | 4 |
| Sourcing | how-to-vet-ipl-device-manufacturer | 2026-10-20 | 1174 | 7 | 8 | 3 |
| Sourcing | hs-code-ipl-devices | 2026-10-21 | 879 | 3 | 0 | 0 |
| Sourcing | ipl-device-manufacturer-price | 2026-10-20 | 1175 | 5 | 6 | 3 |
| Sourcing | ipl-device-moq-explained | 2026-10-20 | 1112 | 5 | 6 | 3 |
| Sourcing | ipl-device-sourcing-guide | 2026-10-20 | 1290 | 13 | 6 | 3 |
| Sourcing | ipl-order-calendar-black-friday-summer-peak | 2026-09-15 | 1195 | 0 | 12 | 4 |
| Sourcing | ipl-quality-agreement | 2026-10-21 | 918 | 4 | 0 | 0 |
| Sourcing | ipl-warranty-terms | 2026-10-21 | 1185 | 3 | 0 | 0 |
| Sourcing | nail-salon-light-devices-retail | 2026-11-06 | 1012 | 4 | 3 | 4 |
| Sourcing | proforma-invoice-ipl-order | 2026-10-21 | 848 | 4 | 0 | 0 |
| Sourcing | remote-factory-audit-ipl-device | 2026-10-20 | 1135 | 5 | 6 | 3 |
| Sourcing | salon-home-ipl-retail | 2026-10-27 | 877 | 2 | 3 | 4 |
| Sourcing | spa-at-home-hair-removal-recommendation | 2026-10-28 | 999 | 8 | 3 | 4 |
| Sourcing | switching-ipl-manufacturers | 2026-10-20 | 995 | 7 | 8 | 3 |
| Sourcing | ugly-truth-ipl-manufacturers-energy-adapter-fda | 2026-06-11 | 1830 | 0 | 1 | 0 |
| Sustainability | 07-sustainable-manufacturing-practices-in-beauty-tech | 2023-10-28 | 408 | 0 | 2 | 0 |
| Technology | 01-the-future-of-ipl-technology-trends-for-2025 | 2026-08-18 | 503 | 0 | 1 | 0 |
| Technology | 05-choosing-the-right-wavelength-for-ipl-devices | 2023-12-20 | 440 | 0 | 1 | 0 |
| Technology | 13-sapphire-cooling-technology-benefits-and-applications | 2023-11-05 | 630 | 0 | 1 | 0 |
| Technology | 15-skin-tone-detection-ipl-safety-guide | 2026-05-21 | 1719 | 2 | 5 | 0 |
| Technology | ipl-hair-removal-wavelength-range | 2026-08-22 | 1776 | 4 | 3 | 4 |
| Technology | ipl-long-pass-filter-test-report | 2026-08-24 | 1186 | 13 | 2 | 0 |
| Technology | ishine-technology-milestones | 2026-09-02 | 901 | 18 | 1 | 0 |

---

## 附录 B · 脚本与守卫

**构建链（`astro/scripts/`）**：`check-frontmatter` `check-meganav-drift` `generate-site-urls` `check-site-urls` `check-claims-parity` `check-claims-messages` `flatten-html` `check-hero-video-autoplay` `check-robots` `check-llms` `check-llms-coverage` `check-llms-specs` `check-jsonld` `generate-sitemap` `check-meta-length` `check-claims-dist` `verify-baseline` `submit-indexnow`
**工具**：`audit-titles` `check-links` `check-content-sitemap-parity` `measure-baseline` `normalize-categories` `extract-blog` `visual-qa` `hero-deep` `blog-deep`

**运维（`ops/seo/`）**：`seo_daily.py`（收录提交 + 日报，任务当前禁用）`gsc_run.mjs` / `gsc_daily_merge.py` / `gsc_request_index.mjs`（GSC）`bing_daily_batch.py`（Bing 批处理）`clean_check.py`（pre-commit）`preflight.py`（配置模式定义）`run-task.ps1`（计划任务唯一入口）

---

## 附录 C · 已知陷阱

1. **Astro 5.18.1 的 i18n fallback + `build.format:'file'` 有 bug**（fallback rewrite 生成空 body），所以站点走 `directory` + `flatten-html.mjs` 转 `.html`。不要改回 `file`。
2. **`Astro.url.pathname` 在 fallback 渲染时会被重写**，当前语言必须读 `Astro.currentLocale`。
3. **`/images/*` 曾被两条 `force=true` 重写送进 Image CDN，形成自指回环导致全站 504**。现在静态直出，不要再加。
4. **`/en/*` 的 301 在 `netlify.toml` 里，但真正生效的是 `flatten-html.mjs` 生成的 `dist/_redirects`**（Netlify 先读 `_redirects`）。改行为要改生成器。
5. **`sitemapCanonicalMismatch`** 是给「英文明文没有对应译文」留的容差。它现在是 0，说明所有语言都有对应文件；一旦新增英文文章没补译文，构建会失败，这是设计如此。
6. **`baseline.json` 的 `updateReason` 是审计日志**，不是注释。每次改基线都要写清「为什么变、变了多少、从哪测的」。
7. **PowerShell 的 `Select-String -Path` 把 `[slug]` 当通配符**，带方括号的文件必须用 `-LiteralPath`。
8. **控制台默认 GBK**，`Get-Content` 读中文文件会显示乱码，但文件本身是 UTF-8；判断编码用 `read` 工具或显式 `-Encoding UTF8`。
9. **`src/content.config.ts` 是死配置**：`lib/blog.ts` 用 `fs` + `js-yaml` 自己读 frontmatter，全仓没有任何 `getCollection('blog')`。改 schema 不影响任何东西，要改校验请改 `scripts/check-frontmatter.mjs`。
10. **HTML 的主要体积不是正文**。以 `/blog` 为例：192 KB 里正文文字只有 5.7 KB，内联 `<script>` 约 104 KB、内联 `<style>` 约 29 KB、inline SVG 约 9 KB。压缩 HTML 的正确入口是那两个内联块，不是删文案。
