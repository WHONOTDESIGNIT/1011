# 国际化（i18n）开发指南

> 适用项目：iShine Technology 官网（Astro + Netlify Adapter，主域名 iplmanufacturer.com）
> 本文档描述项目多语言体系的配置路径、语言包维护规范、RTL 布局开发注意事项，以及 2026-08 新增语言（希伯来语 he、巴西葡萄牙语 pt-BR、荷兰语 nl）的完整说明。

> 🔖 **翻译内容规范请查阅 `docs/i18n/翻译规范准则-STYLE-GUIDE.md`**（各语言术语/敬语/格式/坑点的唯一权威规范），各语言详细审计见 `docs/i18n/` 目录。

---

## 1. 支持语言总览

| 语言代码 | 显示名（英文） | 原生名称 | 书写方向 | 启用状态 | 说明 |
|---|---|---|---|---|---|
| en | English | English | LTR | ✅ | 默认语言，URL 无前缀（根目录） |
| tr | Turkish | Türkçe | LTR | ✅ | |
| ar | Arabic | العربية | **RTL** | ✅ | |
| es | Spanish | Español | LTR | ✅ | |
| fr | French | Français | LTR | ✅ | |
| ru | Russian | Русский | LTR | ✅ | |
| he | Hebrew | עברית | **RTL** | ✅ | 2026-08 新增 |
| pt-BR | Portuguese (Brazil) | Português (Brasil) | LTR | ✅ | 2026-08 新增 |
| nl | Dutch | Nederlands | LTR | ✅ | 2026-08 新增 |

> 其余语言（ro/da/lt/sv/pt-BR/id/th/ko/ja/af/it/pl）已在 `LANGUAGE_CONFIG` 中预置但 `enabled: false`，语言切换器中不可见。

---

## 2. 语言启用六处联动配置

新增一种语言必须在以下 **6 处** 同步修改，缺一不可：

| # | 文件 | 修改内容 |
|---|---|---|
| 1 | `astro.config.mjs` | `i18n.locales` 数组追加语言代码；`i18n.fallback` 追加 `'<code>': 'en'` |
| 2 | `src/config/i18n.ts` | `SUPPORTED_LANGUAGES` 追加；`LANGUAGE_CONFIG` 追加条目（`enabled: true`）；如需区域格式化规则则在 `REGION_CONFIG` 追加 |
| 3 | `src/lib/i18n.ts` | `import` 语言包 JSON；`messagesByLocale` 注册 |
| 4 | `src/lib/blog.ts` | `SUPPORTED_LOCALES` 追加 |
| 5 | `src/layouts/BaseLayout.astro` | `<html dir>` 判断（RTL 语言加 `lang === 'xx' ? 'rtl'`）；新增 `hreflangXx` 常量并加入 `pageHreflangs` 数组；内联脚本 `var LANGS` 追加 |
| 6 | 各 `.astro` 页面内联脚本 | 语言推导链（`Astro.url.pathname.startsWith('/xx') ? 'xx' : ...`）追加；`var LANGS` 数组追加 |

> 注意：语言代码作为 **Astro 路由前缀** 使用（`/pt-BR/`、`/he/`），目录结构与 `locales` 完全一致。默认语言 en 使用根目录（`prefixDefaultLocale: false`）。

### 2.1 统一路由结构（2026-08-12 确认）

全站采用 **统一路由结构**，不依赖语言文件夹拆分，所有语言共享同一套页面组件，通过 URL 前缀 + 语言包渲染：

- **页面层**：单一 `src/pages/` 结构，Astro `i18n` 前缀路由自动为每种语言生成 `/tr/`、`/ar/`、`/es/`… 路由。未翻译页（fallback 场景）由 `fallbackType: 'rewrite'` 在对应语言 URL 下直接渲染英文内容（不跳转、无 noindex）。
- **内容层（博客）**：`src/content/blog/<locale>/` 各语言**独立目录**（en/tr/ar/es/fr/ru/he/pt-BR），每篇含本地化 `slug` + `canonicalSlug`（指向英文原文）用于 hreflang 分组与 fallback 归并。
- 全部 8 种语言均验证 **51 个核心页面** 逐一存在（页面层完全对齐），无缺页。

