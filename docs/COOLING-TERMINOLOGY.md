# 冷却机制术语表（TEC / 冰点 / 传导面）

> 建立日期：2026-09-19 ｜ 适用范围：`messages/*.json` 的机型冷却口径、博客与产品页文案、21 语种本地化
> 起因：站点一度用「metal ice point cooling」这类自造词描述 Themis 的冷却，既不符合专利文献写法，也无法本地化对齐。本文件固定正确表述。

## 1. 机制本身（三段结构）

家用 IPL 的接触式冷却由三部分构成，写文案时不要混为一谈：

| 部件 | 专利/技术文献常用英文 | 作用 |
|---|---|---|
| 制冷片 | **TEC**（thermoelectric cooler，Peltier 元件） | 冷端吸热、热端放热 |
| 传导面／传导头 | **heat conducting portion** / **heat transfer component** / **heat transfer interface** / **cooling surface** | TEC 冷端贴在其背面，正面接触皮肤，把冷量送到皮肤 |
| 散热端 | heatsink / heat sink | 把 TEC 热端的热量排出机壳 |

整套系统合称 **thermoelectric cooling assembly**（热电制冷组件）——指 TEC + 散热器 + 热传导件的完整组合，不等于单指制冷片。

**关键区分**：冷感来自"传导面"接触皮肤，而传导面的**材料**可以是蓝宝石（sapphire），也可以是金属（metal）。所以"有没有冰点"与"传导面是不是蓝宝石"是**两个独立问题**。

## 2. 核准的英文写法

按机型层级选用，不要自造词：

| 场景 | 核准写法 |
|---|---|
| 机型规格行的冷却值（Themis，金属传导面） | `TEC-based cooling with metal heat transfer interface` |
| 同义替代（更口语/更短） | `Thermoelectric cooling (TEC) with a metallic cooling surface` |
| 技术性长描述（蓝宝石机型，用于博客/组件页） | `TEC-based cooling with a sapphire heat transfer interface` |
| 机型规格行的冷却值（蓝宝石机型，站点既有口径） | `Support, sapphire ice feeling tech`（各语种已有译文，不要再改结构） |
| 机型规格行的冷却值（无冰点的机型） | 各语种既有的「标准」措辞（与 Euno 一致） |

**禁写**：
- ❌ `metal ice point cooling`（自造词，专利与行业文献均无此说法）
- ❌ 任何非蓝宝石机型出现 sapphire／蓝宝石／サファイア／сапфир／الياقوت 等材料词
- ❌ 任何无冰点机型出现温度数字（如 5 °C／8 °C）或"到达时间"行
- ❌ 把 TEC 单独当作"冷却系统"的全部（它是组件之一，散热端与传导面同样决定体感）

## 3. 机型口径（2026-09-19 老板确认）

| 机型 | 传导面材料 | 是否有冰点 | 冷却行口径 |
|---|---|---|---|
| Venus、Helix、Lumi 2 | 蓝宝石 | 有，稳定在 **8 °C** | 蓝宝石冰感（既有口径）；窗口 **3.0 cm²** |
| Themis | **金属** | 有，**5 °C**（25 °C 环境） | `TEC-based cooling with metal heat transfer interface` |
| Lumi、Hestia、Alpha、Emerald、Hebe、Wooden | 非蓝宝石 | **无冰点** | 各语种「标准」措辞；不得出现温度行 |

Lumi 2 另有历史口径修正：窗口由 4.5 cm² 更正为 **3.0 cm²**，tagline/功能卡/索引链接里的 10 °C 更正为 **8 °C**。

## 4. 本地化规则（21 语种）

1. **`TEC` 作为技术缩写保留拉丁写法**，不音译、不意译（与 IPL、OEM、DDP 同类处理）。
2. "heat transfer interface" 用各语种既有的热传导用词：de `Wärmeübergabefläche`／`Wärmeleitfläche`、fr `interface de transfert thermique`、es `interfaz de transferencia térmica`、it `interfaccia di trasferimento termico`、pt `interface de transferência térmica`、nl `warmteoverdrachtsoppervlak`、pl `powierzchnia wymiany ciepła`、cs `tepelně vodivá plocha`、ro `suprafață de transfer termic`、ru `теплопередающая поверхность`、el `επιφάνεια μεταφοράς θερμότητας`、tr `ısı transfer yüzeyi`、ja `金属熱伝導面`、ko `금속 열전달면`、th `พื้นผิวถ่ายเทความร้อน`、vi `bề mặt truyền nhiệt`、id `permukaan transfer panas`、ar/fa/he 用对应"热传导面"表述。
3. 句子结构与该语种其它机型的冷却行保持平行，便于规格表对齐。
4. 数字用半角；不引入方向控制字符（ar/fa/he 尤其）；保持文件原有 LF 与缩进。

## 5. 涉及的数据位置

| 内容 | 位置 |
|---|---|
| 各机型冷却值 | `messages/<locale>.json` → `productDetail.<slug>.specs.cooling.value` |
| 温度与到达时间行 | 同上 `specs.coolingTemperature` / `specs.timeToCoolingTemperature`（仅蓝宝石三款与 Themis 保留） |
| 产品页规格行渲染清单 | `astro/src/pages/products/[slug].astro` → `SPEC_KEYS` |
| 产品页功能卡清单 | 同上 → `FEATURE_KEYS` |
| 组件页冷却说明 | `messages/<locale>.json` → `componentsCooling.*` |
| llms.txt 机型行 | `astro/public/llms.txt`（构建期由 `check-llms-specs.mjs` 校验参数一致性） |

## 6. 自查清单（改冷却文案前后各跑一次）

- [ ] 只有 Venus / Helix / Lumi 2 出现蓝宝石字样；其余机型 0 处
- [ ] 无冰点的六款机型：无温度值、无到达时间、无 ice point / 冰点表述
- [ ] Themis 用 TEC + 金属传导面表述，且无「自造词」
- [ ] 蓝宝石三款的温度统一为 8 °C；窗口统一为 3.0 cm²
- [ ] `TEC` 在各语种均为拉丁缩写
- [ ] 构建 13 步绿（含 `check-llms-specs.mjs` 参数一致性守护）
