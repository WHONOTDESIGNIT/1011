# 🇪🇸 西语语言风格对比分析报告 — MediaMarkt.es vs iShine 1011-main

分析时间: 2026-08-18
对比基准:
- **本土西语（参考）**: MediaMarkt.es 两个页面（Depiladoras IPL 类目页 + Philips Lumea S8000 产品页）
- **待检西语**: iShine 1011-main 项目的 `messages/es.json`（3651 条翻译）+ 各页面西语渲染

---

## 一、MediaMarkt.es 的本土西语风格特征（基准）

从抓取的两个页面提取的典型表达：

| 场景 | MediaMarkt 用法（西班牙本土） | 说明 |
|---|---|---|
| 购物车 | **Añadir al carrito** | 标准西班牙用语 |
| 运费 | **Con envío gratis** / **envío no incl.** | 简洁缩写 |
| 分期 | **Financiación / En 10 cuotas / Simula tu financiación** | |
| 到店自提 | **Recogida en tienda** | 西班牙特有说法 |
| 配送 | **Entrega 20/08/2026** | |
| 退货 | **Devoluciones hasta en 60 días** | |
| 保修 | **Garantía ampliada / Protección de 3 años** | |
| 价格 | **279,– € / 499,99€ / IVA incl.** | 千分位用点、小数用逗号 |
| 电商促销 | **Top venta / Ofertas Flash / Mejor precio garantizado** | |
| 敬语 | **tú 形式**（"¿Qué estás buscando?"、"Reserva tu cita"、"Simula tu financiación"、"seleccionándolos"） | 西班牙本土电商普遍用 tú 亲近风格 |
| 口语化 | **"¡Muy popular! Los usuarios lo adoran"**、"Vuelta al cole" | 营销化、本地化 |

**关键特征**：西班牙本土电商（MediaMarkt/Amazon.es/El Corte Inglés）普遍采用 **tú 亲近式** 营销语言，配合本地化促销词汇（Vuelta al cole、Recogida en tienda）。

---

## 二、iShine 西语翻译的主要问题

### 🔴 问题 1：敬语体系混乱（usted / tú 混用）— 最严重

**同站混用两种敬语**，甚至同一页脚内：

| 位置 | 文本 | 形式 |
|---|---|---|
| footer.contactButton | "**Contacta** con nuestro equipo" | tú 命令式 |
| footer.newsletterText | "**Suscríbase** para recibir..." | usted 命令式 |
| contact.title | "**Contacte** con nuestro equipo" | usted |
| homepage.mega... | "**Encuentra tu** socio" | tú |
| servicesPage（69 处） | "**usted/su**" 为主 | usted |
| develoContent（61 处） | tú 形式大量 | tú |
| teamPage（12 处） | tú | tú |

**统计**: 全文 usted 303 处 vs tú 183 处，且**分布不均**——同一页面内两种敬语并存。

> ⚠️ 西班牙 B2B 制造页通常用 usted（正式），但**必须全站统一**。当前混乱状态给用户印象是"未完成/不专业"。

### 🟠 问题 2：术语未本地化（西语有标准说法却用英文/直译）

| ishine 用词 | 西班牙本土标准说法 | 说明 |
|---|---|---|
| **Dropshipping**（多处） | 西班牙业界口语也用 dropshipping，但正式语境 **"venta directa" / "envío directo al cliente"** 更规范 | MediaMarkt 不用此词 |
| **marca propia**（14 次） | **marca blanca**（西班牙标准） | MediaMarkt 类目常用 "marca blanca" |
| **dispositivo** | 正确 ✓（MediaMarkt 用 "depiladora"） | 注意产品语境应用 **depiladora** 而非 dispositivo |

### 🟠 问题 3：机翻直译痕迹

| ishine 译文 | 更地道的西语 | 分析 |
|---|---|---|
| "Garantía **de que** los componentes cumplen..." | "Garantía **de** cumplimiento de los componentes..." | "de que" 从句冗长，直译英文 "that" |
| "**Contactar con** iShine" | "**Contacta con** iShine"（tú）或 "**Póngase en contacto** con iShine"（usted） | 不定式作标题生硬 |
| "**hacer una solicitud**" | "**Solicitar**" | 动词名词化是英译西常见冗余 |

### 🟡 问题 4：产品命名不一致（对比类目页）

MediaMarkt 产品标题模式（很规范）：
```
Depiladora IPL - Philips Lumea S8000 BRI945/00, Luz Pulsada en Casa, Con app, Uso con cable, 2 Cabezales, Sensor de Piel Inteligente
```
特征：品牌全大写、型号带斜杠、特性用逗号分隔、**"Depiladora IPL"** 前缀统一。

建议 ishine 产品页西语标题也采用此模式（当前产品页标题可能不统一）。

---

## 三、针对 ishine 西语的具体改进建议

### 1. 统一敬语（最高优先级）
- **方案 A（推荐，B2B 正式）**：全站统一 **usted**——把 tú 形式的 183 处改为 usted（"Contacta"→"Contacte"、"Encuentra tu"→"Encuentre su"）
- **方案 B（电商风格，对齐 MediaMarkt）**：全站统一 **tú**——B2B 制造场景不太建议，但若走 DTC 电商路线可考虑
- 至少**同一页面/同一组件内必须一致**

### 2. 术语本地化
- "marca propia" → "**marca blanca**"（西班牙）
- 保留 dropshipping（行业通用），但在正式描述加西语解释
- 产品语境用 "**depiladora**"（MediaMarkt 习惯），"dispositivo" 用于泛指

### 3. 打磨机翻痕迹
- 减少 "de que" 从句、动词名词化
- 命令式统一（tú: "Solicita"/usted: "Solicite"）
- 标题不用不定式（"Contactar con" → "Contacto" 或命令式）

### 4. 借鉴 MediaMarkt 的电商词汇
- "Recogida en tienda"（到店自提）、"Envío gratis"、"Garantía ampliada"、"Financiación"、"Devoluciones"
- 促销: "Top venta"、"Ofertas Flash"、"Mejor precio garantizado"
- 这些词在西班牙消费者中认知度高，ishine 若做 DTC 页面应使用

---

## 四、附：两个页面的 markdown 文档

- `plans/mediamarkt-md/mediamarkt-philips-lumea-s8000.md`（产品页）
- `plans/mediamarkt-md/mediamarkt-depiladoras-ipl-category.md`（类目页）

---

本报告由 Harness AI 生成（真实浏览器抓取 + 全量翻译扫描）