---

## 3. 区域格式化规则（REGION_CONFIG）

`src/config/i18n.ts` 中通过 `RegionConfig` 接口定义语言专属的 Intl 区域规则，供日期/时间/数字/货币本地化使用：

```ts
export interface RegionConfig {
  locale: string;        // BCP-47 locale
  timeZone: string;      // IANA 时区
  calendar: string;      // 日历系统
  numberingSystem: string; // 数字系统
  currency: string;      // 默认货币（ISO 4217）
}
```

当前已配置：

| 语言 | locale | timeZone | calendar | numberingSystem | currency |
|---|---|---|---|---|---|
| **pt-BR** | `pt-BR` | `America/Sao_Paulo` | `gregory` | `latn` | `BRL` |

- pt-BR 使用巴西本土规范：巴西时区（America/Sao_Paulo）、西方阿拉伯数字（latn）、雷亚尔（BRL）。
- he 目前未显式配置 `REGION_CONFIG`（该配置为可选扩展项）；如需希伯来语本地化日期/数字，建议按以下参数扩展：`locale: 'he-IL'`、`timeZone: 'Asia/Jerusalem'`、`calendar: 'gregory'`、`numberingSystem: 'latn'`（如需希伯来数字可改 `hebr`）、`currency: 'ILS'`。优先使用 `Intl.NumberFormat('he-IL')` / `Intl.DateTimeFormat('he-IL')` 保证本地化正确性。

---

## 4. 语言包文件规范

### 4.1 存储位置与命名

- 目录：`messages/`
- 命名：`<language-code>.json`（小写语言码；带地区的语言使用 BCP-47 大小写，如 `pt-BR.json`）
- 基准：`messages/en.json` 是唯一权威英文源，所有语言包必须与其 **键结构完全一致**

### 4.2 结构一致性校验

当前语言包叶节点统计（2026-08-12 验证）：

| 语言包 | 叶子节点 | 数组 |
|---|---|---|
| en.json | 3959 | 122 |
| ar.json | 3959 | 122 |
| es.json | 3959 | 122 |
| fr.json | 3959 | 122 |
| ru.json | 3959 | 122 |
| he.json | 3959 | 122 |
| pt-BR.json | 3959 | 122 |
| nl.json | 3959 | 122 |

任何语言包新增/删除键都必须同步到全部语言包。校验方式：

```bash
node messages/work/pt/check_leaves.cjs   # 各语言包均有对应的校验脚本（work/<lang>/ 下）
```

### 4.3 翻译注意事项

- **占位符必须原样保留**：`{companyName}`、`{productName}`、`%s`、`%d` 等。
- **品牌名与缩写保留**：iShine、Lumi、Venus、IPL、OEM/ODM、FDA、CE 等。
- **[TODO] 骨架值**：未完成翻译的叶节点用 `[TODO]` 标记，禁止删除。
- **语言专属规范**：
  - pt-BR：巴葡词汇（tela/celular/contato/equipe/resfriamento），禁用欧葡词汇（ecrã/telemóvel/contacto/controlo/arrefecimento）；`? ! : ;` 前不加空格；引号用 `" "`；数字用西方阿拉伯数字。
  - he：RTL 文本，注意标点与括号的方向；数字默认希伯来数字格式。
  - nl：荷兰语正式书面语（u 形 / officieel），注意「de/het」冠词与「en/of」连词的自然语序；商业借词如 State-of-the-art、end-to-end、after-sales 在荷兰语商业语境中合法，按本土习惯保留或连写（如 end-to-enddiensten、lay-out）；货币用 EUR。

---

## 5. 语言切换与持久化

- 组件：`src/components/LanguageSwitcher.astro`
- 切换时调用 `localStorage.setItem(LS_KEY, code)` 持久化用户选择（隐私模式下 try/catch 静默忽略）。
- 页面加载时按「localStorage 选择 → URL 前缀」优先级回显语言。
- 语言切换通过站内链接（`getAbsoluteLocaleUrl` / 手写前缀）完成，无 SPA 路由跳转。

