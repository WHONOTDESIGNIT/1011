# DERT 一手依据记录 —— GUDID Brand Name 两项结论（已落实）

> 依据文件：`GUDID-Data-Elements-Reference-Table_1.xlsx`（FDA 发布的表格，331 KB，下载后本地读取；
> 不记录本机存放路径，任何人从下列官方地址重新下载即可得到同一份文件）
> 来源：FDA 官方资源页 → `https://www.fda.gov/media/120974/download?attachment`（XLSX 331 KB）
> 读取方式：直接读 XLSX（Python + openpyxl），**非二手解读**
> 日期：2026-10-13

---

## 一、结论摘要

| 问题 | DERT 取值 | 判定 |
| --- | --- | --- |
| Brand Name 是否接受 `®` / `™` | `SpecialCharacters` 表 **r43 = ®、r79 = ™**；且 Brand Name 行 Data Entry Notes 明文允许 | ✅ **接受** |
| 品牌名变更是否触发新 DI | Brand Name 行 **`New DI Trigger?` = Yes** | ✅ **触发 → 需新 DI + 新记录** |

**两项都已落实为一手依据。** 我先前"因无法核实而撤回两条断言"的处理现在可以反向收敛：一条（`New DI Trigger`）**我原先的写法其实是对的**，只是当时拿的是通用规则、推理不合法；另一条（`®`/`™`）**现已由 DERT 明文确认为真**。

---

## 二、`GUDID_Data_Elements` 表中 Brand Name 行（逐格原文）

| DERT 列 | 值（原文） |
| --- | --- |
| **Data Element** | `Brand Name` |
| **Description** | "A brand name is a trade/proprietary name assigned by the device labeler, and under which the device is sold, distinguished from other similar devices, and recognized by the user or purchaser. A brand name is often registered and/or protected by a trademark." |
| **Data Entry Notes** | "Enter the brand name specific to this version/model of the device. **You may include the ® and/or TM symbol, if applicable.** If there is no brand name for your device then enter NA or the name commonly used to refer to the device or family of devices. Information entered in this field should be greater than one character in length, and a name that refers to the device must be entered." |
| **Edit Rules After Grace Period** | `None` |
| **Required in Database?** | `Required` |
| **Data Type & Length** | `Type: Alphanum.`　`Length: 80` |
| **Entry List of Values (LOV)** | `NA` |
| **New DI Trigger** | **`Yes`** |
| **Publicly Released?** | `Yes` |

### 由此可直接引用的三点

1. **`®` / `™` 明确允许** —— Data Entry Notes 原文 "You may include the ® and/or TM symbol, if applicable"。
2. **字段是 Alphanum.，长度上限 80** —— 不是"严格 ISO/IEC 646"那一类；字符集由 DERT 的 `SpecialCharacters` 表规定。
3. **`New DI Trigger` = Yes** —— 品牌名变更属触发新 DI 的数据元素。

---

## 三、`SpecialCharacters` 表（可接受特殊字符）

表头：`Character | Character Description | AltKey+Code | Decimal | Hexadecimal | Comments`
表名：**"Special Characters Accepted in GUDID"**

与本文相关的行：

| 行 | 字符 | 说明 |
| --- | --- | --- |
| r4–r6 | `A-Z` / `a-z` / `0-9` | 字母与数字 |
| r43 | **`®`** | Registered（AltKey+0174 · `&#174;` · `&#x00AE;`） |
| r45 | `©` | Copyright |
| r46 | `—` | elongated dash |
| r57 | `•` | Bullet |
| **r79** | **`™`** | **Trademark**（AltKey+0153 · `&#153` · `&#x99`） |
| r81–r84 | `“ ” ‘ ’` | 弯引号（注意：**ASCII 直引号在 r33 也在表内**，但用于 YAML/文本处理时仍需转义） |

> 该表还含 `µ ß ° á é í ó ú ñ Ä Ö Ü ø ± ² ³ ×` 及希腊字母等，本文不涉。

---

## 四、需要留意的一处措辞边界（建议如此表述，避免过度断言）

`New DI Trigger?` 列取值是 **Yes**，但 Data Entry Notes 把品牌名定义为 "specific to **this version/model** of the device"。因此精确表述应为：

- ✅ 可以说：**Brand Name 在 DERT 中被标为 New DI Trigger（Yes），品牌名变更需要分配新 DI 并提交新记录。**
- ⚠️ 不宜引申为："任何品牌名写法上的微调都必然产生新 DI" —— DERT 未如此表述；具体判定仍以变更是否构成新的 version/model 为准。
- `Edit Rules After Grace Period = None` 与 `New DI Trigger = Yes` 相互印证：该字段本就不设计为发布后编辑。

---

## 五、方法论备注（本次教训）

先前两次反复的根因是同一类错误：**把一条通用规则的存在，当成对本对象的归类**。FDA 原文 "changing data elements that are 'New DI Triggers'" 只说明"改了 New DI Trigger 字段才要新 DI"，并未说明 Brand Name 属于该类。

**规则**：凡"某字段是否属于某类别/是否触发某后果"，以**该字段在权威表中对应列**（本例 DERT `New DI Trigger`）为准，**不得**由规则文本推断字段归属。本次即为该规则的正例：一查即明。

---

## 六、附：DERT 工作表清单（供后续复用）

`GUDID_Data_Elements`（104 行 × 12 列，主表）、`ChangeLog`（179 行）、`General Notes`、`Acronyms`、`List of Values (LOV)`（466 行）、**`SpecialCharacters`（84 行）**、`Sample Label`、`Helpful Links`

---

## 附：本记录在仓库中的用途

本文件是 post 50（`astro/src/content/blog/<locale>/50-private-label-ipl-gudid-registration-and-responsibility.mdx`）中两项结论的一手依据留档，便于后续审阅时回溯到 DERT 原始取值。
