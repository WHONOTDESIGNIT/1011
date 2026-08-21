# 巴西葡萄牙语（pt-BR）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-18 · 调研方法：真实浏览器抓取 Philips BR + web_search 巴西电商
> 数据文件：`.wx-bridge/plans/pt_ref/*.json`
> 对应语言包：`messages/pt-BR.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | Philips 巴西官网（philips.com.br） | Depiladores 分类、Lumea 产品页 |
| 2 | 巴西电商/媒体（Magazine Luiza 403，经搜索摘要确认） | "depilador a laser" 是巴西主流搜索词 |
| 3 | Google BR 搜索摘要 | "depilador IPL luz pulsada caseiro" |

**未采用**：AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。

---

## 2. 巴西葡语核心术语基准

### 2.1 产品名/类别术语

| 英文（en.json） | 巴西葡语基准 | 来源 | pt-BR.json 现状 | 处理 |
|---|---|---|---|---|
| IPL hair removal device | **depilador a laser / depilador IPL** | 巴西主流搜索词（Philips Lumea 巴西称 "depilador a laser"） | Aparelhos de Depilação IPL | 🔧 统一为 **depilador a laser / depilador IPL**（产品名语境） |
| IPL device（泛指） | **aparelho IPL / dispositivo IPL** | 技术语境通用 | aparelho IPL | ✅ 保留 |
| hair removal | **depilação / remoção de pelos** | 通用 | depilação（34 处） | ✅ 保留 |
| body hair | **pelos** | 通用 | pelos | ✅ 保留 |
| at-home / home-use | **caseiro / para uso doméstico / em casa** | 通用 | caseiro/doméstico | ✅ 保留 |

### 2.2 部件/技术术语

| 英文 | 巴西葡语基准 | pt-BR.json 现状 | 处理 |
|---|---|---|---|
| flash / flashes | **flash / flashes**（巴西通用借词）或 **pulsos de luz** | flash（46 处） | ✅ 保留（flash 是巴西标准借词） |
| flash count | **contagem de flashes** | Contagem de Flashes | ✅ 保留 |
| skin tone | **tom de pele** | tom de pele（27 处） | ✅ 保留 |
| painless | **sem dor / indolor** | sem dor（8）、indolor（3） | ⚠️ 统一 indolor（正式体） |
| lamp | **lâmpada** | lâmpada | ✅ 保留 |
| light pulse | **pulso de luz** | pulso de luz | ✅ 保留 |
| intensity | **intensidade** | intensidade | ✅ 保留 |
| glide | **deslizar** | deslizar | ✅ 保留 |
| cordless | **sem fio** | sem fio | ✅ 保留 |
| hair root | **raiz do pelo** | raiz do pelo | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **Aparelhos de Depilação IPL → depilador a laser / depilador IPL**（产品名语境）：巴西消费者搜索 "depilador a laser" 是主流。子代理复核时按语境区分：产品名 → **depilador a laser / depilador IPL**；泛指 → **aparelho IPL**。
2. **sem dor → indolor**：统一正式体。
3. 其余术语（flash、tom de pele、depilação）已符合巴西惯例，保留。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **você 尊称**（巴西 B2B 标准），动词按 você 变位。
- 禁止 "tu"（巴西标准葡语不用 tu，用 você）。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、IPL、OEM、ODM、FDA、CE、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen、Guangzhou。
- private label → **marca própria / marca privada**。

### 3.2 标点与格式
- 巴西数字：千位分隔用点（1.999.998），小数用逗号（2,5）。
- 货币：**R$**（雷亚尔）或按语境 USD；价格 "R$ 1.299" 格式。
- 百分比：**70 %**（% 前空格，葡语规范）。
- 温度：**10 °C**。
- 能量/面积：6 J/cm²、6,2 cm²。
- 引号用 **" "**（巴西用英文双引号，非 « »）。
- **HTML 标签保留**（`<b>`、`<br>`），只翻译内部文本。

### 3.3 术语一致性铁律
- IPL hair removal device → **depilador a laser / depilador IPL**（产品）/ **aparelho IPL**（泛指）
- hair removal → **depilação / remoção de pelos**；body hair → **pelos**；hair（头发）→ **cabelos**（不可混用 pelos/cabelos）
- flash → **flash**（保留）；flash count → **contagem de flashes**
- skin tone → **tom de pele**；skin → **pele**
- painless → **indolor**（不用 sem dor 长式）
- 禁止英文残留：device→aparelho/dispositivo、handset→aparelho、unit→unidade

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **Aparelhos de Depilação IPL 与 depilador a laser 混用**：需按语境区分。
2. **sem dor 与 indolor 混用**：统一 indolor。
3. **pelos/cabelos 混用风险**：body hair=pelos，头发=cabelos。
4. **flash 与 pulsos de luz 混用**：按语境统一（技术规格用 flash，描述用 pulsos de luz）。
5. **巴西与欧洲葡语差异**：pt-BR 用 você、gerúndio（-ando/-endo），pt-PT 用 tu/vós、infinitivo——不可混用。
6. `develo*` 部分保留英文（363 处与英文相同）：专有名词保留合理，其余确认。

---

## 5. 复核流程

1. 术语机械修正：无重大机械修正（flash/tom de pele 已正确），主要靠子代理语境判断。
2. 生成 EN-PT-BR 对照对（排除 [TODO]），按顶层 key 分组。
3. 子代理逐条复核：修正机翻痕迹、统一术语、检查巴西葡语特征（você、gerúndio）。
4. 合并（merge 脚本，逻辑同 merge_ko_fixes.py）。
5. 结构验证：pt-BR 叶子 = en 叶子（5422），0 缺失 0 多余。
6. `astro build` 验证 + 抽样检查 /pt-BR/ 页面。
