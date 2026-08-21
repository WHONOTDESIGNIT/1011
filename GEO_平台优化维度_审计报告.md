# GEO 审计报告 — 平台优化维度（Platform Optimization）

**网站**: https://iplmanufacturer.com （iShine Technology Ltd.，IPL 家用脱毛仪 OEM/ODM 制造商）
**审计日期**: 2026-08-14
**抓取页面**: `/`（首页）、`/services`、`/products`、`/about`、`/faq`、`/products/venus`（产品详情）、`/blog/the-truth-about-ipl-energy`（博客文章）、`/llms.txt`、`/robots.txt`、`/sitemap.xml`
**方法**: Python/urllib 抓取线上 HTML（忽略 SSL 校验）+ 读取项目源码 `D:\1011-main\1011-main\1011-main\astro\src`

---

## 一、各平台就绪度评分（0-100）

### 1. Google AI Overviews 就绪度 — **72/100**

| 检查项 | 评分 | 结论 |
|---|---|---|
| 清晰可抽取的直接答案段落 | 88 | 首页之外几乎所有核心页都有"提问式 H2/H3 + 直接答案段"结构，services 页甚至有专门的 "Citable Summary" 区块 |
| FAQ / How-to 结构 | 72 | /faq 页 43 组 `<details>/<summary>` 可见问答 + FAQPage schema；但 services 页 Q&A 区块无 schema，全站无 HowTo schema |
| 页面标题 / 元描述质量 | 74 | 标题关键词明确（45-58 字符），但描述普遍 172-185 字符（超 160 截断线）；about 标题 "About iShine" 过泛 |
| 首页（最高流量页）就绪度 | 40 | 首页是整个站点结构化最差的页面，见 Critical-1 |

### 2. ChatGPT (OpenAI) 就绪度 — **68/100**

| 检查项 | 评分 | 结论 |
|---|---|---|
| llms.txt 存在与质量 | 60 | 内容本身优秀（103 行，公司/产品/服务/组件/案例全覆盖），但**内部链接全部 404**（/en/ 前缀错误），严重削弱可用性 |
| robots.txt 对 AI 爬虫策略 | 85 | GPTBot / ClaudeBot / PerplexityBot 显式 `Allow: /` + 通配符兜底 |
| 产品/服务信息结构化 | 75 | 12 个产品详情页有完整 Product schema（含 AggregateOffer 价格区间）；services/components 页面结构化良好 |
| 品牌实体信息明确 | 70 | Organization schema 覆盖所有 BaseLayout 页面 + about 页实体问答 + llms.txt 公司段落；但首页无任何 schema |
| HTML 可解析性 | 78 | 语义化标题层级、43 组问答、清晰段落；无明显 JS 渲染依赖 |

### 3. Perplexity 就绪度 — **60/100**

| 检查项 | 评分 | 结论 |
|---|---|---|
| 内容深度 | 70 | 核心页正文 961-1913 词，/faq 3343 词，40 篇博客文章；深度足够但单页密度中等 |
| 引用来源质量 | 40 | **全站无任何外部权威引用**（外链仅 fonts.googleapis/gstatic 两个 CDN）；FDA/ISO/客户声明全部为自述，无第三方锚点 |
| 数据支撑 | 55 | 有硬数据（500,000+ 台、50+ 客户、20+ 国家、2008 年成立、FDA/CE/ISO 13485/MDSAP），但无任何可验证的外部数据源链接（如 FDA 510(k) 数据库、零售平台 listing） |
| 可信度信号 | 65 | 具名客户（Costco Canada / RoseSkinCo USA / KU2 Cosmetics DE）与案例研究提升可信度，但均为站内自述 |

### 4. Google AIO 友好度 — **70/100**

| 检查项 | 评分 | 结论 |
|---|---|---|
| Schema 使用（覆盖面） | 80 | Organization+WebSite 全站（除首页）、Product+AggregateOffer（详情页）、FAQPage（43 题）、Article+BreadcrumbList（博客）、BreadcrumbList（深层页）；sitemap 932 URL、17 语言 hreflang |
| Schema 缺失项 | 55 | 首页 0 个 JSON-LD；products 列表页无 Product/ItemList；services Q&A 无 FAQPage；无 HowTo；og:image 全站共用一张默认图 |
| 内容摘要可提取性 | 78 | Citable Summary / 提问式 H2 / 43 组问答 / 结构化 llms.txt，摘要提取友好 |

---

## 二、关键发现（按严重度分类）

### 🔴 Critical

