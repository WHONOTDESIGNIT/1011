# 希伯来语（he）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-20 · 调研方法：真实浏览器 CDP 抓取 philips.co.il、silkn.co.il + web_search
> 数据文件：`.wx-bridge/plans/he_ref/*.json`
> 对应语言包：`messages/he.json`（5422 叶子，结构已对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | [Philips 以色列官网 Lumea IPL](https://www.philips.co.il/c-m-pe/ipl)（CDP 实抓） | מכשירי אפילציה（脱毛仪）、הסרת שיער（脱毛）、טיפוח（护理）、טיפולי הסרת שיער（脱毛护理） |
| 2 | [Silk'n 以色列站 silkn.co.il](https://silkn.co.il)（CDP 实抓 + 官方 PDF 手册） | הבזק האור（光闪）、מוצרים（产品）、צור קשר（联系我们） |
| 3 | 希伯来语维基百科惯例 | שנג'ן（深圳音译标准，带撇号） |

**未采用**：AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。Amazon 仅作交叉核验。

---

## 2. 希伯来语核心术语基准

### 2.1 产品名/类别术语

| 英文（en.json） | 希伯来语基准 | he.json 现状 | 处理 |
|---|---|---|---|
| IPL hair removal device | **מכשיר IPL להסרת שיער** | מכשיר IPL להסרת שיער（主流） | ✅ 保留 |
| IPL | **IPL**（拉丁原样，Philips IL 同） | IPL（547 处） | ✅ 保留 |
| hair removal | **הסרת שיער** | הסרת שיער（47 处） | ✅ 保留 |
| epilation device | **מכשיר אפילציה** | אפילציה（1 处） | ✅ 保留 |
| at-home / home use | **ביתי / לשימוש ביתי** | ביתי | ✅ 保留 |
| body hair | **שיער גוף** | — | 子代理语境处理 |

### 2.2 部件/技术术语

| 英文 | 希伯来语基准 | he.json 现状 | 处理 |
|---|---|---|---|
| flash / flashes | **הבזק / הבזקים**（Philips/零售商惯例） | הבזק（53 处） | ✅ 保留 |
| flash count | **מספר הבזקים / ספירת הבזקים** | מספר הבזקים | ✅ 保留 |
| xenon flash lamp | **מנורת פלאש קסנון**（固定搭配，保留 פלאש） | מנורת פלאש קסנון（2 处） | ✅ 保留 |
| skin tone | **גוון עור** | גוון עור（22 处） | ✅ 保留 |
| painless | **ללא כאב** | ללא כאב（9 处） | ✅ 保留 |
| sapphire | **ספיר**（宝石名） | ספיר（61 处） | ✅ 保留 |
| Sapphire Cooling | **קירור ספיר** | קירור ספיר | ✅ 保留 |
| intensity / power level | **עוצמה / רמת עוצמה** | עוצמה（16 处） | ✅ 保留 |
| lamp | **מנורה** | מנורה | ✅ 保留 |
| light pulse | **פולס אור** | פולס | 子代理语境处理 |
| semiconductor | **מוליך למחצה** | — | 子代理语境处理 |

### 2.3 校正结论（本轮必须修正）

1. **שנזן → שנג'ן**（11 处）：深圳音译统一为希伯来语标准带撇号形式 שנג'ן（与 teamPage 既有 6 处一致，参照希伯来维基百科）。
2. 其余术语已符合以色列本地惯例（IPL 拉丁原样、הבזק、גוון עור、ספיר 均正确），无需机械修正。
3. 主要依赖子代理语境复核（RTL 排版、动词语态、机翻痕迹、数字格式）。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 现代希伯来语**无敬称/亲称的语法区分**（无 T-V 对立），全站使用中性自然表达即可，无需礼貌体换算。
- 希伯来语 RTL（从右到左）书写；保持标点与括号位置符合希伯来惯例。
- 专有名词保留英文原样：iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden、Helix、Hebe、Eirene、IPL、OEM、ODM、FDA、CE、MDR、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 编号、Shenzhen 地名相关英文品牌名、Magento、Shopify、Hyva、DDEV。
- Dropshipping → **דרופשיפינג**（希伯来语音译）或保留英文均可，全站统一即可（子代理决定后统一）。

### 3.2 标点与格式
- 数字：**西方数字 + 逗号千分位**（以色列惯例，同英文），如 999,999 / 1,999,998；小数用点号。
- 货币：**₪（新谢克尔）** 或 USD。
- 百分比：**%**（置于数字后）。
- 引号：希伯来语常用 ״...״（双引号），与英文直引号混用时保持原文格式。

---

## 4. 待子代理复核的重点区块

| 区块 | 复核重点 |
|---|---|
| develoContent / develoCore / develoSocial | Magento/Shopify 语境、营销话术的自然度、MDSAP 专名 |
| productDetail | 产品功能名（Sapphire/ice cooling/dual lamp）一致性、规格数值格式 |
| auxPages FAQ | 术语一致性（הבזק/גוון עור/ללא כאב）、口语自然度 |
| aboutPages / teamPage | 公司简介、深圳地名（שנג'ן）、时间线年份格式 |
| home / homepage | 营销标题的自然度、双灯/闪光寿命数值 |
| legal（cookieConsent、隐私相关） | 法律术语准确度（按以色列惯例） |

> 注：blog 区块按用户指令**不纳入本轮校准**（不生成 blog_pair）。
