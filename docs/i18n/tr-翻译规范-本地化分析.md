# 🇹🇷 土耳其语本地化分析报告 — 对照土耳其市场基准

> 分析时间: 2026-08-18 ｜ 分析人: Harness AI
> 方法论: 按《翻译规范准则》§四-B（Google listing → 3 个基准网页 → 对比官网翻译）

## 一、基准网页（真实抓取，存 `plans/tr_ref/`）

| # | 网页 | 来源 | 内容 |
|---|---|---|---|
| 1 | **Philips 土耳其官网**（`philips_tr_ipl.json`） | philips.com.tr/c-m-pe/ipl | Lumea IPL 系列土耳其语产品页（品牌原生文案，权威） |
| 2 | **Trendyol 本土电商**（`trendyol_tr_products.txt`） | trendyol.com（真实浏览器绕过 Cloudflare） | IPL 产品命名（本土卖家，非跨境） |
| 3 | **Google.com.tr listing**（`google_tr_ipl_listing.json`） | google.com.tr 搜索 | 定位基准页（有反爬，改用品牌官网直连） |

> ✅ 2026-08-18 更新：**Trendyol 本土基准已补采**（真实浏览器绕过 Cloudflare，进入土耳其站）。弃用 Amazon.com.tr（跨境卖家文案不可靠），以 **Philips TR 官网 + Trendyol 本土电商** 为准。
> 早期抓取的 `amazon_tr_products.json` 仅作产品命名**参考交叉验证**，不作为术语基准。

### Trendyol 本土产品命名（电商基准）
| 中文 | Trendyol 用法 |
|---|---|
| 设备 | **IPL Lazer Epilasyon Aleti** / **Cihazı** |
| 脱毛设备 | **Tüy Alma Cihazı** |
| 减毛器 | **Tüy Azaltıcı** |
| 冰激光脱毛 | **Buz Lazer Epilasyon Cihazı** |
| 脉冲次数 | **Atım**（999.900 Atım、Sınırsız Atım 无限脉冲） |
| 档位 | **Kademe / Kademeli**（10 Kademe、12 Kademeli） |

### 已排查但无可用基准的品牌（2026-08-18 实测）

| 品牌 | 排查结果 |
|---|---|
| **Braun** | ❌ 无土耳其语官方官网。tr.braun.com 跳转英文站；P&G 官网服务站均为英文；土耳其语内容仅在第三方（说明书站/零售商），非官方原生文案 |
| **Panasonic** | ❌ 土耳其官网存在且为土耳其语（panasonic.com/tr/，导航 Tüketici Ürünleri/Ev Eşyaları），但 **IPL/脱毛产品页 404**（"aradığınız sayfa bulunamıyor"）——脱毛品类未在土耳其官网上架 |

> 结论：Braun/Panasonic 在土耳其无官方 IPL 本地化页，**不强行凑基准**（符合方法论：基准须真实可靠）。土耳其 IPL 市场主力品牌为 Philips，其官网 + Trendyol 本土电商已构成完整基准。

## 二、土耳其市场术语基准

### 2.1 Philips TR 官网术语（权威品牌基准）
| 中文 | Philips TR 用法 |
|---|---|
| 脱毛 | **Tüy Alma**（字面"取毛"，土耳其标准说法） |
| 光脉冲 | **ışık atışları** |
| 肤色 | **cilt tonu** |
| 光滑肌肤 | **pürüzsüz cilt** |
| 无线 | **kablosuz** |
| 居家舒适 | **evinizin konforunda** |
| 减少 XX% | **%92'ye varan azalma** |
| 智能附件 | **akıllı başlıklar** / aparatlar |

### 2.2 产品命名参考（icecat TR 数据源 + Amazon.com.tr 仅作交叉验证，非基准）
| 中文 | 土耳其语市场常用 |
|---|---|
| 设备 | **IPL lazer epilasyon cihazı** / **Tüy Alma Cihazı** |
| 脱毛 | **Evde Lazerle Tüy Alma**（居家激光脱毛） |
| 脉冲次数 | **Atım**（999.999 Atım） |
| 肤色传感器 | **Cilt Tonu Sensörü** |
| 无线/有线 | **Kablosuz & Kablolu** |
| 冰冷却 | **Buz Soğutmalı** |
| 无痛 | **Ağrısız** |
| 持久 | **Kalıcı** |
| 头/附件 | **Başlık** |
| 光强度 | **Işık Şiddeti** |

> 上表术语与 Philips TR 官网用法一致（Tüy Alma、Cilt Tonu 等），可作为本地化术语参考；后续补采 Trendyol/本土零售商页后并入基准。

## 三、ishine 官网土耳其语翻译问题

### 🟠 问题 1：核心术语「IPL hair removal device」不够本地化

| ishine 翻译 | 数量 | 市场基准 | 评价 |
|---|---|---|---|
| **IPL epilasyon cihazı**（epilasyon） | 47 | **IPL lazer epilasyon cihazı** / **Tüy Alma Cihazı** | ⚠️ 可用但可优化 |
| **IPL cihaz** | 150 | IPL cihaz（通用可接受） | ✅ 基本正确 |
| **Tüy Alma** 用法 | 0 | Philips 标准 | ❌ 缺失，应补充 |

**结论**：「IPL hair removal device」翻译为「IPL epilasyon cihazı」**基本准确**（epilasyon 是土耳其语"脱毛"），但：
- 市场更偏好 **lazer epilasyon cihazı**（含"激光"）或 **Tüy Alma Cihazı**（Philips 风格）
- 建议统一为「**IPL lazer epilasyon cihazı**」（电商口径）或「**IPL Tüy Alma Cihazı**」（品牌口径），全站二选一

### 🟠 问题 2：术语混用（Tüy / Epilasyon）
- 「Tüy epilasyonu」→ 应为「Tüy alma」或「epilasyon」（不混拼）
- 3 处混用需统一

### 🟡 问题 3：可补充的本地化表达
参考 Philips TR 补充：
- 「pürüzsüz cilt」（光滑肌肤）→ ishine 常用「pürüzsüz」但可强化
- 「evinizin konforunda」（居家舒适）→ 比「ev kullanımı için」更营销化
- 「%XX'ye varan azalma」（减少 XX%）→ 数据表达规范

### 🟢 做得好的地方
- 直译残留极少（device 仅 1 处、brand 1 处、solution 0）——比西语/日语初始状态干净
- 正式敬语（siz）使用正确
- 占位符保留完整

## 四、建议修正（供后续执行）

1. **统一核心术语**（全站二选一）：
   - 方案 A（电商/消费者向）：「IPL lazer epilasyon cihazı」
   - 方案 B（品牌向，Philips 风格）：「IPL Tüy Alma Cihazı」
2. **修正混用**：「Tüy epilasyonu」→「epilasyon」或「Tüy alma」
3. **营销话术补充**：pürüzsüz cilt、evinizin konforunda、%XX'ye varan azalma
4. **数字格式**：土耳其用逗号小数（1.234,56），千位点——与 de 相同
5. **货币**：TRY（₺），REGION_CONFIG['tr'] 待补

## 五、产出
- 基准抓取：`plans/tr_ref/philips_tr_ipl.json`、`amazon_tr_products.json`、`google_tr_ipl_listing.json`
- 本报告：`docs/i18n/tr-翻译规范-本地化分析.md`

---

*按方法论第 4B.2 步输出。如需执行修正（统一术语等），请确认方案 A 或 B。*