- **C1. 首页完全绕过 BaseLayout，零结构化元数据**（`src/pages/index.astro` 是全站唯一不 import BaseLayout 的页面）
  - 线上首页实测：`canonical` 0 处、`hreflang` 0 处、`og:*` 0 处、`twitter:*` 0 处、`application/ld+json` 0 处、`google-site-verification` 0 处、`robots` meta 0 处
  - 这是全站流量最高的 URL，却无法被 Google AIO / 搜索引擎 / LLM 明确理解品牌实体；且首页无 canonical，存在自引用歧义风险
  - 证据: 线上抓包 `<head>` 仅含 charset/viewport/lang 脚本/icon/title/description/字体/样式；源码 `src/pages/index.astro` 注释明示"首页不经过 BaseLayout/SiteHeader 组件"

- **C2. llms.txt 全部内部链接 404**
  - llms.txt（103 行，内容质量高）中 Products/Services/Components/About/Blog/Case Studies 等所有链接均使用 `/en/` 前缀（如 `https://iplmanufacturer.com/en/services`）
  - 实测 `/en/services`、`/en/products/lumi-2`、`/en/blog`、`/en/clients/roseskin-ipl`、`/en/components`、`/en/about/company-profile` **全部返回 404**（英文站实际以根路径提供服务）
  - 后果: 跟随 llms.txt 的 AI 爬虫（GPTBot 等）会浪费抓取预算并留下"站点损坏"印象，llms.txt 的投资大打折扣

### 🟠 High

- **H1. 全站零外部权威引用（citation 生态缺失）**
  - 4 个核心页外链合计仅 3 个，全部是字体 CDN；没有任何指向 FDA 510(k) 数据库、ISO 认证机构、行业新闻、电商平台 listing、第三方评测的外链
  - 对 Perplexity 引用质量、Google AIO 引用来源多样性是硬伤；AI 引擎难以把站内自述数据与权威第三方锚点关联

- **H2. robots.txt 缺少 OAI-SearchBot 等显式规则**
  - 仅显式列出 GPTBot / ClaudeBot / PerplexityBot + 通配符 `*`（通配符实际允许所有 AI 爬虫，功能上可访问）
  - 但 ChatGPT Search / 其他搜索型 agent（OAI-SearchBot、Google-Extended、Bytespider、CCBot、Meta-ExternalAgent 等）无显式条目，显式声明属于 GEO 最佳实践，成本为零

- **H3. 首页文案质量瑕疵**
  - H1 结尾带分号 "Powering the World Leading IPL Device Brands;"
  - Hero 区拼写错误 "You Design it, We **Bulid** it , Box it."（Bulid → Build）
  - 品牌定位句 "Find Your Manufacturing Partner" 后跟 "iShine Technology" 的实体介绍段落是首页唯一可引用的答案块，但整体实体信息密度低

### 🟡 Medium

- **M1. services 页 "Questions brands ask before placing an order" 有可见问答但无 FAQPage schema**（该页 JSON-LD 仅 Organization+WebSite）
- **M2. products 列表页无 Product / ItemList schema**（仅 Organization+WebSite；12 个详情页才有 Product schema）
- **M3. 元描述普遍超长**：home 172、services 176、products 185 字符（建议 ≤155-160）
- **M4. og:image 全站共用默认图**：`/images/home/hero-section-sapphire-ipl-device-white-color.webp` 经 Netlify 参数化输出，产品/服务页未用专属社交图
- **M5. 无 HowTo / FAQPage 之外的富媒体 schema**：站点有大量 "How to choose / workflow" 内容（Pick a track / 工作流），可加 HowTo schema

### 🟢 Low

- **L1. about 页 title "About iShine" 过泛**，可改为 "About iShine Technology | IPL OEM/ODM Manufacturer"
- **L2. 首页 trust-bar 滚动文案含 "ChatGPT Top Collection" 营销语**，无实际链接，无实质影响
- **L3. 首页 H1 之后的 "What we do / Book a call" 按钮文案重复出现**，正文锚文本价值低
- **L4. 博客 Article schema 缺 image 字段**（headline/datePublished/author 齐全）

---

## 三、证据摘要

