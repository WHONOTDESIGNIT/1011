# 定点更正 #4（定稿）—— GUDID 两项依据已落实，写为结论（22 语种）

## 依据已落实（一手）

依据：**FDA《GUDID Data Elements Reference Table》(DERT)**，XLSX，本机直读，非二手解读。
两个工作表取值如下：

### `GUDID_Data_Elements` 表 · **Brand Name** 行

| DERT 列 | 原文值 |
| --- | --- |
| Description | "A brand name is a trade/proprietary name assigned by the device labeler… A brand name is often registered and/or protected by a trademark." |
| Data Entry Notes | "Enter the brand name specific to **this version/model** of the device. **You may include the ® and/or TM symbol, if applicable.** …" |
| Edit Rules After Grace Period | `None` |
| Required in Database? | `Required` |
| Data Type & Length | `Type: Alphanum.` / `Length: 80` |
| Entry List of Values (LOV) | `NA` |
| **New DI Trigger** | **`Yes`** |
| Publicly Released? | `Yes` |

### `SpecialCharacters` 表（表名 "Special Characters Accepted in GUDID"）

- **`®`** 在表内（Registered，AltKey+0174 / `&#174;` / `&#x00AE;`）
- **`™`** 在表内（Trademark，AltKey+0153 / `&#153` / `&#x99`）
- 另含 `© ° ± ² ³ — •`、带音标拉丁字母（á é í ó ú ñ Ä Ö Ü ø å）、希腊字母等

## 两项结论（本次要写进文章）

1. **Brand Name 在 DERT 中被标为 `New DI Trigger` = Yes** → 品牌名变更**不是**编辑既有 DI 记录，而是**分配新 DI + 提交新记录**。
   配套事实：该字段 **Alphanum. / 80 字符**；`Edit Rules After Grace Period = None`（与"该字段不设计为发布后编辑"相互印证）；DERT 把品牌名定义为 "specific to **this version/model** of the device"。
2. **`®` 与 `™` 明确被接受** —— 依据是该行 Data Entry Notes 原文 "You may include the ® and/or TM symbol, if applicable"，以及 `SpecialCharacters` 表逐条列出。
3. **保留不变**：Brand Name 是文本值；logo/图形**不进记录**，印在实体标签上。

## 各语种要做的（3 处，其余一字不动）

英文基准（语义权威）：

```
astro/src/content/blog/en/50-private-label-ipl-gudid-registration-and-responsibility.mdx
```

### 区域 A —— Option 1 小节那段 "One point of vocabulary…"

**现状（上一轮的"待核"写法）**：说"品牌名变更是数据更新还是新 DI 事件，须到 DERT 查 `New DI Trigger?` 列"。

**改为（结论式，用本语种地道表达）**：

> 措辞上的一点，因为它在 GUDID 讨论中造成混淆，而且它改变的是**流程**而不只是说法：**Brand Name 在 FDA 的 GUDID Data Elements Reference Table (DERT) 中被标为 New DI Trigger** —— 该列取值为 **Yes**。所以品牌名变更**不是**对既有 DI 记录的编辑：它意味着**分配新 DI 并提交新记录**。同一行还有两个细节把图景补全：该字段是 **alphanumeric、80 字符**；其 `Edit Rules After Grace Period` 为 **None** —— 与"该字段不设计为发布后可编辑"一致。又因 DERT 把品牌名定义为 **specific to this version/model of the device**，实务读法是：品牌名变更在识别意义上构成该设备的**新版本**。这在实务上其实是**更省**而非更贵的一步：你的品牌在数据库里拿到自己的身份，而不是与来源品牌的记录共用一个。

### 区域 B —— 字符集那个 bullet

**现状（"到 DERT 核对"）** → **改为结论式**：

> **字符集：已确定，而且对你有利。** DERT 对 Brand Name 的 Data Entry Notes 明确写着：*"You may include the ® and/or TM symbol, if applicable."* 两个字符也各自列在 DERT 的 **"Special Characters Accepted in GUDID"** 表上 —— **`®`** 对应 *Registered*、**`™`** 对应 *Trademark*。该字段本身是 **alphanumeric、上限 80 字符**，因此这是描述性字符串字段，而非适用于 device identifier 的那套严格字符制。所以带 `®` 或 `™` 的品牌名可以按原样记录。（顺带一提：同一张可接受字符表还覆盖带音标拉丁字母、一组希腊字母，以及 `©`、`°`、`±`、`²` 等常用符号，所以品牌名字段很少成为限制。）

**保留不变**：紧随的 "Logo artwork stays on the label, not in the field." bullet。

### 区域 C —— 三处小同步

- 表格第 1 行右列：改为 *"Brand name as text; ® and ™ accepted (DERT)"* 的本语种表达。
- **2. The device model designation** 段：改为"GUDID 记录以设备配置为键，而 DERT 把品牌名定义为 specific to this version/model；因此**在创建记录前先定死型号** —— 因为品牌名变更本身就是 **New DI Trigger**：产生新 DI 与新记录而非编辑，型号越早定，重报越少"。
- 结尾 caveat 引用块：改为**结论式**说明这两点由 DERT 落定、而非推断 —— Brand Name 字段是 **alphanumeric (80 字符)** 且接受 **`®`** 与 **`™`**；其 **New DI Trigger** 列为 **Yes**，**Edit Rules After Grace Period = None**。FDA 维护并更新这些规则，所以**提交时值得再看一眼 DERT 该行**，但**结论本身不存在疑问**。

## 硬性规则

- **只改这 3 处**；其余正文、frontmatter、表格结构、内链不动。
- **术语保留英文**：`GUDID Data Elements Reference Table (DERT)`、`New DI Trigger`、`Edit Rules After Grace Period`、`Special Characters Accepted in GUDID`、`device identifier`、`alphanumeric`，以及既有 `labeler of record`、`specification developer`、`letter-to-file`、`510(k)`、`GUDID`、`DI`、`UDI`、`Flowchart A/B/C`、`device master record`、`initial importer`、`US agent`、`establishment registration`、`device listing`。
- **这次是结论**：可以明确写 `®`/`™` 被接受、品牌名变更触发新 DI。**但仍不得**引申为"任何写法微调都必然产生新 DI"（DERT 未如此表述，以是否构成新 version/model 为准）。
- `slug` / `translationKey` / `category` 不变。
- 不机翻；沿用该语种既有文体。
- **不要把 ASCII 直引号嵌进 YAML 双引号标量**（罗马尼亚语曾致整站构建中断）。

## 自检

1. 文件里出现 `New DI Trigger` 且语义为 **Yes / 需新 DI + 新记录**（结论式，不再是"待查"）；
2. 文件里 `®` `™` 出现在**肯定句**（被接受），并引用到 DERT 的 `Special Characters Accepted in GUDID`；
3. 出现 `80` 字符的上限；
4. 结尾 caveat 已是结论式（不再说"故意留作待核"）；
5. `slug` / `translationKey` / `category` 未变，YAML 可解析。

## 回传

结构化：语种、文件路径、A/B/C 是否各自落实、`New DI Trigger` 与 `Special Characters Accepted in GUDID` 是否保留英文、自检 1-5 结果、任何不符（如实报告）。
