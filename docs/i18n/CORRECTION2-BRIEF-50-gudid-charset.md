# 定点更正 #2 —— GUDID Brand Name 字符集（22 语种）

## 背景：先前"待核"的两点，现已确认

上一轮我把 Brand Name 字段的字符集降级为"提交时核对"。**现在已由我方 Regulatory 确认**，规则如下（这三点是本次要写进文章的确定结论）：

1. **GUDID 维护一份「可接受特殊字符列表」（accepted special-characters list）**，**`®` 与 `™` 在 Brand Name 字段被接受**。
2. **严格的 `ISO/IEC 646` 字符集限制只适用于 device identifier (DI) 本身**，**不适用于 Brand Name 这类描述性文本字段**。Brand Name 是 **string** 数据元素，由 GUDID **business rules** 按上述特殊字符列表校验。
3. 如需**完整的逐字段格式定义**，依据 FDA 发布的 **GUDID Data Elements Reference Table (DERT)**。

**仍成立、不要改**：Brand Name 是**文本值**，logo/图形**不放进记录**，logo 印在实体标签上。

## 各语种要做的（只改 2 个区域，其余一字不动）

英文基准文件（语义权威）：

```
astro/src/content/blog/en/50-private-label-ipl-gudid-registration-and-responsibility.mdx
```

在你该语种文件里找到这两处（内容语义见英文基准的同一位置）：

### 区域 A —— "brand name is a data element, and it is a string" 小节里，紧跟小表之后的**两个 bullet + 结尾段**

**现状（错/已过期）**：两个 bullet 分别是
- "Which characters the field accepts…"（说要对照实现文档确认字符集）
- "Whether ® or ™ survives as a character…"（说这是提交时核对，不是设计时假设）

**应改为**：
- bullet 1 —— **字符集这点已经确定，而且对你有利**：GUDID 维护 **accepted special-characters list**，**`®` 与 `™` 在 Brand Name 字段被接受**。规则容易被误用，所以要精确表述：严格的 **ISO/IEC 646** 限制附着在 **device identifier (DI) 本身**，不是描述性文本字段；Brand Name 是 **string** 数据元素，由 GUDID **business rules** 按该列表校验。因此带 `®`/`™` 的品牌名可以按原样记录。
- bullet 2 —— **logo 美术留在标签上，不进字段**：Brand Name 是文本值，logotype/device mark 不是该字段承载的东西；logo 仍印在实体标签与包装上，属你的美术，不受记录影响。
- 保留紧随的那段 "This is not a workaround…" **不变**。

### 区域 B —— 该小节结尾的 caveat 引用块

**现状（已过期）**：说"上面这些字符集问题故意写成核对项而非既成事实；GUDID 字段规则见 FDA 实现文档并会更新。"

**应改为**：指向 **GUDID Data Elements Reference Table (DERT)** —— FDA 发布的逐字段格式定义表，规定每个数据元素的格式与规则；当品牌名含字母、数字、空格与已接受符号集**之外**的字符时，查 DERT，完整答案在那里。字段规则由 FDA 维护且可能更新，所以**提交时查一次 DERT** 是可靠习惯。

### 区域 C（顺带）—— 小表第 1 行右列

**现状**："Brand name as text, with ® or ™ where applicable"
**改为**："Brand name as text; ® and ™ are accepted"

## 硬性规则

- **只改 A / B / C 三处**。其余正文、frontmatter、表格、内链不动。
- **新增术语保留英文**：`accepted special-characters list`、`ISO/IEC 646`、`device identifier (DI)`、`business rules`、`GUDID Data Elements Reference Table (DERT)`、`string`。可加简短本语种括注。
- 既有术语继续保留英文：`new DI trigger`、`labeler of record`、`specification developer`、`letter-to-file`、`510(k)`、`GUDID`、`DI`、`UDI`、`Flowchart A/B/C`、`device master record`、`initial importer`、`US agent`、`establishment registration`、`device listing`。
- **frontmatter 契约不变**：`slug`、`translationKey`、`category` 不动。
- 不机翻；沿用该语种既有文体。
- **警示**：不要把 ASCII 直引号嵌进 YAML 双引号标量里（罗马尼亚语文件曾因此让整站构建挂掉）。

## 自检

1. 文件里已出现 `accepted special-characters list`（英文）与 `ISO/IEC 646`（英文）；
2. `®` `™` 现在出现在**肯定句**里（被接受），而不再是"待核对"；
3. 旧的两个 bullet（"Which characters…" / "Whether ® or ™ survives…"）语义已清除；
4. caveat 已指向 **DERT**；
5. `slug` / `translationKey` / `category` 未变，YAML 仍可解析。

## 回传

结构化回传：语种、文件路径、A/B/C 三处是否各自落实、`accepted special-characters list` 与 `ISO/IEC 646` 是否保留英文、自检 1-5 结果、任何不符之处（如实报告）。
