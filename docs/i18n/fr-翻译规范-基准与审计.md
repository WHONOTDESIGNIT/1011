# 法语（fr）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-18 · 调研方法：真实浏览器（headless Edge CDP）抓取法国本地页面 + Google FR listing
> 数据文件：`.wx-bridge/plans/fr_ref/*.json`
> 对应语言包：`messages/fr.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 抓取文件 | 说明 |
|---|---|---|---|
| 1 | Philips 法国官网（philips.fr） | `philips_fr_ipl.json`、`philips_fr_lumea.json` | Lumea 官方法语页，术语权威 |
| 1 | Braun 法国官网（fr.braun.com） | `google_braun_fr.json`（搜索结果含官方页描述） | Silk·expert Pro 5 官方法语页 |
| 2 | Google FR listing | `google_fr_listing.json`、`google_philips_fr.json` | "épilateur à lumière pulsée IPL domicile" 等法语搜索 |
| 3 | 法国本地媒体 | Vogue France、Adonisse（dermatologue 博客） | 消费者语感验证 |

**未采用**：AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。

---

## 2. 法语核心术语基准（权威：Philips FR + Braun FR 官网）

### 2.1 产品名/类别术语

| 英文（en.json） | 法语基准 | 来源 | fr.json 现状 | 处理 |
|---|---|---|---|---|
| IPL hair removal device | **épilateur à lumière pulsée** | Philips：*"Notre épilateur à lumière pulsée Lumea"*；Braun：*"L'épilateur à lumière pulsée Braun Silk·expert Pro 5"* | appareil IPL（53 处） | 🔧 术语统一为 **épilateur à lumière pulsée**（产品语境） |
| IPL device（泛指） | **appareil IPL** / **appareil à lumière pulsée** | Philips 文章：*"si l'appareil IPL fonctionne correctement"* | appareil IPL | ✅ 保留（appareil IPL 也是官方用法） |
| home-use / at-home | **à domicile** | Philips：*"votre esthéticienne personnel à domicile"*；Google：*"Les appareils IPL à domicile"* | à domicile（14 处） | ✅ 保留；避免 "à la maison"（仅口语） |
| light pulse / lumière pulsée | **lumière pulsée** / **lumière intense pulsée (IPL)** | Philips：*"épilateur à lumière pulsée"*；Braun：*"L'IPL, lumière intense pulsée"* | lumière pulsée | ✅ 保留 |

### 2.2 部件/技术术语

| 英文 | 法语基准（官方） | 来源原文 | fr.json 现状 | 处理 |
|---|---|---|---|---|
| flash / flashes | **impulsions lumineuses** / **flashs** | Philips：*"émet de douces impulsions lumineuses"* | flash（40 处） | ⚠️ 统一语境：次数语境用 **impulsions**，技术词 flash 可保留但优先 impulsions |
| flash count | **nombre d'impulsions** | Philips 同源 | nombre de flashs | 🔧 统一为 **nombre d'impulsions** |
| skin tone | **teint de la peau** / **teint** | Braun：*"analyse en continu le teint de la peau"* | teint（26 处） | ✅ 保留 teint（官方用词） |
| lamp | **lampe** | 通用 | lampe | ✅ 保留 |
| hair root | **racine du poil** | 通用 | racine du poil | ✅ 保留 |
| hair regrowth | **repousse des poils** | Philips：*"empêcher la croissance des poils"* | repousse | ✅ 保留（croissance des poils / repousse 均可） |
| painless | **indolore** | Google/Vogue：*"moins douloureuse"*、*"sans douleur"* | sans douleur（8）、indolore（3） | 🔧 统一 **indolore**（正式体，B2B） |
| smooth skin | **peau douce et lisse** | Philips：*"une peau douce et lisse"* | peau douce | 🔧 统一为 **peau douce et lisse** 或保持简洁 peau douce |
| glide | **faire glisser** | 通用 | glisser | ✅ 保留（动词 faire glisser） |
| intensity | **intensité** | 通用 | intensité | ✅ 保留 |
| energy level | **niveau d'énergie** | 通用 | niveau d'énergie | ✅ 保留 |
| cordless | **sans fil** | 通用 | sans fil | ✅ 保留 |
| at-home protocol | **protocole à domicile** | 通用 | protocole à domicile | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **appareil IPL → épilateur à lumière pulsée**（产品名语境）：Philips/Braun 官方产品名是 **épilateur à lumière pulsée**。fr.json 中 53 处 "appareil IPL" 需按语境区分：
   - 产品名语境（"IPL hair removal device"）→ **épilateur à lumière pulsée**
   - 技术组件/泛指语境（"IPL device"）→ **appareil IPL**（保留）
2. **flash → impulsions lumineuses**（闪光次数语境）：Philips 官方用 *"impulsions lumineuses"*。fr.json 40 处 flash 需按语境统一。
3. **sans douleur → indolore**：统一正式体。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **vous 尊称**（法语 B2B 标准，与 Philips/Braun 官网一致），动词按 vous 变位（-ez 结尾）。
- 避免 "tu" 亲称（消费者品牌可用 tu，B2B 制造商一律 vous）。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、IPL、OEM、ODM、FDA、CE、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen、Guangzhou。
- 行业术语：private label → **marque de distributeur (MDD)** 或 **marque privée**（保留 "private label" 亦可，B2B 通用）；供应链/制造术语保留行业惯用（FOB、CIF、SKU、MOQ）。

### 3.2 标点与格式
- 法语数字：千位分隔用 **空格**（非逗号）：*"1 999 998"*；小数用逗号 *"2,5"*。
- 货币：**€** 符号后接数字（*"€40"*）或数字后接 *" €"*，统一为 Philips 官网样式 *"34,95 €/mois"*。
- 百分比：*"70 %"*（% 前空格，法语规范）。
- 温度：*"10 °C"*（° 前空格）或 *"10°C"*，统一用 *"10 °C"*。
- 长度/能量：*"6 J/cm²"* 保留。
- **HTML 标签保留**（`<b>`、`<br>`），只翻译内部文本。
- 引号：法语用 **« »**（书名号），不用英文双引号。

### 3.3 术语一致性铁律
- IPL hair removal device → **épilateur à lumière pulsée**（产品）/ **appareil IPL**（泛指）
- hair removal → **épilation**（不可用 "dépilation"——dépilation 是临时性脱毛（蜡/剃），épilation 才是永久性/IPL 语境！**这是法语大坑**）
- body hair → **poils**（复数）；hair（头发）→ **cheveux**（不可混用）
- skin → **peau**；skin tone → **teint de la peau / teint**
- flash → **impulsion (lumineuse)**；flash count → **nombre d'impulsions**
- painless → **indolore**；无痛体验 → **expérience indolore**
- 禁止 "dépilation" 用于 IPL 语境（语义错误）
- 禁止英文残留：device→appareil、handset→appareil/boîtier、unit→unité

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **dépilation 误用**：需全库检查——IPL 语境必须 épilation，dépilation 仅限蜡/剃临时脱毛。
2. **flash 残留**（40 处）：需按语境统一为 impulsions/impulsions lumineuses。
3. **appareil IPL 与 épilateur à lumière pulsée 混用**（53 处）：需按语境区分。
4. **sans douleur 与 indolore 混用**：统一 indolore。
5. **英语语序/长句残留**：法语修饰语后置（名词+形容词），检查 "appareil IPL" 之类定语位置。
6. **"à la maison" 口语化**：统一 à domicile（B2B）。
7. `develo*` 部分保留英文（436 处与英文相同）：专有名词/品牌保留合理，其余确认。

---

## 5. 复核流程

1. 术语机械修正（本轮）：dépilation→épilation（IPL 语境）、flash→impulsions 等。
2. 生成 EN-FR 对照对（排除 [TODO]），按顶层 key 分组。
3. 子代理逐条复核：修正机翻痕迹、统一术语、调整法语语序、处理 vous 尊称。
4. 合并（merge 脚本，逻辑同 merge_ko_fixes.py）。
5. 结构验证：fr 叶子 = en 叶子（5422），0 缺失 0 多余。
6. `astro build` 验证 + 抽样检查 /fr/ 页面。
