# 修订清单 — Best IPL Hair Removal Devices 2026

> **2026-10-12 二次修订（本文件当前内容）**：按用户决定，从**全部 22 个语种**中移除
> Tria 4X（810nm 二极管**激光**，不是 IPL）与 Ulike 的 FAQ 条目，并同步小语种翻译。
> 详见文末「五、22 语种同步（第二轮）」。第一节至第四节记录第一轮英文修订。

- 文件（第一轮，英文源稿）：`astro/src/content/blog/en/45-best-ipl-hair-removal-device.mdx`
- 原件备份：`docs/backups/45-best-ipl-hair-removal-device.mdx.orig-2026-10-12.bak`（第一轮修订前的原始状态）
- 修订日期：2026-10-12　修订后 `updatedDate: 2026-10-12`
- 校验结果：项目自带 `scripts/check-frontmatter.mjs` 退出码 0（扫描 1540 篇，待修复 0）；`js-yaml` 解析通过；`@mdx-js/mdx` 正文编译 **22/22 通过**。

## 一、实质问题修复

### 1. FAQ 答案里混入了一个游离的 `---`（唯一英文独有的缺陷）

- **原文**（第 25 行，Ulike 那条 FAQ 答案结尾）：
  `…and compare against the numbers on this list. ---`
- **问题**：这个 `---` 是残留字符，会**直接渲染进 FAQ 可见文本**。更重要的是，同一语种的其余 21 个语种**都没有**这个问题：

  | 语种 | 是否有游离 `---` |
  | --- | --- |
  | **en** | **有** |
  | 其余 21 个（ar/de/fr/ja/es/it/ko…） | 无 |

  该文是清单里唯一受影响的语种。项目历史上有 `content(i18n): emit FAQPage for 184 posts whose FAQ lived only in the body` 这类结构化数据提交，FAQ 答案文本会进入 FAQPage，脏字符应当清掉。
- **改为**：删除 ` ---`，并把句子写完整：
  `We don't rank Ulike in the table above, because their published specs don't fully disclose energy density. If you're comparing, use the checklist in this guide: ask for J/cm², flash life, and sensor type, and hold those numbers against the specs listed here.`

### 2. 标题承诺「Best **IPL** Devices」，但榜单第 6 位是**激光不是 IPL**

- **问题**：Tria 4X 是 810nm 二极管激光；文章正文自己写着 "it's a real diode laser, not IPL"，但它以 **#6** 身份出现在「Best IPL Hair Removal Devices」榜里，且**没有任何说明**。标题承诺与内容不符，这是可被读者与竞品直接指出的可信度漏洞。
- **改为**（三处，互相呼应）：
  1. **导语**：名单只列 6 款真 IPL；明确写出 Tria 4X「不是 IPL」，只作精准小面积处理的替代选项（加粗提示）。
  2. **榜单前言**（Glance 小节）：新增一句 `Entries 1–6 are IPL devices. **Tria 4X is a diode laser, not IPL** — it is ranked separately at the end as a precision alternative, and is not counted among the IPL picks.`
  3. **列表与正文重排**：IPL 六款依次 #1–#6，**RoseSkinCo Lumi 由 #7 改为 #6**，**Tria 4X 移到末尾改为 #7**，小标题改为 `### #7 Tria 4X — Not IPL: a True Diode Laser for Precision`。
- **不再改标题**：`best-ipl-hair-removal-device` 是 URL slug 与主关键词，动标题的 SEO 代价大于收益，因此改用「正文与描述里把边界说清」的方式消除矛盾。

### 3. 「不排名 Ulike」与文内「#7 是 Ulike 代工平台」的表述冲突

- **问题**：FAQ 原文写 `We don't rank them here`，容易与第 7 条（RoseSkinCo Lumi，是你们 FDA 510(k) K222537 平台）混淆，读者会以为你们在贬低 Ulike 又偷偷排了它。
- **改为**：`We don't rank Ulike in the table above…` —— 把「不排名的对象」限定为 Ulike 本身，歧义消失。

