# 罗马尼亚语（ro）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-19 · 调研方法：web_search 罗马尼亚电商（OLX/evomag/desertcart）
> 数据文件：`.wx-bridge/plans/ro_ref/*.json`
> 对应语言包：`messages/ro.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | OLX.ro（罗马尼亚分类广告） | "Epilator IPL Philips Lumea Seria 9900" |
| 2 | evoMAG / desertcart.ro | "Epilare" 罗马尼亚电商分类 |

**未采用**：AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。

---

## 2. 罗马尼亚语核心术语基准

### 2.1 产品名/类别术语

| 英文（en.json） | 罗马尼亚语基准 | ro.json 现状 | 处理 |
|---|---|---|---|
| IPL hair removal device | **epilator IPL / dispozitiv de epilare IPL** | dispozitive de epilare IPL（46 处） | ✅ 保留 |
| hair removal | **epilare** | epilare | ✅ 保留 |
| body hair | **păr** | păr | ✅ 保留 |
| at-home | **acasă / pentru acasă** | acasă（6 处） | ✅ 保留 |

### 2.2 部件/技术术语

| 英文 | 罗马尼亚语基准 | ro.json 现状 | 处理 |
|---|---|---|---|
| flash / flashes | **fulger / fulgere** | fulgere（正确） | ✅ 保留 |
| flash count | **număr de fulgere** | Număr de fulgere | ✅ 保留 |
| skin tone | **nuanța pielii / culoarea pielii** | nuanța pielii | ✅ 保留 |
| painless | **fără durere / nedureros** | fără durere（9 处） | ✅ 保留 |
| light pulse | **puls de lumină** | puls（40 处） | ✅ 保留 |
| intensity | **intensitate** | intensitate | ✅ 保留 |
| lamp | **lampă** | lampă（74 处） | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **flash 英文残留**（14 处）：统一为 **fulger/fulgere**（与既有 fulgere 一致）。
2. 其余术语已符合罗马尼亚语惯例，保留。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **dumneavoastră 尊称**（罗马尼亚 B2B 标准），动词按 dumneavoastră 变位；避免 "tu" 亲称。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、IPL、OEM、ODM、FDA、CE、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen、Guangzhou。
- private label → **marcă proprie / etichetă privată**。

### 3.2 标点与格式
- 罗马尼亚数字：千位分隔用点（1.999.998）或空格，统一为点；小数用逗号（2,5）。
- 货币：**lei (RON)** 或 USD。
- 百分比：**70 %**（% 前空格，罗马尼亚规范）。
- 温度：**10 °C**。
- **HTML 标签保留**（`<b>`、`<br>`），只翻译内部文本。

### 3.3 术语一致性铁律
- IPL hair removal device → **epilator IPL / dispozitiv de epilare IPL**
- hair removal → **epilare**；body hair → **păr**；hair（头发）→ **păr**（同一词，靠上下文）
- flash → **fulger**（不用 flash）；flash count → **număr de fulgere**
- skin tone → **nuanța pielii**；skin → **piele**
- painless → **fără durere**
- 禁止英文残留：device→dispozitiv、handset→dispozitiv、unit→unitate

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **flash 残留**（14 处）：统一 fulgere。
2. **tu/dumneavoastră 混用**：统一 dumneavoastră。
3. **罗马尼亚语性数一致**：形容词与名词性数格一致。
4. `develo*` 部分保留英文（438 处与英文相同）：专有名词保留合理，其余确认。

---

## 5. 复核流程

1. 术语机械修正：flash → fulgere（语境判断）。
2. 生成 EN-RO 对照对（排除 [TODO]），按顶层 key 分组。
3. 子代理逐条复核（每次最多 2 个并发）：修正机翻痕迹、统一术语、检查 dumneavoastră。
4. 合并（merge_lang_fixes.py）。
5. 结构验证：ro 叶子 = en 叶子（5422），0 缺失 0 多余。
6. `astro build` 验证 + 抽样检查 /ro/ 页面。
