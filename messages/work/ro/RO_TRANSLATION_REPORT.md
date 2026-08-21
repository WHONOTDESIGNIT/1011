# 罗马尼亚语（ro）翻译校验报告

项目：iShine Technology（iplmanufacturer.com）— Astro 多语言官网
校验日期：2026-08-13
校验工具：`messages/work/ro/merge_ro.js`、`astro/check_ro_coverage.cjs`、`astro/verify_ro.cjs`

## 一、交付物清单

| 交付物 | 路径 | 说明 |
|---|---|---|
| 罗马尼亚语资源包 | `messages/ro.json` | 完整翻译包，4081 个叶子键 |
| 拆分/翻译分片 | `messages/work/ro/split/extract_ro_part01~40.json` | 40 个翻译工作分片（含 en 源分片） |
| 拆分脚本 | `messages/work/ro/split_ro.js` | en.json → 40 分片 |
| 合并脚本 | `messages/work/ro/merge_ro.js` | 40 分片 → ro.json + 键结构校验 |
| 覆盖/质量校验 | `astro/check_ro_coverage.cjs` | 覆盖率、[TODO]、英文残留、变音符 |
| 构建产物校验 | `astro/verify_ro.cjs` | lang/dir/导航/变音符 |
| 浏览器测试 | `astro/ro_browser_test.mjs` | 4 引擎 × 4 视口 + 语言切换 |
| 截图证据 | `messages/work/ro/screenshots/*.png` | 桌面/移动端渲染截图 |

## 二、翻译覆盖校验（要求：100% 覆盖）

基于 `en.json`（基准语言）逐路径比对：

| 指标 | 结果 |
|---|---|
| en 叶子键总数 | 4081 |
| ro 叶子键总数 | 4081 |
| 缺失键 | **0** |
| 多余键 | **0** |
| 数组结构（en） | 245 |
| 缺失/多余数组 | **0 / 0** |
| **翻译覆盖率** | **100.00%** |

## 三、翻译质量校验

| 指标 | 结果 |
|---|---|
| 英文句子残留（排除品牌/缩写白名单） | **0** |
| 罗马尼亚语变音符字符总数（ă â î ș ț 及大写） | 11533 |
| `[TODO]` 遗留占位符 | 310（与 en.json 完全一致，见"已知说明"） |

### 术语一致性约定（术语表要点）
- IPL 行业术语：epilare（脱毛）、răcire（冷却）、lungime de undă（波长）、densitate energetică（能量密度）、cartuș pentru lampă（灯管卡匣）、sursă de alimentare（电源）等
- 商务术语：producție（生产）、conformitate（合规）、certificare（认证）、asigurarea calității（质保体系）、marcă privată（自有品牌）、termen de livrare（交期）
- 品牌/缩写按行业惯例保留英文：iShine、IPL、OEM、ODM、FDA、CE、ISO、MOQ、UV、LED、RFQ、SKU、MDSAP 及全部产品名（Lumi、Venus、Hestia、Alpha、Emerald、Euno、Themis、Hebe、Helix、Eirene）
- 枚举/规格类标签保留英文：颜色名（White、Tech Black 等）、Yes/No/Support、类别标签（ECOMMERCE、TECHNOLOGY 等）
- 罗马尼亚语规范：完整使用 ă â î ș ț 变音符；引号使用罗马尼亚规范 „…”；日期格式 `1 iulie 2026`

### 已知说明
1. `en.json` 中存在 310 个 `[TODO] <path>` 占位值，分布在扁平遗留命名空间（hero/trusted/why/process/core/advantages/breadcrumb 等）。经代码扫描确认：**这 310 个键在站点源码中均未被引用**（3274 个实际使用的 t() 键无一带 TODO 值），属于历史遗留空壳。
2. 处理策略：与既有 9 个语言包（nl/es/fr/he 等）约定一致——ro.json 对这类键保留与 en.json 完全相同的 `[TODO]` 值，不虚构内容。已由 merge_ro.js 的归一化步骤强制保证（与 en 逐字一致，310/310）。
3. 站内实际展示的所有界面文案键均已 100% 翻译为地道罗马尼亚语，无未翻译遗漏。

## 四、语言注册修改清单

| 文件 | 修改 |
|---|---|
| `astro/src/config/i18n.ts` | `ro` 语言 `enabled: true`；`SUPPORTED_LANGUAGES` 加入 `"ro"` |
| `astro/src/lib/i18n.ts` | 导入 `messages/ro.json` 并注册 `ro` |
| `astro/astro.config.mjs` | `locales` 加入 `'ro'`；`fallback.ro = 'en'` |
| `astro/src/lib/blog.ts` | `SUPPORTED_LOCALES` 加入 `'ro'`（博客路由/sitemap） |
| 12 个 .astro 页面/组件 | locale 推断链（startsWith 回退）插入 `/ro/` 分支 |
| 22 个 .astro 页面/布局 | 语言偏好持久化脚本 `LANGS` 数组加入 `'ro'` |

### 修复的关键缺陷
语言偏好持久化脚本（BaseLayout 等 22 处）的 `LANGS` 数组原不含 `'ro'`，会导致：从英文页点击"Română"切到 `/ro` 后，脚本误判"当前语言(en) ≠ 偏好(ro)"，二次重定向至 `/ro/ro`（404）。已全部修复，切换流程验证通过。

## 五、构建验证

- `astro build`（10 种语言全量）成功，退出码 0
- `/ro/` 路由全部生成（首页、services、products、components、blog、faq、contact、about 等）
- sitemap.xml 包含 **50 条** `/ro/` 条目
- verify_ro.cjs：全部抽样页面 `lang="ro"`、`dir="ltr"`、罗马尼亚语导航命中、无英文导航残留、变音符正常