| 证据项 | 详情 |
|---|---|
| BaseLayout schema | Organization（name/foundingDate 2008/contactPoint/sameAs 5 社媒/areaServed）+ WebSite JSON-LD，17 语言 hreflang + x-default，canonical，OG/Twitter 全量 |
| 首页 head 实测 | `ld+json` 0 处、`canonical` 0 处、`hreflang` 0 处、`og:` 0 处、`google-site-verification` 0 处、`robots` 0 处；仅 title + meta description |
| FAQ 页 | 43 组 `<details>/<summary>` 可见问答，与 FAQPage schema 43 题一一对应；答案长度 152-424 字符（均值 243，可直接抽取）；正文 3343 词 |
| 产品详情页 (venus) | Product schema：name/description/image/brand(iShine)/AggregateOffer($35.99-$46.00, USD, offerCount 4, InStock) + BreadcrumbList(Home>IPL Products>Venus IPL) |
| 博客文章 | Article schema：headline/datePublished 2026-08-13/author(iShine Team)/BreadcrumbList/WebPage；缺 image |
| services "Citable Summary" | H3 提问 "What is included in iShine's IPL manufacturing services?" + ~180 词直接答案段（覆盖 OEM/ODM、冷却方案、1-4 周打样、FOB/CIF 物流） |
| products Q&A | H2 "What product types does iShine offer for private-label IPL?" + 直接答案段 + "How to Choose" 分组 |
| about Q&A | H2 "What is iShine Technology Ltd.?" + 实体答案段（2008 广州成立、FDA/CE/ISO 13485、15+ 年、500K+ 台、50+ 客户、20+ 国家） |
| llms.txt | 103 行，覆盖 Crawl&index/Company/Products(10)/Services(5)/Components(4)/About(4)/Blog/Case Studies(4)/Who we serve/Outcomes/Contact；**但全部 `/en/` 链接 404** |
| robots.txt | GPTBot/ClaudeBot/PerplexityBot 显式 Allow:/ + `*` 通配符；Disallow 仅 develo-* 旧模板路径；Sitemap 声明存在 |
| sitemap.xml | 932 个 URL；12 个产品详情；40 篇博客；17 语言版本 |
| 外链 | 4 个核心页外链共 3 个：fonts.googleapis.com ×2、fonts.gstatic.com ×1 —— **零权威外部引用** |
| 正文词数 | home 1237 / services 1913 / products 1135 / about 961 / faq 3343 |
| 标题/描述长度 | title 12-58 字符；description 139-185 字符（3 页超 160） |
| 源码 | `src/pages/index.astro` 全站唯一不 import BaseLayout 的页面（32 个页面中其余 31 个均使用） |

---

## 四、改进建议（按优先级）

### P0 — 立即修复（1-2 周）
1. **修复 llms.txt 全部链接**：把 `/en/` 前缀改为根路径（`https://iplmanufacturer.com/services` 而非 `/en/services`），并加自动校验脚本（如 `scripts/check-robots.cjs` 同款的 link checker），防止再次漂移
2. **让首页回归 BaseLayout**（或复制其 head 逻辑）：补 canonical、17 语言 hreflang、OG/Twitter、Organization+WebSite JSON-LD、google-site-verification、robots meta —— 首页是全站最重要实体页，成本最低收益最大
3. **修复首页文案**：去掉 H1 尾部 ";"，修正 "Bulid" → "Build"

### P1 — 高优先级（1 个月内）
4. **建立外部引用生态**：在服务/认证页加入 FDA 510(k) 数据库链接、ISO 13485 认证机构链接、客户案例的公开报道/电商 listing 外链；博客文章引用行业论文/监管文件。目标：每个核心页 ≥2-3 个权威外链
5. **robots.txt 显式放行全部 AI 爬虫**：追加 `OAI-SearchBot`、`Google-Extended`、`Bytespider`、`CCBot`、`Meta-ExternalAgent`、`Applebot-Extended`、`Amazonbot` 等 `Allow: /`
6. **为 services 页 Q&A 区块补 FAQPage schema**（该页已有完整问答对，仅缺标记）
7. **products 列表页加 ItemList/Product schema**，产品详情页 og:image 改用各产品专属图

### P2 — 中期优化（1-3 个月）
8. 压缩元描述至 ≤160 字符（home/services/products 三条）
9. 为 "How to Choose / Pick a track / workflow" 内容加 HowTo schema
10. about 页 title 改为 "About iShine Technology | IPL OEM/ODM Manufacturer"
11. 博客 Article schema 补 image 字段；考虑 BlogPosting 细分
12. 首页正文增加可直接引用的品牌定位段落（150-250 词"公司是什么/能做什么/数据背书"），当前 1237 词中实体答案密度不足

### P3 — 长期
13. 提供 `llms-full.txt` 或每页 Markdown 版（LLM 友好快照），并在 llms.txt 声明多语言版本
14. 将 case studies（Costco/RoseSkinCo/KU2）做成可被引用的独立权威页，附第三方证据
15. 为 17 个语言版本建立 hreflang 一致性监控（sitemap 中已含 932 URL，需防语言页与英文页内容漂移）

---

## 五、平台维度总分

# **68 / 100**

**评分逻辑**: 四平台均分 (72+68+60+70)/4 = 67.5，考虑"首页零结构化"与"llms.txt 链接全坏"两项 Critical 对 ChatGPT/Google AIO 的实质损害，取整 68。
**一句话结论**: 站点在内容结构化（Q&A、schema、llms.txt 骨架、robots 策略）上已明显优于同类 B2B 制造站，但**首页元数据缺失 + llms.txt 链接 404 + 零外部引用生态**三个问题直接压制了 AI 平台的可发现/可引用上限；修复 P0+P1 预计可把总分推至 80+。
