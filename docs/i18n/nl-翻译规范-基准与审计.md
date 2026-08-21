# 荷兰语（nl）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-18 · 调研方法：真实浏览器抓取 Philips NL + Google NL listing
> 数据文件：`.wx-bridge/plans/nl_ref/*.json`
> 对应语言包：`messages/nl.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | Philips 荷兰官网（philips.nl） | Lumea IPL ontharingsapparaat 官方页 |
| 2 | Google NL listing | "IPL ontharen apparaat thuis" 荷兰主流搜索 |
| 3 | Coolblue（荷兰最大电器零售商） | "Wat is het verschil tussen laser en IPL ontharing?" |

**未采用**：AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。

---

## 2. 荷兰语核心术语基准

### 2.1 产品名/类别术语

| 英文（en.json） | 荷兰语基准 | 来源 | nl.json 现状 | 处理 |
|---|---|---|---|---|
| IPL hair removal device | **IPL-ontharingsapparaat** | Philips：*"Ons beste Lumea IPL ontharingsapparaat"*；Coolblue：*"IPL-apparaat"* | IPL-ontharingsapparaten（42 处） | ✅ 保留 |
| IPL device（泛指） | **IPL-apparaat** | Google：*"een IPL apparaat te bedienen"* | IPL-apparaat（73 处） | ✅ 保留 |
| hair removal | **ontharen / ontharing** | Philips/Coolblue | onthar（42 处） | ✅ 保留 |
| at-home | **thuis / voor thuis** | Philips：*"zelf thuis ontharen"* | thuis（39 处） | ✅ 保留 |

### 2.2 部件/技术术语

| 英文 | 荷兰语基准 | 来源 | nl.json 现状 | 处理 |
|---|---|---|---|---|
| flash / flashes | **flits / flitsen** | 通用 | flitsen（正确） | ✅ 保留 |
| flash count | **aantal flitsen** | 通用 | Aantal flitsen | ✅ 保留 |
| skin tone | **huidtint** | Philips：*"Controleer jouw haarkleur en huidtint"* | huidtint（7）、huidskleur（8） | ⚠️ 统一 **huidtint**（Philips 官方） |
| skin | **huid** | 通用 | huid | ✅ 保留 |
| painless | **pijnloos** | 通用 | pijnloos | ✅ 保留 |
| hair | **haar** | 通用 | haar | ✅ 保留 |
| light pulse | **lichtpuls / lichtimpuls** | 通用 | puls | ✅ 保留 |
| intensity | **intensiteit** | 通用 | intens | ✅ 保留 |
| glide | **glijden** | 通用 | glijden | ✅ 保留 |
| cordless | **draadloos** | 通用 | draadloos | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **huidskleur → huidtint**（8 处）：Philips NL 官方用 **huidtint**。子代理统一。
2. 其余术语（ontharingsapparaat、flitsen、pijnloos、thuis）已符合荷兰惯例，保留。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **u 尊称**（荷兰 B2B 标准），动词按 u 变位；避免 "je/jij" 亲称（消费者品牌可用，B2B 用 u）。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、IPL、OEM、ODM、FDA、CE、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen、Guangzhou。
- private label → **eigen merk / private label**（B2B 常用 private label）。

### 3.2 标点与格式
- 荷兰数字：千位分隔用点（1.999.998）或空格，统一为点；小数用逗号（2,5）。
- 货币：**€**；价格 "€1.299" 格式。
- 百分比：**70 %**（% 前空格，荷兰规范）。
- 温度：**10 °C**。
- 引号用 **" "**。
- **HTML 标签保留**（`<b>`、`<br>`），只翻译内部文本。

### 3.3 术语一致性铁律
- IPL hair removal device → **IPL-ontharingsapparaat**（产品）/ **IPL-apparaat**（泛指）
- hair removal → **ontharen / ontharing**；body hair → **lichaamshaar**；hair（头发）→ **haar**
- flash → **flits**（不可用 "flash" 音译）；flash count → **aantal flitsen**
- skin tone → **huidtint**（不用 huidskleur）；skin → **huid**
- painless → **pijnloos**
- 禁止英文残留：device→apparaat、handset→apparaat、unit→apparaat

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **huidskleur/huidtint 混用**（8 处 huidskleur）：统一 huidtint。
2. **je/jij 亲称混用**：B2B 用 u，需检查。
3. **荷兰语复合词拼写**：ontharingsapparaat、huidtint 等复合词连写正确。
4. **英文语序残留**。
5. `develo*` 部分保留英文（446 处与英文相同）：专有名词保留合理，其余确认。

---

## 5. 复核流程

1. 术语机械修正：huidskleur → huidtint（无歧义替换）。
2. 生成 EN-NL 对照对（排除 [TODO]），按顶层 key 分组。
3. 子代理逐条复核（每次最多 2 个并发）：修正机翻痕迹、统一术语、检查 je/u。
4. 合并（merge_lang_fixes.py）。
5. 结构验证：nl 叶子 = en 叶子（5422），0 缺失 0 多余。
6. `astro build` 验证 + 抽样检查 /nl/ 页面。