### 4. 规格归属披露不够硬

- **问题**：原脚注只说"其余各行用各品牌公开规格"。但榜单里既有**你们自己持有的 FDA 510(k) 数据**，又有**未经你们实测的竞品自报数**，读者/竞品容易质疑"以厂商身份做竞品排名"的中立性。
- **改为**：脚注重写为 `Sources: …`，明确三点：
  1. RoseSkinCo Lumi 那行是**你们持有的 FDA 510(k) K222537** 数据；
  2. 其余各行是**各品牌自报规格，你们未独立做台架测试**；
  3. Tria 4X **是激光不是 IPL**。
  （保留原有的「Fitzpatrick I–IV 自家基线」免责段，未改其口径。）

## 二、未改动但**需要你决定**的问题（涉及医学主张，我没有擅自改）

**跨语种「适用肤色」数据不一致。** 竞品行的 Fitzpatrick 范围在各语种间对不上：

| 行 | en | it | de | fr | es | ja |
| --- | --- | --- | --- | --- | --- | --- |
| Braun Silk Expert Pro 5 | **I–IV**（sensor） | **I–IV** | I–V | I–V | I–V | I–IV |
| Philips Lumea 9900 | **I–IV**（sensor） | **I–IV** | I–V | I–V | I–V | I–IV |
| SmoothSkin Pure Fit | **I–IV** | **I–IV** | I–V | I–V | I–V | I–IV |

- **成因已查明**：提交 `19c965a6 fix(it): sync Fitzpatrick I-IV and fix content pollution for Italian blog`（标题只提意大利语）**顺带把英文文件的 Braun / Philips / SmoothSkin 三行从 I–V 改成了 I–IV**，但 de / fr / es / ja 等语种仍是 I–V，于是出现了跨语种分歧。
- **英文文件本身自洽**（三行都是 I–IV，且与 22 语种的 Fitzpatrick 收敛方向一致），所以**我判断英文是"新"的一侧，其他语种是滞后**。
- **但我没有去改**，原因：这是**医疗器械适用肤色主张**，属合规风险区；公开渠道（含厂商手册 PDF 抓取失败）不足以让我确认 Braun/Philips/SmoothSkin 官方到底写 I–IV 还是 I–V。
- **建议你二选一后批量处理**：①若英文正确 → 把 de/fr/es/ja 等语种对齐为 I–IV；②若竞品自报确为 I–V → 把英文改回并按需补"(sensor)"限定。**需要以各品牌官方手册/规格页为准**，不要凭语感定。

## 三、明确**没做**的改动

- **没有给正文加可见 FAQ 小节**：核查了英文目录下 **17 篇**带 `faqs:` frontmatter 的文章，**0 篇**在正文重复 FAQ —— 站点模式是「FAQ 只放 frontmatter，由模板渲染 + 出 FAQPage」。加正文 FAQ 会与模板重复，故不加。
- **没有动标题与 slug**（理由见 2）。
- **没有动 7 个产品行的规格数字**（能源、闪次、价格）：这些是各品牌自报数，本次修订不含核实工作。
- **没有动内链格式**：11 条内链均为无尾斜杠形式，与 Astro `trailingSlash: 'never'` 配置一致，正确。

## 五、22 语种同步（第二轮，2026-10-12）

### 用户决定

Tria 4X 是 810nm 二极管**激光**，不是 IPL，因此**与 Ulike 一并从本文移除**；改完同步全部小语种翻译。

### 影响范围

`astro/src/content/blog/<locale>/45-best-ipl-hair-removal-device.mdx`，**22 个语种**：
`ar cs de el en es fa fr he id it ja ko nl pl pt-BR pt-PT ro ru th tr vi`

### Phase 1 —— 结构性删除（脚本化，22 语种一致）

每个语种删除 **33 行**：

