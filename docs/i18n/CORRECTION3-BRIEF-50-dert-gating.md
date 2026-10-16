# 定点更正 #3 —— 撤回两处未落实的断言，改为 DERT 门控（22 语种）

## 为什么改

上一轮我把两件事写成了**确定结论**，但按更严格的一手依据标准，**两者都未落实**：

| 断言 | 状态 |
|---|---|
| 「GUDID 维护 accepted special-characters list，`®`/`™` 在 Brand Name 被接受」 | ❌ **未从一手依据核实**。第三方行业解读提到过可接受特殊字符列表，但**未核对 DERT 原文**。 |
| 「品牌改名属于 new DI trigger → 需新 DI + 新记录」 | ❌ **我推理错了**。FDA 那句 "changing data elements that are *New DI Triggers* → 新 DI + 新记录" 是**通用规则**，**并未说明 Brand Name 是否属于 New DI Trigger**。我把"规则存在"误读成"字段被归类"。 |

**已核实为真、可以主张的**（这些保留）：

- GUDID 只存 UDI 的 **DI 部分**；不存 PI（production identifier），只存 PI flags。
- 每个 DI 记录的**逐字段业务规则**由 FDA 发布在 **GUDID Data Elements Reference Table (DERT)** 中，DERT 含每个字段的 **"New DI Trigger?"** 判定列。
  （FDA 官方原文：*"Each Device Identifier (DI) record is subject to GUDID business rules to help ensure data quality. GUDID business rules for each data attribute are provided in the GUDID Data Elements Reference Table."*）
- **ISO/IEC 646** 严格字符集与 **DI 本身**相关联；**Brand Name 是描述性 string 字段**，由 GUDID business rules 校验。
- New DI Trigger 的判定**总体围绕"设备是否还是同一个设备"**（如灭菌状态、单次使用属性）设计 —— 所以品牌名是否落入该逻辑**必须看 DERT 那一列，不能推断**。
- Brand Name 是**文本值**；logo/图形**不进记录**，印在实体标签上。

## 各语种要做的（3 处，其余一字不动）

英文基准（语义权威，你的文件里同样位置、标题已本地化）：

```
astro/src/content/blog/en/50-private-label-ipl-gudid-registration-and-responsibility.mdx
```

### 区域 A —— Option 1 小节里那段 "One point of vocabulary…"

**现状（错）**：声称「a DI record is not meant to be edited into a different product；变更识别类数据元素（含品牌名）是 **new DI trigger**，正确响应是新 DI + 新记录」。

**改为**（要点，用本语种地道表达）：

> 措辞上的一点，因为它在 GUDID 讨论中确实造成混淆：**品牌名变更是"对既有 DI 记录的数据更新"还是"需要新 DI 的事件"，是关于该字段的事实，不是偏好问题 —— 而它只在一个地方有答案。** GUDID 对每个数据属性的业务规则载于 FDA 的 **GUDID Data Elements Reference Table (DERT)**，其中含**逐字段的 "New DI Trigger?"** 判定。对照理解：Brand Name 是 **DI 层级**属性（GUDID 只存 UDI 的 DI 部分，不存 production identifier，只存其 flags）；而触发项总体围绕"设备是否还是同一个设备"来设计，例如灭菌状态、单次使用属性。品牌名落在该逻辑之内还是之外，**正是 DERT 那一列所裁定的**。在选定任一流程前先查它，因为两条路径不同：既有记录的数据更新，与分配新 DI 并提交新记录，是两种不同操作。

### 区域 B —— 字符集那个 bullet

**现状（错）**：声称「已确定、且对你有利：GUDID 维护 accepted special-characters list，`®`/`™` 在 Brand Name 被接受……可以按原样记录」。

**改为**（要点）：

> **字符集：到 DERT 里核对，那是唯一能回答它的地方。** GUDID 对每个数据属性（含某字段可接受哪些字符）的业务规则发布在 FDA 的 **GUDID Data Elements Reference Table (DERT)** 中。值得去查而不是假设，原因是一个很容易搞反的区分：严格的 **ISO/IEC 646** 字符限制与 **device identifier (DI) 本身**相关联，而 **Brand Name** 是由 GUDID business rules 校验的描述性 **string** 数据元素。因此商标符号（如 **`®`** 或 **`™`**）能否通过，是**关于 Brand Name 字段在 DERT 中的规则**的问题 —— 依赖它之前先查该行，因为提交时被拒字符会多绕一轮返工。

**保留不变**：紧随的 "Logo artwork stays on the label, not in the field." bullet（logo 不进记录，印在标签上）。

### 区域 C —— 小表第 1 行右列 + 第 2 点 + 结尾 caveat

- 表格右列：由 "Brand name as text; ® and ™ are accepted" 改为 **"Brand name as text; accepted characters per the DERT"**（本语种表达）。
- **2. The device model designation** 那段：删去"改名会触发 new DI + 新记录"的断言，改为：定死型号的同时**一并解决上面两个 DERT 待核问题** —— 因为日后识别信息变更究竟是编辑既有记录还是分配新 DI，取决于**同一行 DERT**，先知道是哪一种，命名成本最低。
- 结尾 caveat 引用块：改为说明**上面标注的两点故意留作 DERT 核对项、而非既成事实**：①Brand Name 可接受的字符集；②品牌名变更是否被标为 **New DI Trigger**。两者都由 FDA 维护并更新的 **DERT** 回答 —— 以最新 DERT 的那一行为准，**不要从通用规则推断**。

## 硬性规则

- **只改这 3 处**；其余正文、frontmatter、表格结构、内链不动。
- **术语保留英文**：`GUDID Data Elements Reference Table (DERT)`、`New DI Trigger`、`device identifier (DI)`、`business rules`、`ISO/IEC 646`、`string`、`production identifier`，以及既有的 `labeler of record`、`specification developer`、`letter-to-file`、`510(k)`、`GUDID`、`DI`、`UDI`、`Flowchart A/B/C`、`device master record`、`initial importer`、`US agent`、`establishment registration`、`device listing`。
- **不要在任何地方断言** `®`/`™` 已被接受，也**不要断言**品牌改名是新 DI 触发。两者只作为 **DERT 核对项**出现。
- `slug` / `translationKey` / `category` 不变。
- 不机翻；沿用该语种既有文体。
- **不要把 ASCII 直引号嵌进 YAML 双引号标量**（罗马尼亚语曾因此让整站构建中断）。

## 自检

1. 文件里**不再出现**"®/™ 已被接受"的肯定断言；
2. 文件里**不再出现**"品牌改名 = new DI trigger"的断言；
3. 出现 `DERT` 且语义是"到 DERT 核对这两点"；
4. `New DI Trigger` 以**待查列名**形式出现（含问号更佳）；
5. `slug` / `translationKey` / `category` 未变，YAML 可解析。

## 回传

结构化回传：语种、文件路径、A/B/C 是否各自落实、两个断言是否已撤、`DERT` 与 `New DI Trigger` 是否保留英文、自检 1-5 结果、任何不符（如实报告）。
