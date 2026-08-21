# 捷克语（cs）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-20 · 调研方法：抓取 Philips CZ + web_search 捷克电商
> 数据文件：`.wx-bridge/plans/cs_ref/*.json`
> 对应语言包：`messages/cs.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | Philips 捷克官网（philips.cz） | "IPL epilátor Lumea"、"přístroje pro odstraňování chloupků" |

**未采用**：AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。

---

## 2. 捷克语核心术语基准

### 2.1 产品名/类别术语

| 英文（en.json） | 捷克语基准 | cs.json 现状 | 处理 |
|---|---|---|---|
| IPL hair removal device | **IPL epilátor / přístroj na odstranění chloupků** | IPL přístrojů na odstranění chloupků（57 处） | ✅ 保留 |
| hair removal | **odstranění chloupků / epilace** | odstranění chloupků | ✅ 保留 |
| body hair | **chloupky** | chloupk（57 处） | ✅ 保留 |
| at-home | **doma / pro domácí použití** | doma（1 处） | ⚠️ 统一 doma/pro domácí použití |

### 2.2 部件/技术术语

| 英文 | 捷克语基准 | cs.json 现状 | 处理 |
|---|---|---|---|
| flash / flashes | **záblesk / záblesky** | záblesk（55 处） | ✅ 保留 |
| flash count | **počet záblesků** | Počet záblesků | ✅ 保留 |
| skin tone | **tón pleti** | tón pleti | ✅ 保留 |
| painless | **bezbolestný** | bezbolest（10 处） | ✅ 保留 |
| light pulse | **pulz světla** | pulz（16 处） | ✅ 保留 |
| intensity | **intenzita** | intenzita | ✅ 保留 |
| lamp | **lampa** | lampa（41 处） | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **flash 英文残留**（2 处）：统一 záblesk。
2. 其余术语已符合捷克语惯例，保留（chloupky=体毛、záblesk=闪光均正确）。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **vy 尊称**（捷克 B2B 标准），动词按 vy 变位；避免 "ty" 亲称。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、IPL、OEM、ODM、FDA、CE、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen、Guangzhou。
- private label → **soukromá značka / privátní značka**。

### 3.2 标点与格式
- 捷克数字：千位分隔用空格（1 999 998）或点，统一为空格；小数用逗号（2,5）。
- 货币：**Kč**（捷克克朗）或 USD。
- 百分比：**70 %**（% 前空格，捷克规范）。
- 温度：**10 °C**。
- **HTML 标签保留**（`<b>`、`<br>`），只翻译内部文本。

### 3.3 术语一致性铁律
- IPL hair removal device → **IPL přístroj na odstranění chloupků / IPL epilátor**
- hair removal → **odstranění chloupků**；body hair → **chloupky**；hair（头发）→ **vlasy**（不可混用 chloupky/vlasy！chloupky=体毛，vlasy=头发）
- flash → **záblesk**（不用 flash）；flash count → **počet záblesků**
- skin tone → **tón pleti**；skin → **pleť**
- painless → **bezbolestný**
- 禁止英文残留：device→přístroj、handset→přístroj、unit→jednotka

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **flash 残留**（2 处）：统一 záblesk。
2. **ty/vy 混用**：统一 vy。
3. **chloupky/vlasy 混用风险**：体毛=chloupky，头发=vlasy。
4. **捷克语格变化**：7 格变格（形容词与名词一致）。
5. `develo*` 部分保留英文（350 处与英文相同）：专有名词保留合理，其余确认。

---

## 5. 复核流程

1. 术语机械修正：flash → záblesk。
2. 生成 EN-CS 对照对（排除 [TODO] 与 blog，按顶层 key 分组）。
3. 子代理逐条复核（每次最多 2 个并发）：修正机翻痕迹、统一术语、检查 vy。
4. 合并（merge_lang_fixes.py）。
5. 结构验证：cs 叶子 = en 叶子（5422），0 缺失 0 多余。
6. `astro build` 验证 + 抽样检查 /cs/ 页面。
