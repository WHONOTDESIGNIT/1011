# 🌐 多语种翻译规范准则（Translation Style Guide）

> 适用项目：iShine Technology 官网（iplmanufacturer.com，Astro + Netlify）
> 版本：v1.0（2026-08-18）
> 用途：**所有语言翻译工作的唯一权威规范**。新增/修订任何语言包（messages/*.json）必须遵循本文档。
> 关联文档：`docs/I18N_DEV_GUIDE.md`（技术接入 6 处联动）、`docs/i18n/es|ja|de-翻译规范-*.md`（各语言详细审计）

---

## 一、通用翻译铁律（所有语言）

### 1.1 结构规范
1. **键结构必须与 `messages/en.json` 完全一致**（59 顶层 key / 5422 叶子 / 122 数组），0 缺失 / 0 多余。
2. **占位符必须原样保留**：`{companyName}` `{productName}` `{count}` `{name}` `{title}` `{total}` `{shown}` `{index}` `{firstQty}` `{lastQty}` `{lastPrice}` `%s` `%d`。
3. **品牌名与缩写保留不译**：iShine、Lumi、Venus、Hestia、Alpha、Emerald、Euno、Themis、Hebe、Helix、Eirene、Golden Luxury、IPL、OEM/ODM、FDA、CE、MDSAP、MOQ、ISO 13485。
4. **[TODO] 骨架值**：未完成翻译的叶节点用 `[TODO]` 标记，禁止删除；英文源为 [TODO] 时对应语言保留 [TODO]。
5. **develo\* 开发段**：`de` 语言按决策保留英文；其他语言可翻译（历史做法），但新增语言建议保留英文（develo 为开发模板页）。

### 1.2 质量铁律
6. **禁止机器直译**：不保留英文单词（device/brand/solution/partnership 等）、不直译英文句式（"that scale"、"can be"、"in order to" 等）。
7. **术语统一**：核心术语（IPL device、hair removal、light pulse、cooling、private label 等）必须使用各语言规范术语（见下），全站一致。
8. **敬语一致**：同一语言内敬语体系全站统一（正式/亲近二选一，不得混用）。
9. **本地化数字/日期/货币**：使用各语言规范格式（见 §3），禁止硬编码中英文格式。
10. **占位符上下文**：翻译必须与占位符语境匹配（{count} 单复数、{productName} 品牌名）。

---

## 二、各语言核心规范速查

### 2.1 🇬🇧 English（基准）
- 货币 USD、数字 1,234.56、日期 2026-08-18
- 简洁商务英语（B2B 制造语境）

### 2.2 🇪🇸 Español（西班牙语，es-ES）
- **术语**：IPL hair removal device → **depiladora IPL**（产品语境）；marca blanca（私人品牌，不用 "marca propia"）
- **敬语**：统一 **tú 亲近式**（Contacta con nuestro equipo，不用 "Contacte"）；法律/隐私页可保留 usted
- **性别一致**：depiladora 为阴性，冠词/形容词必须阴性（la depiladora、las depiladoras、una depiladora）
- **命令式**：tú 命令式（Contacta、Descubre、Elige、Obtén、Ponte、Suscríbete），句首大写
- **机翻痕迹修正**：避免 "a nivel de"（→ por/en）、"de que" 从句冗余、动词名词化
- 详细见 `docs/i18n/es-翻译规范-语言风格审计.md`

### 2.3 🇯🇵 日本語（日语，ja）
- **核心术语**：IPL hair removal device → **光エステ脱毛器**（Panasonic 市场叫法，不用 "IPLデバイス" 片假名直译）
- **IPL 技术词**：保留片假名（IPL、アタッチメント、クーリング、サファイア）
- **商业概念用汉字**：パートナーシップ→提携、ラグジュアリー→高級感（避免过度片假名）
- **营销话术本土化**：「こんなお悩みに」「使い続けるほどラクに」（参考 Panasonic スムースエピ 页面）
- **认证标注**：【当社調べ】【効果には個人差があります】
- 详细见 `docs/i18n/ja-翻译规范-语言风格审计.md`

### 2.4 🇩🇪 Deutsch（德语，de-DE）
- **核心术语**：IPL hair removal device → **IPL-Gerät / IPL-Haarentfernungsgerät**（不直译 "IPL device"）；Haarentfernung（脱毛）/ Haarreduktion（减毛）；Lichtimpulse/Lichtblitze（光脉冲）；Haarfollikel（毛囊）；glatte Haut（光滑肌肤）
- **敬语**：正式 **Sie** 形式（Kontaktieren Sie unser Team）
- **语法**：名词大写（Substantive großschreiben）；复合词正确拼写（Haarentfernungsgerät）；连字符规则
- **数字**：逗号小数 + 千位点（1.234,56）；日期 DD.MM.YYYY（18.08.2026）；时间 24 小时制
- **货币**：EUR（279,00 €）；REGION_CONFIG['de'] = { locale: de-DE, timeZone: Europe/Berlin, currency: EUR }
- **特殊字符**：ä ö ü ß；URL slug 避免 ß（用 ss）
- **UI 注意**：德语词长，窄屏需 hyphens:auto + overflow-wrap
- 详细见 `docs/i18n/de-翻译规范-本地化分析.md`

### 2.5 其他语言要点（概览）
| 语言 | 核心术语 | 敬语 | 备注 |
|---|---|---|---|
| tr 土耳其语 | IPL cihazı | siz | TRY |
| ro 罗马尼亚语 | dispozitiv IPL | dumneavoastră | RON |
| ar 阿拉伯语 | جهاز إزالة الشعر IPL | — | RTL + SAR |
| fr 法语 | appareil IPL | vous | EUR |
| ru 俄语 | IPL-устройство | вы | CNY（结算） |
| he 希伯来语 | מכשיר IPL | — | RTL + ILS |
| fa 波斯语 | دستگاه IPL | — | RTL + USD |
| el 希腊语 | συσκευή IPL | εσείς | EUR |
| pt-BR 巴西葡语 | aparelho IPL | você | BRL；禁用欧葡词汇（ecrã/telemóvel/contacto） |
| nl 荷兰语 | IPL-apparaat | u | EUR；u 形正式语 |
| id 印尼语 | perangkat IPL | Anda | IDR |
| th 泰语 | เครื่อง IPL | คุณ | THB |
| pl 波兰语 | urządzenie IPL | Pan/Pani | PLN |
| ko 韩语 | IPL 제모기 | — | KRW |
| cs 捷克语 | IPL přístroj | vy | CZK |
| vi 越南语 | máy triệt lông IPL | bạn | VND |

---

## 三、本地化格式规范（各语言）

### 3.1 数字格式
| 语言 | 小数 | 千位 | 示例 |
|---|---|---|---|
| en | . | , | 1,234.56 |
| es/de/fr/pl/cs 等欧洲 | , | . | 1.234,56 |
| ja/ko/zh | . | , | 1,234.56 |
| ar/fa | . | , | 1,234.56 |

### 3.2 日期格式
| 语言 | 格式 | 示例 |
|---|---|---|
| en | MM/DD/YYYY | 08/18/2026 |
| de | DD.MM.YYYY | 18.08.2026 |
| es/fr | DD/MM/YYYY | 18/08/2026 |
| ja | YYYY年MM月DD日 | 2026年8月18日 |

### 3.3 货币格式（按 REGION_CONFIG）
| 语言 | 货币 | 显示 | 示例 |
|---|---|---|---|
| en/fa | USD | $ | $32.29 |
| es/fr/el/nl/de/pt-PT/it | EUR | € 后缀 | 27,9 € |
| tr | TRY | ₺ | 1.549 ₺ |
| ro | RON | lei | 146,9 lei |
| ar | SAR | ر.س | 121,9 ر.س |
| ru | CNY | ¥ | 218,9 ¥ |
| he | ILS | ₪ | 95,9 ₪ |
| pt-BR | BRL | R$ | R$ 168,9 |
| id | IDR | Rp | Rp 575.759 |
| th | THB | ฿ | ฿1.069 |
| pl | PLN | zł | 120,9 zł |
| ja | JPY | ¥ | ¥5.149 |
| ko | KRW | ₩ | ₩45.679 |
| cs | CZK | Kč | 679 Kč |
| vi | VND | ₫ | 843.979 ₫ |

> 定价规则：官网基准 USD 原价保留；小币种 1 位小数尾 .9；大币种取整个位 9。见 `plans/currency-pricing-table.md`。

---

## 四、翻译流程标准

### 4.1 新增语言标准流程
1. **核查 6 处联动**（见 `docs/I18N_DEV_GUIDE.md` §2）
2. **生成语言包骨架**：从 en.json 生成（结构一致，[TODO] 占位）
3. **翻译**：按 section 分批（可并行子代理），遵守本文档术语规范
4. **校验**：`messages/work/<lang>/` 流水线（split → 翻译 → merge → check_leaves），0 missing / 0 extra
5. **验证**：
   - `verify_<lang>.cjs`：页面 lang/dir/导航命中/无英文残留
   - `scan_<lang>_body.cjs`：英文功能词扫描（同形词白名单）
   - `<lang>_browser_test.mjs`：4 引擎 × 4 视口（重点 375px 窄屏）
   - `all_langs_test.mjs`：全语言回归
6. **构建**：`npm run build`（astro 目录）

### 4.2 翻译质检清单
- [ ] 键结构与 en 一致（0 missing / 0 extra）
- [ ] 占位符 100% 保留
- [ ] 核心术语用规范翻译（见 §2）
- [ ] 敬语全站统一
- [ ] 数字/日期/货币本地化（Intl）
- [ ] 无英文残留（scan 通过）
- [ ] 无 [TODO] 遗漏（英文源非 TODO 的必须翻译）
- [ ] 窄屏无横向溢出

### 4.3 常见坑点（历史经验）
| 坑点 | 解决方案 |
|---|---|
| 语言包结构不一致 | check_leaves 校验 + merge 深合并 |
| 页面 404 | 语言推导链 6 处联动 |
| 英文残留 | scan_<lang>_body.cjs + 同形词白名单 |
| WebKit 溢出 | img max-width:100% |
| 敬语混用（es 历史问题） | 全站统一 tú；法律页可 usted |
| 片假名直译（ja 历史问题） | IPLデバイス → 光エステ脱毛器 |
| 术语不本地化（de 重点） | IPL device → IPL-Gerät，不用直译 |

---

## 四-B、小语种本地化对照基准获取流程（标准操作）

> 目的：为任一目标语言建立「本地化语言基准」，用于对比官网机器翻译并指导翻译，避免凭空直译。
> 原则：**以目标语言市场本土企业/品牌/媒体的真实网页为基准**（优先品牌官网，其次本地零售商/本土电商、本地评测媒体）。

### ⛔ 基准来源黑名单（严禁使用）

以下平台的翻译**不可作为本地化基准**——多为机翻或中文直译，语言不地道，且中国卖家居多：
- **AliExpress / AliExpress 各语言站**
- **Amazon 各站点**（除非是品牌官方店铺且文案为品牌方原生撰写——默认不采信）
- **Temu / SHEIN / Wish / 其他跨境中国卖家平台**

> 判断标准：若页面商品多为中国跨境卖家、文案带明显机翻痕迹、或用词与目标语言本土惯例不符，即不使用。

### 4B.1 搜索方法（Google listing page）

1. 打开 **Google.com**（可切换目标语言区域，如 `google.de` / `google.fr` / `google.co.jp`），搜索本地化的 at-home IPL hair removal device 相关关键词：
   - 不严格要求用英文原词，**使用目标语言的本地化搜索词**效果更好，例如：
     - 德语：`IPL Haarentfernung Gerät` / `IPL-Geräte für zu Hause`
     - 日语：`家庭用 IPL 脱毛器` / `光エステ 脱毛器`
     - 西语：`depiladora IPL uso doméstico` / `depiladoras IPL casa`
     - 法语：`épilateur IPL maison` / `appareil IPL à domicile`
     - 葡语：`depilador IPL uso doméstico` / `aparelho IPL caseiro`
     - 韩语：`가정용 IPL 제모기`
     - 泰语：`เครื่อง IPL กำจัดขนที่บ้าน`
     - 土耳其语：`evde IPL lazer epilasyon cihazı` / `IPL tüy alma`
   - 或直接搜索品牌本地化页面：`Philips Lumea [语言]` / `Braun Silk-expert [语言]` / `Beurer IPL [语言]`

2. 从 Google 搜索结果（listing page）中挑选 **3 个相关网页**作为基准（**避开黑名单平台**）：
   - **优先**：Philips / Braun / Beurer 等欧美品牌的**官方本地化页面**（语言与目标一致，原生文案最地道）
   - **其次**：目标语言的**本地实体零售商/本土电商**（本土企业，非跨境平台）：
     - 德国：MediaMarkt / Saturn / Otto（本土）
     - 西班牙：El Corte Inglés / MediaMarkt.es
     - 法国：Fnac / Darty / Boulanger
     - 土耳其：Trendyol（本土）/ Vatan Bilgisayar / Teknosa
     - 日本：Yodobashi / BicCamera / 家电量贩店
     - 韩国：Lotte / Shinsegae / 本土电商
   - **再次**：目标语言的本地评测媒体（chip.de / LesNumeriques / TechRadar 本地版 / 本土美妆杂志）
   - 至少 1 个为**品牌官网**，其余可为本地零售商/评测（覆盖面广）

3. **验证网页真实性**：用真实浏览器（Edge/Chrome）访问确认页面加载、语言正确、非 404/反爬拦截页；并确认内容方为**本土企业**（页面有目标语言原生版权信息/本地公司实体）。

### 4B.2 基准提取

4. 抓取 3 个网页内容（HTML → DOM innerText / JSON-LD / markdown），提取：
   - 产品/类目命名（核心术语的本地化叫法）
   - 营销话术与用户痛点表达
   - 规格/认证/免责标注规范（如【当社調べ】/「Ergebnisse können variieren」）
   - 数字/日期/货币格式实例
5. 输出基准报告 `docs/i18n/<code>-翻译规范-本地化分析.md`：
   - 核心术语对照表（本地化标准 vs 机器直译错误）
   - 语言风格特征（敬语/句式/话术）
   - 具体翻译修正建议

### 4B.3 已应用案例（供复用）

| 语言 | 基准网页 | 核心术语结论 |
|---|---|---|
| 🇩🇪 de | Braun DE 官网、MediaMarkt.de、chip.de 评测 | IPL-Gerät / Haarentfernungsgerät |
| 🇯🇵 ja | Panasonic スムースエピ（ES-WP9B/WG0B） | 光エステ脱毛器 |
| 🇪🇸 es | MediaMarkt.es、El Corte Inglés | depiladora IPL / marca blanca |
| 🇹🇷 tr | Philips TR 官网、Trendyol（本土电商，真实浏览器绕过 CF） | IPL lazer epilasyon cihazı / Tüy Alma Cihazı |

> ⚠️ 案例修正记录（2026-08-18）：早期 de/es 案例曾用 Amazon.de/es 作基准，**已按新规则弃用**——Amazon 跨境卖家文案不可靠，改以品牌官网 + 本土零售商（MediaMarkt/Otto/El Corte Inglés/Trendyol）为准。tr 案例已补采 Trendyol（真实浏览器绕过 Cloudflare）；Amazon 数据仅作交叉验证。
> 详细案例见 `docs/i18n/de|ja|es|tr-翻译规范-*.md`

---

## 五、维护与更新

- 新增/修改界面文案时，**必须同步更新 en.json 及全部已启用语言包**。
- 术语表变动（新增核心术语翻译）时，更新本文档 §2 对应语言小节。
- 新语言审计报告归档到 `docs/i18n/<code>-翻译规范-*.md`。
- 语言包改动后执行校验脚本，再构建验证。

---

*本准则由 Harness AI 基于真实市场基准（MediaMarkt/Panasonic/chip.de/Amazon 等）与项目历史审计整理，作为翻译工作唯一权威规范。*
