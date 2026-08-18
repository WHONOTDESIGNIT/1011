# 🇩🇪 德语本地化分析报告 — 对照德语市场基准

分析时间: 2026-08-18
分析人: Harness AI

## 一、核心结论（必须先说明）

**ishine 官网（iplmanufacturer.com）目前没有德语版本**：
- ❌ 无 `messages/de.json`（德语翻译文件不存在）
- ❌ `SUPPORTED_LANGUAGES` 无 `de`（仅 19 种：en/tr/ro/ar/es/fr/ru/he/fa/el/pt-BR/nl/id/th/pl/ja/ko/cs/vi）
- ❌ `LANGUAGE_CONFIG` 无 de 条目（未接入语言体系）
- ⚠️ 语言切换器有残留 `locale_de: Deutsch` 标签（en.json 里的死标签，无实际功能）
- ✅ git 历史无 de.json 记录；`messages/work` 有 it（意大利语）在开发，但无 de

**因此本次无法"修正"现有德语翻译（不存在）**——正确动作是**从零创建 de.json 并接入**。以下提供完整方案。

---

## 二、德语本地化基准（真实抓取）

### 参考网页（markdown 已生成 `plans/de_ref/`）
1. **chip.de IPL-Geräte Praxistest**（`chip-de-ipl-test.md`）— 德国头部消费者评测媒体
2. **Amazon.de IPL haarentfernung**（`amazon_de_ipl.html`）— 德国最大电商
3. **Braun DE 官网**（`braun_de_silkexpert.json`）— 德国本土品牌
4. **Philips.de Lumea IPL**（`philips_de_ipl.json`，Google.de listing 定位）— Philips 德国官网
5. **Google.de 搜索 listing**（`google_de_ipl_listing.json`）— 方法论示范（Google 搜索 → 3 个基准网页）

> 补充：Google.de 搜索「IPL Haarentfernung Gerät Philips Braun」定位到 Braun 官网（shop.braun.de/ipl）、Philips 官网（philips.de/c-m-pe/ipl）、MediaMarkt.de 三个基准页。

### Philips.de Lumea 页面术语补充（消费者页 du 语域）
| 术语 | Philips.de 用法 |
|---|---|
| 光脉冲 | **Lichtimpulse** |
| 减毛 | **Haarreduktion**（"über 80 % Haarreduktion"） |
| 丝滑肌肤 | **seidig-glatter Haut** |
| 脱毛护理 | **Haarentfernungsbehandlungen** |
| 毛发静止期 | **in die Ruhephase versetzen** |
| 临床证实 | **Klinisch erwiesen** |
| 敬语 | **du/dein**（消费者页亲近式："dein persönlicher Coach"、"erlebst du"） |

> ⚠️ 敬语区分：Philips/Braun **消费者页用 du**；B2B 制造语境（ishine 官网）用 **Sie**。两者都正确，按页面定位选择。

### 德语市场标准术语表（对照基准）

| 中文 | 德语标准（市场） | 机器翻译常见错误 |
|---|---|---|
| IPL 设备（产品） | **IPL-Gerät** / **Haarentfernungsgerät** | "IPL device" 直译（错误保留英文） |
| 脱毛器（家用） | **Haarentferner** | "Epilator"（混淆，Epilator 是拔毛器） |
| 持久脱毛 | **dauerhafte Haarentfernung** | "permanente Haarentfernung"（过强承诺） |
| 减毛（科学说法） | **Haarreduktion** | "Haarentfernung"（不够准确） |
| 光脉冲 | **Lichtblitze** / **Lichtimpulse** | "Lichtpulse"（生造词） |
| 毛囊 | **Haarfollikel** | 直译 |
| 光滑肌肤 | **glatte Haut** | "glatte Haut" ✅ |
| 美容院 | **Kosmetikstudio** | "Schönheitssalon"（偏美容沙龙） |
| 肤色/肤质 | **Hauttyp** | "Hautfarbe"（只指颜色） |
| 适用于身体/面部 | **für Körper, Gesicht** | |
| 效果因人而异 | **Ergebnisse können variieren** | |
| 治疗/护理 | **Behandlung** | "Therapie"（偏医疗） |
| IPL 全称 | **Intensives Pulslicht** | 保留英文 "Intense Pulsed Light" |

### chip.de 典型德语表达（消费者语言）
- "Glatte Haut ohne Kosmetikstudio: IPL-Geräte versprechen eine lang anhaltende Haarreduktion bequem zu Hause."（在家轻松实现持久减毛）
- "hochenergetische Lichtblitze, um Haarfollikel zu erhitzen"（高能光脉冲加热毛囊）
- "für die Anwendung am ganzen Körper geeignet"（适用于全身）
- "Beachten Sie bitte, dass sich dies bei Ihnen anders gestalten kann"（请注意您的体验可能不同）

---

## 三、de.json 创建方案（待确认执行）

### 技术步骤
1. 以 `en.json`（59 顶层 key，3651 条）为模板生成 `de.json`
2. 按上表术语表 + chip.de/Amazon.de 语言习惯翻译全部条目
3. 接入 i18n：
   - `astro/src/config/i18n.ts`：SUPPORTED_LANGUAGES 加 `"de"`、LANGUAGE_CONFIG 加 de 条目（flag、nativeName "Deutsch"、enabled）
   - `astro/src/lib/i18n.ts`：import de.json + messagesByLocale 注册
   - `messages/de.json`：创建
4. 构建验证（19→20 语言）

### 翻译质量要求（避免西语/日语踩过的坑）
- **术语统一**：IPL-Gerät / Haarentfernungsgerät 全站一致
- **敬语**：德语用 Sie（正式）或 du（亲近）——B2B 建议 Sie，与德国本土制造网站一致
- **复合词**：德语复合名词（Haarentfernungsgerät、Lichtimpulse）正确拼写
- **否定句式**：德语否定用 "nicht" 位置正确（机器翻译常错）
- **冠词/格**：der/die/das + 四格变化正确（机器翻译高频错误点）
- **避免直译**：不保留 "device/brand/solution" 英文词

---

## 四、产出文件
- `plans/de_ref/chip-de-ipl-test.md`（chip.de 评测全文）
- `plans/de_ref/amazon_de_ipl.html`（Amazon.de 产品列表）
- `plans/de_ref/braun_de_silkexpert.json`（Braun DE 官网）
- 本报告

---

本报告由 Harness AI 生成（真实抓取德语市场基准 + 项目现状核查）
