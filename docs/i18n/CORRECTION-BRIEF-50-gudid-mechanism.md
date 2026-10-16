# 定点更正任务书 —— post 50 GUDID 机制表述（22 语种）

## 为什么要改

原文把「把品牌加进 GUDID」写成了**在厂商既有 DI 记录上加品牌名**。这个机制是错的。

已核实的 FDA/GUDID 文档口径：

- **变更识别类数据元素（brand name 在内）属于 "New DI trigger"** —— 正确做法是**分配新的 DI 并提交新记录**，而**不是**编辑既有记录。
  （依据：FDA 文件明确 "You need to assign a new Device Identifier and submit a new record if you are changing data elements that are 'New DI Triggers'"；GUDID 实现文档亦有 "Edit Rules After Grace Period" 一列，同理。）
- 因此「把品牌加进 GUDID」永远是**创建一条标识你这一配置的新记录**，不是覆盖既有记录。

另外，两处**未能在公开渠道独立核实**、必须改为"提交时核对"的表述：

- Brand Name 字段**接受哪些字符**（含 `®` `™` 是否被接受）—— 未能从 FDA 官方文档独立核实；
- 该字段**不接受图像**这一具体断言 —— 同一来源，未能独立核实。

已核实且**保留不变**的：Brand Name 是**文本/字符串**数据元素，其定义是"proprietary, trade, or brand name of the medical device as used in device labeling or in the catalogue"（openFDA 字段定义）。所以"是文本、不是图像载体"这个**方向**成立，但"具体接受哪些字符"不成立为断言。

## 各语种要做的（只有 3 处，其余一字不动）

**不要重译全文。只改下面 3 个区域**，把它们替换为**英文对应段落的本语种版本**。英文源文件为语义基准：

```
astro/src/content/blog/en/50-private-label-ipl-gudid-registration-and-responsibility.mdx
```

在你的语种文件里定位同样的 3 个位置（标题文字在你的文件里已是本语种，按语义定位）：

| # | 区域 | 现状（错） | 应改为 |
|---|---|---|---|
| 1 | Option 1 小节**标题** | "your brand inside the manufacturer's GUDID account" | **"a new DI filed under the manufacturer's GUDID account"** |
| 2 | Option 1 小节**正文**（含 3 个 bullet） | 说厂商"adds your brand name to its existing GUDID account and DI records"，且第三条 bullet 是 "the UDI record is the manufacturer's" | 改为：厂商持有 GUDID 账户；应用你的品牌后，产品以**你的品牌名**标识，即为**独立配置**，因此需要**自己的 DI 与自己的一条 GUDID 记录**，由厂商在其账户下提交。三条 bullet 相应改为：①厂商是 labeler of record 并对该标签向 FDA 负责；②**该 DI 记录提交在厂商账户下**；③你无需因此注册为 establishment。并**补一段**（英文原文该处已加）：DI 记录的设计意图不是被编辑成另一个产品；变更识别类数据元素（含品牌名）在 GUDID 文档中被视为 **new DI trigger**，正确响应是**新 DI + 新记录**，而非改动既有记录 —— 所以"把品牌加进 GUDID"从来不是覆盖记录，而是**创建标识你这一配置的记录**。 |
| 3 | "The brand name is a data element" 小节（含小表 + caveat 引用块） | 断言字段"accepts alphanumerics plus ® and ™, but not a symbol set or a logo image"并标注为"我方运营理解" | 改为：GUDID 以**文本/字符串**记录品牌名（label 或 catalogue 上使用的 proprietary/trade name），是文本值而非图像；logo 属实体标签美术，不由该字段承载。表格保留（左列改为 "Not held — the field is a text value"）。然后**明确列两点留待提交时确认**：①该字段接受哪些字符（依据 GUDID 实现文档对每个数据元素的字符集规定）；②`®`/`™` 能否作为字符通过 —— 定位为**提交时核对**，不是设计时假设。结尾 caveat 引用块改为说明这些字符集问题**故意以"核对项"而非既成事实陈述**，GUDID 字段规则见 FDA 的 GUDID 实现文档并会更新。 |

## 硬性规则

- **只改这 3 处**。其余正文、frontmatter、表格、内链一律不动。
- **frontmatter 契约不变**：`slug` 与 `translationKey` 仍与英文逐字节相同，`category` 仍为 `Regulatory`。
- **法规术语继续保留英文**：`new DI trigger`、`labeler of record`、`specification developer`、`letter-to-file`、`510(k)`、`GUDID`、`DI`、`UDI`、`Flowchart A/B/C`、`device master record`、`initial importer`、`US agent`、`establishment registration`、`device listing`。新增的 `new DI trigger` 同样保留英文（可加简短本语种括注）。
- **`®` `™` 不要写进断言句**，只作为"待核对字符"提及。
- 不机翻。沿用你该语种既有的文体与敬语。

## 自检

1. 你的文件里**不再出现**"在既有 DI 记录上加品牌名"这一意思的表述；
2. 出现 `new DI trigger`（英文）且语义是"新 DI + 新记录"；
3. 字符集那处已改为"提交时核对该字段字符集"，不再是断言；
4. `slug` / `translationKey` / `category` 未变；
5. YAML 仍可解析。

## 回传

结构化回传：语种、文件路径、3 处是否各自落实、`new DI trigger` 是否保留英文、自检 1-5 结果、遇到的不符之处（如实报告，不要猜）。
