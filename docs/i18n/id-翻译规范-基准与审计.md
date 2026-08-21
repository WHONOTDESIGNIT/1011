# 印尼语（id）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-19 · 调研方法：抓取 Philips ID + web_search 印尼电商
> 数据文件：`.wx-bridge/plans/id_ref/*.json`
> 对应语言包：`messages/id.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | Philips 印尼官网（philips.co.id） | Lumea IPL 官方页 |
| 2 | Tokopedia（印尼电商，仅交叉验证） | "alat penghilang bulu IPL" 主流叫法 |

**未采用**：AliExpress/Amazon/Temu/SHEIN 及中国卖家为主平台作为基准。

---

## 2. 印尼语核心术语基准

### 2.1 产品名/类别术语

| 英文（en.json） | 印尼语基准 | id.json 现状 | 处理 |
|---|---|---|---|
| IPL hair removal device | **alat penghilang bulu IPL / perangkat penghilang bulu IPL** | Perangkat Penghilang Bulu IPL（24 处） | ✅ 保留 |
| hair removal | **penghilangan bulu / menghilangkan bulu** | penghilang bulu | ✅ 保留 |
| body hair | **bulu** | bulu | ✅ 保留 |
| at-home | **di rumah / untuk rumah** | rumah（38 处） | ✅ 保留 |

### 2.2 部件/技术术语

| 英文 | 印尼语基准 | id.json 现状 | 处理 |
|---|---|---|---|
| flash / flashes | **kilatan / flash**（印尼通用 kilatan 或 flash） | kilatan（24）、flash（17） | ⚠️ 统一 **kilatan** |
| flash count | **jumlah kilatan** | Jumlah Kilatan | ✅ 保留 |
| skin tone | **warna kulit / corak kulit** | warna kulit（30 处） | ✅ 保留 |
| painless | **tanpa rasa sakit / tidak menyakitkan** | tanpa rasa sakit（10 处） | ✅ 保留 |
| light pulse | **pulsa cahaya** | pulsa（13 处） | ✅ 保留 |
| intensity | **intensitas** | intensitas | ✅ 保留 |
| lamp | **lampu** | lampu（76 处） | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **flash → kilatan**（17 处）：印尼语 kilatan 是标准译法（闪光），flash 是英文残留。子代理统一。
2. 其余术语已符合印尼语惯例，保留。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **Anda 尊称**（印尼 B2B 标准），动词按 Anda 变位；避免 "kamu" 亲称。
- 称呼客户用 **pelanggan**（客户）。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、IPL、OEM、ODM、FDA、CE、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen、Guangzhou。
- private label → **label pribadi / merek sendiri**。

### 3.2 标点与格式
- 印尼数字：千位分隔用点（1.999.998），小数用逗号（2,5）。
- 货币：**Rp**（印尼盾）或 USD。
- 百分比：**70%** 或 **70 %**。
- 温度：**10°C** 或 **10 °C**。
- **HTML 标签保留**（`<b>`、`<br>`），只翻译内部文本。

### 3.3 术语一致性铁律
- IPL hair removal device → **alat/perangkat penghilang bulu IPL**
- hair removal → **penghilangan bulu**；body hair → **bulu**；hair（头发）→ **rambut**（不可混用 bulu/rambut！bulu=体毛，rambut=头发）
- flash → **kilatan**（不用 flash）；flash count → **jumlah kilatan**
- skin tone → **warna kulit**；skin → **kulit**
- painless → **tanpa rasa sakit**
- 禁止英文残留：device→perangkat/alat、handset→perangkat、unit→unit/alat

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **flash 残留**（17 处）：统一 kilatan。
2. **bulu/rambut 混用风险**：body hair=bulu，头发=rambut。
3. **kamu/Anda 混用**：统一 Anda。
4. `develo*` 部分保留英文（434 处与英文相同）：专有名词保留合理，其余确认。

---

## 5. 复核流程

1. 术语机械修正：flash → kilatan（语境判断）。
2. 生成 EN-ID 对照对（排除 [TODO]），按顶层 key 分组。
3. 子代理逐条复核（每次最多 2 个并发）：修正机翻痕迹、统一术语、检查 Anda。
4. 合并（merge_lang_fixes.py）。
5. 结构验证：id 叶子 = en 叶子（5422），0 缺失 0 多余。
6. `astro build` 验证 + 抽样检查 /id/ 页面。
