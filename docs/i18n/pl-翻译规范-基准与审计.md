# 波兰语（pl）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-18 · 调研方法：真实浏览器抓取 Philips PL + Google PL listing
> 数据文件：`.wx-bridge/plans/pl_ref/*.json`
> 对应语言包：`messages/pl.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | Philips 波兰官网（philips.pl） | "Depilacja światłem w domu: jak działa IPL?" 官方文章 |
| 2 | Google PL listing | "depilator IPL światło impulsowe" 波兰主流搜索 |
| 3 | 波兰本地网站：Silk'n PL（silkn.pl）、NEONET（neonet.pl） | 消费者语感验证 |

**未采用**：AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。

---

## 2. 波兰语核心术语基准

### 2.1 产品名/类别术语

| 英文（en.json） | 波兰语基准 | 来源 | pl.json 现状 | 处理 |
|---|---|---|---|---|
| IPL hair removal device | **depilator IPL** | Google PL 主流搜索词；Silk'n：*"Jak działa depilator IPL"* | urządzeń IPL do usuwania owłosienia | 🔧 统一为 **depilator IPL**（产品名语境） |
| IPL device（泛指） | **urządzenie IPL** | NEONET：*"Depilator Intense Pulse Light"* | urządzenie IPL | ✅ 保留（泛指语境） |
| hair removal | **usuwanie owłosienia / depilacja** | Philips PL：*"Stopniowo ogranicza odrastanie włosów"* | usuwanie owłosienia（正确） | ✅ 保留 |
| body hair | **owłosienie / włosy** | 通用 | owłosienie | ✅ 保留 |

### 2.2 部件/技术术语

| 英文 | 波兰语基准 | 来源 | pl.json 现状 | 处理 |
|---|---|---|---|---|
| flash / flashes | **błysk / błyski** | Google：*"krótki impuls światła"*；Silk'n | błysk（3 处） | ✅ 保留 |
| flash count | **liczba błysków** | 通用 | Liczba błysków | ✅ 保留 |
| light pulse | **impuls światła** | Philips PL：*"delikatnych impulsów światła"* | impuls | ✅ 保留（impuls światła 更完整） |
| skin tone | **odcień skóry** | 通用 | odcień skóry | ✅ 保留 |
| painless | **bezbolesny** | 通用 | bezbolesn（10 处） | ✅ 保留 |
| hair follicle | **mieszek włosowy** | Philips PL：*"mieszków włosowych"* | mieszek włosowy | ✅ 保留 |
| regrowth | **odrastanie włosów** | Philips PL：*"odrastanie włosów"* | odrastanie | ✅ 保留 |
| lamp | **lampa** | 通用 | lampa | ✅ 保留 |
| intensity | **intensywność** | 通用 | intensywność | ✅ 保留 |
| glide | **przesuwanie / przesuwać** | 通用 | przesuw | ✅ 保留 |
| cordless | **bezprzewodowy** | 通用 | bezprzewodowy | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **urządzenie IPL do usuwania owłosienia → depilator IPL**（产品名语境）：波兰消费者搜索 "depilator IPL" 是主流。子代理按语境区分：产品名 → **depilator IPL**；泛指 → **urządzenie IPL**。
2. 其余术语（błysk、odcień skóry、usuwanie owłosienia、mieszek włosowy）已正确，保留。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **Pan/Pani 尊称**（波兰 B2B 标准）或动词不定式 CTA；避免 "ty" 亲称。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、IPL、OEM、ODM、FDA、CE、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen、Guangzhou。
- private label → **marka własna / prywatna marka**。

### 3.2 标点与格式
- 波兰数字：千位分隔用空格（1 999 998）或点（1.999.998），统一为空格；小数用逗号（2,5）。
- 货币：**zł**（兹罗提）或按语境 USD；价格 "1 299 zł" 格式。
- 百分比：**70 %**（% 前空格，波兰规范）。
- 温度：**10 °C**。
- 能量/面积：6 J/cm²、6,2 cm²。
- 引号用 **" "**（波兰用英文双引号）。
- **HTML 标签保留**（`<b>`、`<br>`），只翻译内部文本。

### 3.3 术语一致性铁律
- IPL hair removal device → **depilator IPL**（产品）/ **urządzenie IPL**（泛指）
- hair removal → **usuwanie owłosienia / depilacja**；body hair → **owłosienie**；hair（头发）→ **włosy**（语境区分）
- flash → **błysk**（不可用 "flash" 音译）；flash count → **liczba błysków**
- skin tone → **odcień skóry**；skin → **skóra**
- hair follicle → **mieszek włosowy**；regrowth → **odrastanie włosów**
- painless → **bezbolesny**
- 禁止英文残留：device→urządzenie、handset→urządzenie、unit→urządzenie

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **urządzenie IPL do usuwania owłosienia 直译**（78 处 urządzenie）：产品名必须 depilator IPL。
2. **flash 残留**（3 处）：统一 błysk。
3. **ty/Pan 混用**：需检查无 ty 亲称。
4. **波兰语格变化错误**：形容词与名词性数格配合（波兰语 7 格）。
5. **英语语序残留**：波兰语介词短语位置。
6. `develo*` 部分保留英文（375 处与英文相同）：专有名词保留合理，其余确认。

---

## 5. 复核流程

1. 术语机械修正：urządzenie IPL do usuwania owłosienia → depilator IPL（产品名完整短语）。
2. 生成 EN-PL 对照对（排除 [TODO]），按顶层 key 分组。
3. 子代理逐条复核：修正机翻痕迹、统一术语、调整波兰语语序、检查 ty/Pan。
4. 合并（merge_lang_fixes.py）。
5. 结构验证：pl 叶子 = en 叶子（5422），0 缺失 0 多余。
6. `astro build` 验证 + 抽样检查 /pl/ 页面。