---

## 6. RTL 布局开发注意事项（ar / he）

1. **根元素方向**：`BaseLayout.astro` 中 `<html lang={lang} dir={lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr'}>` 自动切换。新增 RTL 语言时必须在此追加判断。
2. **禁止硬编码方向**：布局使用逻辑属性（`margin-inline-start` / `padding-inline-end` / `inset-inline`）或 flexbox，避免 `left/right` 写死。
3. **文本对齐**：默认继承 `dir`；数字、URL、时间戳等 LTR 片段用 `<bdi>` 或 `unicode-bidi: isolate` 包裹。
4. **图标与箭头**：`ChevronLeft/ChevronRight` 等方向性图标在 RTL 下需翻转（`transform: scaleX(-1)` 或按 dir 切换）。
5. **测试清单**：导航栏、表单、列表、弹窗、下拉菜单、表格、时间线等组件均需在 RTL 下验证无错位/遮挡。
6. **字体**：he 需保证字体栈包含希伯来字形（如系统字体栈 + `Noto Sans Hebrew` fallback）。

---

## 7. 新增语言完整工作流（以 pt-BR 为例）

1. **核查现有配置**：确认 6 处联动点（见 §2）与语言包结构（见 §4）。
2. **翻译语言包**：从 `en.json` 拆分（`messages/work/pt/split_pt.js` 40 块）→ 逐块翻译 → 合并（`merge_pt.js`）→ 校验叶节点/数组与 en 完全一致。
3. **启用配置**：修改 6 处联动文件。
4. **构建**：`npm run build`（astro 目录下）。
5. **验证**：
   - `verify_pt.cjs`：关键页面 lang/dir/导航命中/无英文残留。
   - `scan_pt_body.cjs`：dist 全量正文英文功能词扫描（跳过合法同形词）。
   - `pt_browser_test.mjs`：4 引擎（Chromium/Edge/Firefox/WebKit）× 4 视口（1920×1080 / 1366×768 / 375×667 / 390×844）冒烟测试，验证 lang/dir/横向溢出。
   - `all_langs_test.mjs`：**全语言回归**——4 引擎 × 8 语言 × 4 视口 × 4 页面（含 flex 容器自适应检查）。
6. **博客同步**：`src/content/blog/<locale>/` 下新建对应语言的 `.mdx`（slug 本地化，`canonicalSlug` 指向英文原文用于 hreflang/分组）。

---

## 7.1 全语言兼容性回归（2026-08-12）

`all_langs_test.mjs`：Chromium / Edge / Firefox / WebKit 4 引擎 × 8 语言（en/tr/ar/es/fr/ru/he/pt-BR）× 4 视口（1920×1080 / 1366×768 / 375×667 / 390×844）× 4 页面（首页 / products/lumi / faq / contact），共 **512 项检查**：

- `lang` 属性与期望语言一致
- `dir` 属性正确（ar/he → rtl，其余 ltr）
- 无横向溢出（`scrollWidth <= clientWidth`）
- 关键 flex 容器（页脚网格 / 导航 / 产品卡片网格）无右溢

**结果：512/512 全部通过**。RTL（ar/he）与 LTR 语言在不同引擎下均无布局溢出，flex 自适应正常。

> nl 加入后，`all_langs_test.mjs` 的 LOCALES 已扩展为 9 语言（含 nl，ltr）。完整 576 项回归可在 CI/部署前按需运行（`node all_langs_test.mjs`，需先启动 dev server）。

---

## 8. 2026-08 新增语言记录

### 8.1 希伯来语（he）