| 删除对象 | 说明 |
| --- | --- |
| 榜单第 6 项 `**Tria 4X** …` | 并把原第 7 项顺延为 `6.` |
| 规格表 `\| Tria 4X \| …` 行 | |
| `### #6 Tria 4X …` 独立章节 | 整节（11 行），并把其后 `### #7` 顺延为 `### #6` |
| **整个「IPL vs 激光」小节** | 该节唯一设备示例就是 Tria 4X，且节末段落明说 "Choose laser if…" —— 本文既然只讲 IPL，留着会变成推荐激光的悬空段落。**这是超出字面要求的一步，如需保留该对比小节请回退本节** |
| Ulike FAQ 条目 | YAML frontmatter 格式（19 语种）与正文粗体格式（cs / it / pl）都支持 |

顺带修复：删除小节时吞掉的行尾空行导致 **22 个语种的 `## Does At-Home IPL…` 标题失去前置空行**（Markdown 下会被并入上一段），已逐语种补回。

### Phase 2 —— 逐语种本地化改写（并行 21 个子代理，按 `docs/i18n/` 规范）

每个语种改 **3 处**，**逐语种独立撰写，未机翻**：

1. **导语段**：从 2026 最佳设备枚举中移除 Tria 4X，其余设备名与顺序不动，并处理该语言的连词（`and`/`und`/`et`/`și`/`y`/`и`/`και`/`および`/`ve`…）使之正确附着到新的末项。
2. **结论段**：删除推荐 Tria 4X 的尾句，保证不留悬空连词或逗号；个别语种为保持语法正确做了极小的助词调整（如韩语补宾语助词 `를`）。
3. **frontmatter 计数**：各语种 `citableSummary` 里"**七台设备**"的声明改为"**六台**"（en "Seven devices"、ko "7개 기기"、de "Sieben Geräte"、ja "7機種"…）。

工作说明书留存于 `docs/i18n/PHASE2-BRIEF-45-best-ipl.md`，可作同类 i18n 同步的模板。

### 校验结果（全部通过）

| 校验项 | 结果 |
| --- | --- |
| `scripts/check-frontmatter.mjs` | exit 0 —— 扫描 1540 篇，待修复 0 |
| `js-yaml` + `@mdx-js/mdx` 编译 | **22/22 通过，0 失败** |
| `Tria 4X` 残留 | 22 语种全部 **0** |
| `Ulike` 残留 | 22 语种全部 **0** |
| 榜单项数 / 章节数 / 编号 | 22 语种全部 `6 / 6 / #123456` |
| 标题前置空行 | 22 语种全部修复 |

`git diff --stat`：22 files changed, **110 insertions(+), 814 deletions(-)**（纯删除为主，插入为补空行与改写后的句子）。

### 已知的**遗留项**（本次未动，需你决定）

以下仍在正文里提到激光，但**都不是设备推荐**，且不在本次授权范围内，故原样保留：

1. **榜单里 SmoothSkin Pure Fit 的推荐语**含"IPL 与激光之间的灵活性"（各语种对应表述，如 en `Best for speed and IPL vs laser flexibility`）。这是描述该设备的模式切换能力，不是推荐激光设备。
2. **5 年成本表**里的 `Salon laser`（美容院激光）作为价格基准行。
3. **AAD 外链 URL** 本身含 `laser-hair-removal-faqs`。

若你要把"只出现 IPL"贯彻到底，这三类需要单独一轮；但 2 与 3 属于对照/来源引用，删掉会损伤成本论证的可信度，建议保留。

### 安全问题（关于该对比小节）

删除"IPL vs 激光"整节是我基于用户意图做的**判断**，因为它在该节末尾明确推荐激光，与"移除激光设备"冲突。
如需恢复，该节在 HEAD 中完整存在，可单独取回；但它引用的 `/blog/30-ipl-vs-laser-which-is-safer` 内链会随之回来（已核查：删除后**没有**留下悬空内链）。