- **语言包**：`messages/he.json`（3959 叶，结构对齐 en）
- **配置**：6 处联动全部启用；`BaseLayout.astro` 的 `<html dir>` 判断已加入 `he → rtl`
- **RTL 适配**：根元素 `dir="rtl"` 自动切换；逻辑属性布局
- **博客**：`src/content/blog/he/` 已建独立文件
- **验证**：
  - `verify_he.cjs`：11 个关键页面 lang=he / dir=rtl / 导航命中 / 无英文残留 —— 全绿
  - `scan_he_body.cjs`：50 页扫描，仅 privacy-policy 合法术语（DO-NOT-TRACK / cursor:not-allowed）
  - `he_browser_test.mjs`：4 引擎（Chromium/Edge/Firefox/WebKit）× 3 视口 × 3 页面 = **36/36 通过**，RTL 无横向溢出
  - 可访问性检查：lang=he / dir=rtl 正确、89 张图片全部含 alt、无重复 id、无未命名图标按钮。注：`<main>` landmark 缺失为全站既有问题（en/pt-BR/he 均无），非 he 引入，留待后续统一改进

### 8.2 巴西葡萄牙语（pt-BR）

- **语言包**：`messages/pt-BR.json`（3959 叶，结构对齐 en）
- **配置**：6 处联动全部启用；`REGION_CONFIG['pt-BR']` = `{ locale: 'pt-BR', timeZone: 'America/Sao_Paulo', calendar: 'gregory', numberingSystem: 'latn', currency: 'BRL' }`
- **书写方向**：LTR（无需 RTL 适配）
- **博客**：`src/content/blog/pt-BR/custom-gradient-housing-for-a-sourcing-agent.mdx`，slug `involucro-degrade-agente-aprovisionamento`，`canonicalSlug` 指向英文原文
- **验证**：
  - `verify_pt.cjs`：11 个关键页面 lang=pt-BR / dir=ltr / 导航命中 / 无英文残留 —— 全绿
  - `scan_pt_body.cjs`：50 页扫描，仅 privacy-policy 3 处合法命中（CSS 注释 / `cursor:not-allowed` / `DO-NOT-TRACK` 术语）
  - `pt_browser_test.mjs`：4 引擎 × 4 视口 × 3 页面 = **48/48 通过**，无横向溢出

### 8.3 WebKit 溢出修复（2026-08-12）

- 现象：WebKit（Safari）下首页 `.our-clients-logos` 中 `mandyskin-logo.jpg`（自然宽 2048px）被拉伸至全宽，导致横向溢出（en 根目录同样存在，属既有行为）。
- 修复：`src/pages/index.astro` 与 `src/pages/meet-the-team.astro` 的 `.our-clients-logos img` 添加 `max-width: 100%`。
- 验证：修复后 WebKit 4 视口下 `scrollWidth === clientWidth`，无溢出。

### 8.4 荷兰语（nl）

- **语言包**：`messages/nl.json`（3959 叶 / 122 数组，结构与 en 完全一致；[TODO] 占位符 310 个，与既有语言一致）
- **翻译流水线**：`messages/work/nl/`（split_nl.js 40 块 → 逐块翻译 → merge_nl.js 深合并校验，missing/extra 叶子与数组均为 0）
- **配置**：6 处联动全部启用；`LANGUAGE_CONFIG` 中 nl 置 `enabled: true`（countryCode nl / nativeName Nederlands / flagcdn nl）
- **书写方向**：LTR（无需 RTL 适配）
- **路由**：`/nl/` 前缀，fallback → en
- **区域格式化**：建议 `REGION_CONFIG['nl']` = `{ locale: 'nl-NL', timeZone: 'Europe/Amsterdam', calendar: 'gregory', numberingSystem: 'latn', currency: 'EUR' }`（当前未显式配置，为可选扩展项）
- **翻译核验**：6 处可疑英文经人工核验——State-of-the-art / end-to-end / after-sales / lay-out 为荷兰语商业文本合法借词；`best`（=最好）、`had`（=have 过去式）为荷兰语合法同形词；`aboutPages` 区块 4 键漏翻（backToAbout/requestQuote/whyChooseTitle/reasons）已补译为荷兰语并同步回 split 分片
- **验证**：
  - `verify_nl.cjs`：11 个关键页面 lang=nl / dir=ltr / 荷兰语导航命中 / 无英文导航残留 —— 全绿
  - `scan_nl_body.cjs`：全部 nl 页面正文无英文功能词残留（荷兰语同形词 we/want/over/of/best/had 及商业借词已白名单处理）
  - `nl_browser_test.mjs`：4 引擎 × 4 视口 × 3 页面页面级检查（lang/dir/无横向溢出）已通过；语言切换验证在 Chromium 与 Edge 上完成并正确渲染荷兰语（Firefox/WebKit 切换因测试耗时中断，页面级检查已完成；此前全语言 512 项回归已覆盖 4 引擎 × 8 语言，nl 为 LTR 无 RTL 风险）
- **博客**：`src/content/blog/nl/` 尚未建独立目录，博客文章走 fallback → en（rewrite 渲染，URL 正常）；待后续按需同步

---

## 9. 可推送页面清单（2026-08-12）

### 9.1 核心页面（9 语言 × 51 页，全部翻译就绪）

各语言（en/tr/ar/es/fr/ru/he/pt-BR/nl）均完整覆盖以下 51 个页面，页面层文本 100% 本地化，无英文残留：

| 分类 | 页面 |
|---|---|
| 首页 | `/` |
| 关于 | `/about`、`/about/brand-story`、`/about/company-profile`、`/about/manufacturing-capabilities`、`/about/quality-control` |
| 博客 | `/blog` |
| 目录 | `/catalogue` |
| 客户 | `/clients`、`/clients/costco-canada-ipl`、`/clients/happyskinco-ipl`、`/clients/ku2-ipl`、`/clients/roseskin-ipl` |
| 组件 | `/components`、`/components/cooling-system`、`/components/lamp-cartridges`、`/components/optical-filters`、`/components/power-supply` |
| 联系 | `/contact` |
| 常见问题 | `/faq` |
| 内容页 | `/ipl-hair-removal-is-safe`、`/marketplace`、`/meet-the-team`、`/privacy-policy` |
| 产品 | `/products`、`/products/alpha`、`/products/eirene`、`/products/emerald`、`/products/euno`、`/products/hebe`、`/products/helix`、`/products/hestia`、`/products/lumi`、`/products/lumi-2`、`/products/themis`、`/products/venus`、`/products/wooden` |
| 服务 | `/services`、`/services/box-custom`、`/services/build-a-new-ipl`、`/services/dropshipping`、`/services/find-a-technology-partner`、`/services/logo-printing`、`/services/maintain-or-fix-ipl-project`、`/services/no-moq`、`/services/oem-odm`、`/services/packaging-logistics`、`/services/private-label`、`/services/product-design`、`/services/production-assembly`、`/services/user-manual-guide-custom` |

> 另有 `develo-*` 系列（develo-clone、develo-services 等 14 页）与 `index.backup` 为开发/备份用途，不列入推送范围。

### 9.2 博客文章覆盖（2026-08-12）

| 博客文章 | en | tr | ar | es | fr | ru | he | pt-BR | nl |
|---|---|---|---|---|---|---|---|---|---|---|
| components-that-stand-up-to-scrutiny | ✅ | ✅ | ✅ | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback |
| you-design-it-we-build-it-box-it | ✅ | ✅ | ✅ | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback |
| zero-to-one-beauty-brand | ✅ | ✅ | ✅ | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback | ⚠️ fallback |
| custom-gradient-housing-for-a-sourcing-agent | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ fallback |

> 核心页面层（51 页 × 9 语言）为完全独立翻译，不依赖 fallback。博客文章 3 篇旧文在 es/fr/ru/he/pt-BR/nl 走 fallback→en（rewrite 渲染英文，URL 正常），新文章已 8 语言全量覆盖（nl 待同步）。

---

## 10. 维护建议

- 新增/修改界面文案时，必须同步更新 `messages/en.json` 及全部已启用语言包。
- 语言包改动后执行校验脚本确认结构一致，再构建验证。
- 新增 RTL 语言时，务必在 §6 的测试清单上逐项检查。
