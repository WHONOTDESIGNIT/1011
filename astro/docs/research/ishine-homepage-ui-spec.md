# iShine 首页 UI 设计规范（Homepage Design Specification）

> 适用范围：iShine 官网首页 `src/pages/index.astro`
> 规范基准：页面内 `<style>` 全局样式 + 内联样式，与线上实际渲染一致
> 断点约定：桌面 ≥1200px ｜ 平板 768px–1199px ｜ 移动 <768px（实际媒体查询见各表内标注）

---

## 0. 前置说明：全局设计规则（跨 Section 复用）

### 0.1 设计令牌（`:root` 变量）

| 令牌 | HEX | RGB | 用途 |
|---|---|---|---|
| `--blue` | `#563cfa` | `rgb(86,60,250)` | 主品牌色（按钮、链接、图标） |
| `--blue-100` | `#c6bff8` | `rgb(198,191,248)` | 主色浅一档（未在首页直接使用） |
| `--blue-50` | `#edebfc` | `rgb(237,235,252)` | 主色极浅（未在首页直接使用） |
| `--black` | `#020303` | `rgb(2,3,3)` | 主文本色 / 深色区块背景 |
| `--white` | `#ffffff` | `rgb(255,255,255)` | 白色背景 / 反白文本 |
| `--grey-50` | `#f9fafb` | `rgb(249,250,251)` | 浅灰卡片底（mega 卡、资质项） |
| `--grey-100` | `#f3f4f6` | `rgb(243,244,246)` | 浅灰底（图片占位、tech 区背景） |
| `--grey-200` | `#e5e7eb` | `rgb(229,231,235)` | 分割线 / 卡片边框 |
| `--grey-700` | `#374151` | `rgb(55,65,81)` | 按钮 hover 态品牌深色 |

**未入令牌的硬编码色**：

| 色值 | RGB | 用途 |
|---|---|---|
| `#6b7280` | `rgb(107,114,128)` | 二级文本（描述、辅助说明） |
| `#b4b4b4` | `rgb(180,180,180)` | 三级文本（页脚版权、公司名） |
| `#0f172a` | `rgb(15,23,42)` | tech-card 主文本 |
| `#aeaeae` | `rgb(174,174,174)` | 案例卡 overlay 标签底色 |
| `#d1d5db` | `rgb(209,213,219)` | Mega 卡片图片占位底 |
| `rgba(255,255,255,.7)` | — | 深色底二级文本（统计卡 label） |
| `rgba(255,255,255,.8)` | — | 深色底三级文本（统计卡 CTA） |
| `rgba(255,255,255,.1)` | — | 深色底图标占位块（expertise） |
| `rgba(74,98,211,.1)` | — | 移动菜单遮罩 |
| `rgba(86,60,250,.2)` | — | 引用图标填充 |

### 0.2 间距令牌与容器宽度

| 令牌 | 值 | 说明 |
|---|---|---|
| `--pad-100` | `100px` | 桌面容器水平内边距 |
| `--pad-40` | `40px` | 平板容器水平内边距 |
| `--pad-24` | `24px` | 移动容器水平内边距 |
| `--nav-top` | `66px` | 顶部信息条高度（Top Bar） |
| `--nav-h` | `70px`（≤767px：`56px`） | 导航栏高度 |
| `--max-w` | `1536px` | 全站最大内容宽度 |
| 桌面 header 最大宽 | `1400px` | 导航条最大宽度 |

### 0.3 字体体系

| 角色 | 字体家族 | 字重加载 | 用途 |
|---|---|---|---|
| 正文 / UI | `Manrope` | 400 / 500 / 600 / 700 | 正文、导航、按钮、标签 |
| 标题 / 展示 | `Syne` | 400 / 700 | 区块大标题、卡片名、数字 |

- 加载方式：Google Fonts `Manrope:wght@400;500;600;700` + `Syne:wght@400;700`
- 全局默认：`body{font-family:Manrope,-apple-system,Roboto,Helvetica,sans-serif;font-size:16px;font-weight:400;color:#000;background:#fff;-webkit-font-smoothing:antialiased}`
- 字距规范：Syne 大标题统一 `letter-spacing` 约为 `-(字号 × 0.01)`（如 48px → -0.48px）

### 0.4 响应式断点体系（全站）

| 断点 | 影响 |
|---|---|
| `max-width:1279px` | 容器水平 padding `100px → 40px`；部分网格列数缩减 |
| `max-width:959px` | 两栏布局 → 单栏；产品卡 4 列 → 2 列；Mega 下拉隐藏 |
| `max-width:768px` | Trust Bar slide 缩小（padding 10px 16px、文本 14px） |
| `max-width:767px` | `--nav-h:56px`；`--pad-100:var(--pad-24)`；多数标题降级 |
| `max-width:698px` | header-inner 高 56px、site-header 宽 `calc(100% - 32px)`、移动面板 top 130px |
| `min-width:768px` / `min-width:1280px` | 桌面增强布局（hero 侧排、stat 卡横滑等） |

### 0.5 全局背景渐变（`gradient-bg`）

- 定位：`position:fixed; inset:0; z-index:-1; pointer-events:none`
- 5 层径向渐变（`ellipse`，45% 衰减至透明）：

| 中心位置 | 颜色（rgba） |
|---|---|
| `20% 30%` | `rgba(0,56,255,.09)` |
| `70% 50%` | `rgba(55,127,255,.08)` |
| `15% 70%` | `rgba(127,48,255,.09)` |
| `80% 80%` | `rgba(242,80,110,.08)` |
| `75% 20%` | `rgba(255,128,0,.08)` |

### 0.6 通用小标题（Section Eyebrow，`.small-title`）

- 结构：菱形图标（`.diamond-icon` 16×17px，填充 `#020303`；深色底用 `#fff`）+ 文本
- 样式：`Manrope 16px / 400 / #020303 / line-height 25px`（CSS 基类 `18px/26px`，首页实际经内联样式为 16px）
- 间距：图标与文本 `gap:12px`；`padding:3px 0`；各 section 下方 `margin-bottom:20–24px`

### 0.7 通用胶囊按钮体系

**基类 `.btn`**：`Manrope 16px/400` ｜ `line-height:16px` ｜ `border-radius:100px` ｜ 图标 `gap:6px` ｜ hover 时 `gap:12px` ｜ `transition:all .25s` ｜ `white-space:nowrap`

| 变体 | 背景 | 文字 | 内边距 | 边框 | Hover |
|---|---|---|---|---|---|
| `.btn-primary` | `#563cfa` | `#fff` | `12px 20px` | 无 | `background:#374151` |
| `.btn-secondary` | 透明 | `#020303` | `11px 20px` | `1px solid #020303` | `background:#e5e5e5` |
| `.btn-cta`（Header） | `#563cfa` | `#fff` | `12px 20px` | 无 | `background:#374151;gap:12px` |
| `.our-work-link`（描边蓝） | 透明 | `#563cfa` | `12px 20px` | `1px solid #563cfa` | `background:#563cfa;color:#fff;gap:12px` |

**箭头图标规范**：16×16px 45° 上箭头，`stroke:currentColor;stroke-width:1.5`，`stroke-linecap/linejoin:round`

---

## 1. 首页导航栏（Top Bar + Site Header）

### 1.1 Top Bar（Trust Bar）

**容器（`.trust-bar`）**

| 属性 | 值 |
|---|---|
| 定位 | `position:fixed; top:0; left:0; right:0; z-index:100` |
| 高度 | `60px`（固定） |
| 背景 | 透明（`transparent`） |
| 指针 | `pointer-events:none` |
| 动画 | `transition:opacity .1s ease, transform .1s ease; will-change:opacity,transform` |
| 隐藏态 | `.trust-bar-hidden{opacity:0; transform:translateY(-100%)}` |

**轮播 Slide（`.trust-slide`）**：首页共 3 条（`Global Shipping` / `Private Label` / `ChatGPT Top Collection`）

| 属性 | 桌面 | 移动 ≤768px |
|---|---|---|
| 布局 | `display:flex; justify-content:center; align-items:center` | 同左 |
| 内边距 | `12px 24px` | `10px 16px` |
| 图标间距 | `gap:8px` | 同左 |

**文本（`.trust-text`）**

| 属性 | 桌面 | 移动 ≤768px |
|---|---|---|
| 字体 | Manrope 400 | 同左 |
| 字号 | `16px` | `14px` |
| 行高 | `25px` | `21px` |
| 颜色 | `#020303` | 同左 |

**图标**：24×24px，`stroke:currentColor;stroke-width:1.5;stroke-linecap/linejoin:round`

**交互规则**：
- 轮播：`setInterval 3000ms` 循环，仅 `aria-hidden="false"` 的 slide 显示（硬切换，无位移动画）
- 滚动隐藏：`scrollY===0` 时显示；离开顶部时隐藏（debounce 100ms），联动 Site Header 上移

### 1.2 Site Header（主导航条）

**外层（`.site-header`）**

| 属性 | 桌面 ≥1200 | 移动 ≤698px |
|---|---|---|
| 定位 | `fixed; top:66px; left:50%; translateX(-50%); z-index:110` | 同左 |
| 宽度 | `calc(100% - 48px)`，`max-width:1400px` | `calc(100% - 32px)` |
| 隐藏态 | `.site-header-top-hidden{top:0}` | 同左 |
| 动画 | `transition:top .1s ease; will-change:top` | 同左 |

**内容容器（`.header-inner`）**

| 属性 | 桌面 | 移动 ≤698px |
|---|---|---|
| 高度 | `70px` | `56px` |
| 内边距 | `0 24px 0 40px` | `0 24px 0 32px` |
| 背景 | `#ffffff` | 同左 |
| 圆角 | `40px`（胶囊） | 同左 |
| 阴影 | `0 10px 24px rgba(2,3,3,.06)` | 同左 |
| 布局 | `flex; align-items:center; justify-content:flex-start` | 同左 |

**Logo（`.header-logo`）**：高度 `calc(100% - 12px)`（桌面 `58px`、移动 `44px`）；`img{height:100%;width:auto;object-fit:contain}`；路径 `/images/logos/ishine-logo.png`

**导航区（`.header-main-nav` → `.header-nav`）**

| 属性 | 值 |
|---|---|
| 布局 | `flex; align-items:center; justify-content:flex-end; margin-left:auto` |
| 导航间距 | `gap:38px`（主导航区） |
| 项间距 | `gap:8px`（`.header-nav` 内） |

**导航项（`.nav-item`）**

| 属性 | 值 |
|---|---|
| 字体 | Manrope 16px / 400 |
| 颜色 | `#020303` |
| 行高 | `25px` |
| 内边距 | `12px 16px` |
| 圆角 | `8px` |
| 图标间距 | `gap:4px` |
| Hover | `background:rgba(0,0,0,.04)` |
| 下拉箭头 | 12×7px chevron，`stroke:#020303;stroke-width:1.5`；hover 时 `rotate(180deg)` |

**导航项列表（首页）**：Products（下拉）/ Services（下拉）/ About（下拉）/ Resources（下拉）/ Our Work（普通链接）

**Header CTA（`.btn-cta`）**：见 0.7；文本 `Get in touch`；图标 16×16 `stroke:#fff`

**汉堡按钮（`.nav-collapse-btn`）**

| 属性 | 值 |
|---|---|
| 尺寸 | 40×40px（min/max 同值） |
| 圆角 | `100px`（圆形） |
| 背景 | `#563cfa`（open 态 `#374151`） |
| 图标 | 20×20px，`stroke:#fff;stroke-width:1.5` |
| 定位 | `absolute; top:50%; right:24px; translateY(-50%)` |
| 默认态 | `opacity:0; visibility:hidden`（仅 `.header-menu-only` 时显示） |

**自适应折叠（`.header-menu-only`）**：JS 测量导航所需宽度，空间不足时隐藏 `.header-main-nav`（`opacity:0;visibility:hidden`）并显示汉堡按钮；通过 `ResizeObserver` 监听 `header-inner / header-logo / header-main-nav`，并派发 `layout:header-metrics` 自定义事件供 Hero 联动。

### 1.3 Mega Dropdown（桌面下拉）

**通用面板（`.mega-dropdown`）**

| 属性 | 值 |
|---|---|
| 定位 | `absolute; top:calc(100% + 12px); left:50%; translateX(-50%)` |
| 最小宽度 | `640px`（Products 宽版 `800px`） |
| 背景 | `#ffffff` |
| 圆角 | `20px` |
| 阴影 | `0 20px 40px rgba(2,3,3,.15)` |
| 默认态 | `opacity:0; visibility:hidden; translateY(4px)` |
| 显示态 | hover 面板或 `.open`：`opacity:1; visibility:visible; translateY(0)`，`transition:opacity .2s, transform .25s` |
| 层级 | `z-index:120` |
| 响应式 | `≤959px` 时 `display:none !important` |

**Products 宽版（`.mega-dropdown--wide`）**

| 断点 | 最小宽度 |
|---|---|
| 桌面 | `800px` |
| ≤1279px | `720px` |
| ≤1099px | `640px` |

**面板内衬（`.mega-inner`）**

| 版本 | 内边距 | 内部间距 |
|---|---|---|
| 普通版 | `36px 40px` | 左右栏 `gap:60px` |
| Products 版（`.mega-inner--products`） | `24px 24px 24px 28px` | 左侧纵向 `gap:14px` |

**链接组（`.mega-link`）**

| 属性 | 值 |
|---|---|
| 内边距 | `10px 14px`（Products 版 `10px 12px`） |
| 圆角 | `10px` |
| Hover | `background:rgba(0,0,0,.04)` |
| 标题（`.mega-link-title`） | Manrope 18px / 500 / `#020303` / 行高 26px |
| 描述（`.mega-link-desc`） | Manrope 14px / 400 / `#6b7280` / 行高 21px |
| 组内间距 | `gap:4px` |
| 加号（`.mega-plus`） | 20px、`#020303`、28×28px 居中（装饰隐藏 `color:transparent`） |

**右侧卡片（`.mega-card`）**

| 属性 | 值 |
|---|---|
| 背景 | `--grey-50`（`#f9fafb`） |
| 圆角 | `14px` |
| 内边距 | `22px` |
| 内部间距 | `gap:12px` |
| 标题 | Syne 21px / 400 / `#020303` / 行高 27px |
| 描述 | Manrope 14px / `#6b7280` / 行高 21px |
| 按钮 | Manrope 16px / `#563cfa` / `padding:10px 18px` / 圆角 100px；hover：`background:#563cfa;color:#fff;gap:12px` |
| 图片占位 | 高 `160px`、圆角 `10px`、`background:#d1d5db` |
| 右栏宽 | `260px` |

**Products 产品卡（`.mega-product-card`）**

| 属性 | 值 |
|---|---|
| 布局 | `flex; gap:12px; padding:10px 12px; border-radius:10px` |
| Hover | `background:rgba(0,0,0,.04)` |
| 型号 | Manrope 16px / 500 / `#020303` / 行高 24px（超长省略号） |
| 标语 | Manrope 13px / `#6b7280` / 行高 19px（超长省略号） |
| 缩略图 | 60×60px、圆角 10px、`background:--grey-100` |
| 网格 | 两列 `1fr 1fr`，`gap:6px 14px` |

**组件卡（`.mega-component-card`）**：纵向 `gap:6px`、`padding:8px`、圆角 10px；缩略图 44×44px 圆角 8px；名称 Manrope 12px/500/行高 16px；网格 4 列 `gap:8px`。

**分隔线**：横向 `.mega-divider-h` 高 1px 色 `--grey-200`；竖向 `.mega-divider` 宽 1px 色 `--grey-200`、`margin:0 24px`。

**Services 右栏（`.mega-services`）**：组标题 Syne 13px/大写/`#6b7280`/`letter-spacing:.5px`；链接 Manrope 15px/`#020303`/`padding:7px 14px`/圆角 10px，hover `background:rgba(0,0,0,.04);color:#563cfa`。

### 1.4 移动菜单（Mobile Menu Panel）

**遮罩（`.mobile-menu-overlay`）**：`position:fixed; inset:0; background:rgba(74,98,211,.1); z-index:108`；默认 `opacity:0; visibility:hidden`。

**面板（`.mobile-menu-panel`）**

| 属性 | 默认 | 移动 ≤698px |
|---|---|---|
| 定位 | `fixed; top:148px; left:50%; translateX(-50%)` | `top:130px` |
| 宽度 | `calc(100% - 48px)`，`max-width:520px` | `calc(100% - 32px)` |
| 背景 / 圆角 | `#fff` / `20px` | 同左 |
| 阴影 | `0 20px 40px rgba(2,3,3,.15)` | 同左 |
| 内边距 | `20px` | `18px` |
| 内部间距 | `gap:8px` | 同左 |
| 高度限制 | `max-height:calc(100vh - 160px); overflow-y:auto` | 同左 |
| 层级 | `z-index:115` | 同左 |

**手风琴组（`.mobile-menu-group`）**：组间 `border-bottom:1px solid #e5e7eb`（末组无）；切换按钮/链接 `Manrope 18px/400/#020303/行高 26px`、`padding:14px 12px`、圆角 10px、hover `background:rgba(0,0,0,.04)`；chevron 12×7px open 时 `rotate(180deg)`。

**子菜单（`.mobile-submenu`）**：`max-height:0 → 560px`（open 态，`transition:max-height .3s` + `padding-bottom:12px`）；子链接 `padding:10px 12px 10px 24px`、圆角 10px；标题 Manrope 16px/500/行高 24px；描述 13px/`#6b7280`/行高 19px。

**CTA（`.mobile-menu-cta .btn-cta`）**：`width:100%; justify-content:center`。

**交互规则**：点击汉堡开/关；点击遮罩关闭；`Escape` 关闭；点击任意链接关闭；打开时 `body{overflow:hidden}`。

---

## 2. Hero 区块（`.hero`）

### 2.1 区块容器

| 属性 | 桌面 ≥1280px | 平板 768–1279px | 移动 <768px |
|---|---|---|---|
| 内边距 | `padding:141px 0 24px`（容器宽 `calc(100% - 48px)`、`max-width:1400px`、居中） | `padding:141px var(--pad-40) 24px` | 默认 `141px 0 24px`；≤959px `141px var(--pad-24) 24px`；≤698px `127px var(--pad-24) 24px` |
| 布局 | `flex; flex-direction:row; align-items:flex-start; gap:32px`（`min-width:1280px`） | `flex; flex-direction:row; gap:20px`（`min-width:768px`） | 默认块级（`.hero-wrapper` 居中，`max-width:1280px`） |
| z-index | `1` | 同左 | 同左 |
| 自定义属性 | `--hero-header-width:1400px; --hero-container-width:700px; --hero-container-left:calc(50vw - 700px); --hero-tablet-lock-width:700px; --hero-video-overlap:0px` 等 | 同左 | 同左 |

### 2.2 白色内容容器（`.hero-white-container`）

| 属性 | 桌面 ≥1280px | 平板 768–1279px | 移动 <768px |
|---|---|---|---|
| 宽度 | `700px` | `420px`（固定） | 动态 `min(100vw - 48px, 699px)`，`min-width:280px` |
| 异形裁剪 | `clip-path:url(#heroClipPc)`（上圆角 6%、底部曲线 8%） | `#heroClipTablet` | `#heroClipMobile` |
| 投影 | `drop-shadow(0 24px 48px rgba(2,3,3,.16))` | `drop-shadow(0 18px 36px rgba(2,3,3,.14))` | 同平板 |
| 过渡 | `transition:width .32s, max-width .32s, margin-left .32s, filter .32s` | 同左 | 同左 |

**内容卡（`.hero-content-card`）**

| 属性 | 桌面 | 移动 ≤959px |
|---|---|---|
| 内边距 | `40px 40px 34px` | `28px 24px 24px` |
| 内部间距 | `gap:24px` | `gap:20px` |
| 入场动画 | `fadeIn .8s ease-out`（`opacity:0; translateY(20px)` → 归位） | 同左 |

### 2.3 字体规范

| 元素 | 字体 | 桌面 | 平板（header 折叠时） | 移动 <768px |
|---|---|---|---|---|
| Eyebrow（h1） | Manrope 400 | `16px / 行高 25px / #020303`（含菱形图标，`gap:12px`） | 同左 | 同左 |
| 主标题 `.hero-title-main`（h2） | Syne 400 | `54px / 60px / -0.54px`（compact：`52px/58px/-0.52px`） | `52px/58px/-0.52px`（compact） | `36px / 42px / -0.36px` |
| 按钮 | Manrope 400 | `16px / 行高 16px` | 同左 | 同左 |

**标题区（`.hero-heading`）**：`flex; flex-direction:column; gap:16px`。

**按钮区（`.hero-buttons`）**：`flex; gap:12px; flex-wrap:wrap`（≤959px 纵向排列）。主按钮 `What we do`（btn-primary），次按钮 `Book a call`（btn-secondary，hover 时箭头图标展开 `width:16px`，`transition:width .25s`）。

### 2.4 视频区（`.video-section`）

| 属性 | 值 |
|---|---|
| 宽度 | `max-width:960px`（平板模式 `80%` 居中） |
| 外边距 | `margin-top:calc(var(--hero-video-overlap) * -1)`（负重叠覆盖） |
| 占位容器 | `border-radius:20px; background:#e5e7eb` |
| 视频属性 | `autoplay muted loop playsinline`，1280×720，源 `/videos/head-video.mp4`，`object-fit:cover` |

### 2.5 交互规则

- JS 计算 `--hero-container-width / --hero-container-left`，实现两段式过渡：桌面居中 700px → 平板锁宽跟随 header（`headerWidth ≤699px` 时 tablet 模式）→ 移动左对齐自适应
- 标题紧凑切换：平板且视口 `< 2.2×容器宽` 时启用 `.hero-title-compact`（52px）
- 监听 `resize` 与 `layout:header-metrics` 事件联动

---

## 3. 功能介绍区（What We Do，`.what-we-do`）

### 3.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#fff`（伪元素全宽 `inset:0 50%` + `margin:-50vw` 延伸） | 同左 | 同左 |
| 布局 | `flex; gap:40px`（左右 50%/50%） | `flex-direction:column; gap:32px` | 同左 |
| 内边距 | `60px 100px` | `60px 40px` | `40px 24px` |
| 最大宽度 | `1536px` 居中 | 同左 | 同左 |

**右列视觉**：`position:sticky; top:136px`（桌面，平板恢复 `static`）；容器 `aspect-ratio:1/1; border-radius:16px; overflow:hidden`；多图切换 `opacity .35s` 过渡。

### 3.2 字体规范

| 元素 | 字体 | 桌面 | 移动 ≤767px |
|---|---|---|---|
| 小标题 | Manrope 16px/400（见 0.6） | 同左 | 同左 |
| 标题 `.wwd-heading` | Syne 400 | `48px / 52px / -0.48px / #020303`，`margin:0 0 24px` | `36px / 42px / -0.36px` |
| 服务项标题（h3） | Syne 400 | `21px / 27px / #020303` | 同左 |
| 展开正文（p） | Manrope 400 | `16px / 25px / #020303`，`padding-bottom:8px` | 同左 |
| 展开 CTA | Manrope 400 | `14px / 21px / #020303`，`padding-bottom:12px` | 同左 |

### 3.3 服务列表交互（`.wwd-service-item`）

| 状态 | 规则 |
|---|---|
| 默认 | 标题下 `border-bottom:1px solid #020303`，`padding-bottom:4px`；箭头 16×16px `opacity:0` |
| Hover（未展开） | 标题 `padding-right:2em`，箭头 `opacity:1`（`transition .3s`） |
| 展开（`.open`） | 标题 `padding-right:5em`；正文 `max-height:0 → 200px`（`transition:max-height .4s`）；CTA 加下划线 `text-underline-offset:3px` |
| CTA Hover | 文字变 `#563cfa`，14×14px 箭头 `opacity:1` |

**自动轮播**：初始展开第 1 项，每 6s 自动展开下一项；用户点击后按点击项重启轮播。

### 3.4 底部按钮

`btn-primary`（`View all services`），`align-self:flex-start; margin-top:24px`。

---

## 4. 产品展示区（Product Showcase，`.product-showcase`）

### 4.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤1279/959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#fff`，`padding:60px 0` | 同左 | 同左 |
| 容器内边距 | `0 100px` | `0 40px` | `0 24px` |
| 最大宽度 | `1536px` 居中 | 同左 | 同左 |

### 4.2 字体规范

| 元素 | 字体 | 桌面 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|---|
| 小标题 | Manrope 16px/400（`margin-bottom:20px`） | 同左 | 同左 | 同左 |
| 标题 `.product-showcase-heading` | Syne 400 | `48px / 52px / #020303`，`margin:0 0 12px` | `36px / 42px` | `28px / 34px` |
| 描述 `.product-showcase-desc` | Manrope 400 | `16px / 25px / #6b7280`，`max-width:600px` | 同左 | 同左 |
| 卡片名 `.product-card-name` | Syne 400 | `21px / 27px / #020303`，`margin:0` | 同左 | 同左 |
| 卡片标语 `.product-card-tagline` | Manrope 400 | `14px / 21px / #6b7280`，`margin:4px 0 0` | 同左 | 同左 |

**头部区（`.product-showcase-header`）**：`flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:40px`。

### 4.3 轮播卡片（`.product-card-item`）

| 属性 | 值 |
|---|---|
| 宽度 | `flex:0 0 (100% - 60px)/4`（4 列）→ ≤1279px 3 列 `(100% - 40px)/3` → ≤959px 2 列 `(100% - 20px)/2` → ≤767px `80%` |
| 圆角 | `16px` |
| 边框 | `1px solid #e5e7eb` |
| 背景 | `#fff`，`overflow:hidden` |
| Hover | `translateY(-4px)` + `box-shadow:0 12px 32px rgba(0,0,0,.08)`（`transition .2s`） |
| 图片 | `aspect-ratio:4/5`，`background:#f3f4f6`，`object-fit:cover` |
| 信息区 | `padding:16px` |

**轮播轨道（`.product-carousel-track`）**：`display:flex; gap:20px`（≤767px `16px`）；`transition:transform .3s ease-out`；视口 `overflow:hidden; margin:0 -16px; padding:0 16px`（露出两侧卡片）。

**导航按钮（`.product-carousel-nav button`）**

| 属性 | 值 |
|---|---|
| 尺寸 | 44×44px |
| 圆角 | `100px` |
| 边框 | `1px solid #020303`，透明底 |
| Hover | `background:#020303; color:#fff` |
| Disabled | `opacity:.3; cursor:default`（hover 无背景变化） |
| 图标 | 20×20px `stroke:currentColor;stroke-width:2` |
| 间距 | 按钮组 `gap:12px`；`margin-top:32px` 居中 |

---

## 5. 客户案例区（Our Clients，`.our-clients`）

### 5.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#020303`（深色） | 同左 | 同左 |
| 布局 | `flex; gap:40px`（左文案 + 右 logo） | `flex-direction:column` | 同左 |
| 内边距 | `72px 100px` | `40px 40px` | `32px 24px` |
| 最大宽度 | `1536px` 居中 | 同左 | 同左 |

### 5.2 字体规范

| 元素 | 字体 | 桌面 | 移动 ≤767px |
|---|---|---|---|
| 标题 `.our-clients-heading` | Syne 400 | `32px / 38px / #fff`，`margin:0` | `24px / 30px` |
| 副文案 `.our-clients-sub` | Manrope 400 | `16px / 25px / #fff`，`margin:12px 0 0` | 同左 |

### 5.3 Logo 区（`.our-clients-logos`）

| 属性 | 桌面 | 移动 ≤767px |
|---|---|---|
| 布局 | `flex; flex-wrap:wrap; gap:32px; justify-content:flex-end`（平板 `flex-start`） | `gap:24px` |
| 图片高度 | `36px`（`width:auto; object-fit:contain`） | `28px` |
| Hover | `opacity:.8`（`transition:opacity .2s`） | 同左 |

---

## 6. 统计卡片区（Stat Cards，`.stat-cards`）

### 6.1 区块容器

| 属性 | 桌面 ≥1280px | 平板 ≤1279/959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#fff`，`padding:40px 0` | 同左 | 同左 |
| 容器内边距 | `0 100px` | `0 40px` | `0 24px` |

### 6.2 头部区（`.stat-cards-header`）

- 布局：`display:grid; grid-template-columns:minmax(0,1fr) minmax(420px,600px); gap:40px`（≤959px 单列 `gap:24px`）
- 标题 `.stat-cards-heading`：Syne 400 `48px/52px/#020303`，`max-width:550px`（≤959px `36/42`；≤767px `28/34`）
- 描述 `.stat-cards-desc`：Manrope 400 `18px/28px/#020303`，`max-width:600px`
- 按钮 `.stat-cards-cta`：蓝底胶囊（同 btn-primary），另加 `border:1px solid #563cfa`；hover `background:#374151;border-color:#374151`
- 描述列：`gap:24px` 纵向

### 6.3 统计卡（`.stat-card`）

| 属性 | 桌面 ≥1280px | 平板 / 移动 |
|---|---|---|
| 网格 | `flex` 横滑（卡宽 `(100% - 20px)/1.25`） | grid `repeat(4,1fr)` → ≤959px 2 列 → ≤767px 1 列 |
| 间距 | `gap:20px`（网格），`margin-top:60px` | 同左 |
| 内边距 | `40px` | `24px` |
| 高度 | `min-height:640px`，`aspect-ratio:1.645/1` | 自适应 |
| 圆角 | `16px` | 同左 |
| 内部间距 | `justify-content:space-between; gap:8px` | `flex; flex-direction:column; gap:8px` |

**卡内文字**

| 元素 | 桌面 ≥1280px | 默认 |
|---|---|---|
| 数字 `.stat-number` | Syne `64px / 68px / #fff` | Syne `48px / 52px / #fff` |
| 标签 `.stat-label` | Manrope `18px / 26px / rgba(255,255,255,.7)`，`max-width:80%` | Manrope `14px / 21px / rgba(255,255,255,.7)` |
| 卡内 CTA `.stat-card-cta` | Manrope `16px / 24px / rgba(255,255,255,.8)`，`margin-top:4px` | Manrope `14px / 21px / rgba(255,255,255,.8)` |

**卡片背景色（内联，共 4 张）**：`#35292b`（500K+）｜ `#020303`（FDA·CE·ISO）｜ `#bf3918`（50+）｜ `#330d6b`（20+）

### 6.4 箭头按钮（`.stat-cards-arrow`）

| 属性 | 值 |
|---|---|
| 尺寸 | 48×48px |
| 圆角 | `100px` |
| 边框 | `1px solid #e5e7eb`，`background:#fff` |
| Hover | `background:#563cfa;border-color:#563cfa;color:#fff` |
| Disabled | `opacity:.35; pointer-events:none` |
| 图标 | 18×18px `stroke:currentColor;stroke-width:1.5` |
| 位置 | 右对齐 `gap:12px; margin-top:24px`（≤1279px 隐藏） |

---

## 7. 资质认证区（Quality & Certifications，`.quality-certs`）

### 7.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#fff`，`padding:60px 0` | 同左 | 同左 |
| 容器布局 | `flex; gap:60px`（左 `flex:1; max-width:580px` + 右 `380px`） | `flex-direction:column; gap:32px` | 同左 |
| 容器内边距 | `0 100px` | `0 40px` | `0 24px` |

### 7.2 字体规范

| 元素 | 字体 | 桌面 | 移动 ≤767px |
|---|---|---|---|
| 小标题 | Manrope 16px/400（`margin-bottom:20px`） | 同左 | 同左 |
| 标题 `.quality-certs-heading` | Syne 400 | `48px / 52px / #020303`，`margin:0 0 16px` | `28px / 34px` |
| 描述 `.quality-certs-desc` | Manrope 400 | `16px / 25px / #020303`，`margin:0 0 32px` | 同左 |
| 条目标题（h4） | Manrope 600 | `18px / 27px / #020303`，`margin:0` | 同左 |
| 条目描述（p） | Manrope 400 | `14px / 21px / #6b7280`，`margin:4px 0 0` | 同左 |
| 徽标标签 | Manrope 600 大写 | `12px / letter-spacing:.1em / #563cfa` | 同左 |
| 徽标值 | Syne 400 | `24px / 30px / #020303` | 同左 |

### 7.3 组件样式

**条目（`.quality-certs-item`）**

| 属性 | 值 |
|---|---|
| 布局 | `flex; gap:16px; padding:20px` |
| 背景 / 圆角 | `#f9fafb` / `14px` |
| 图标容器 | 40×40px、圆角 `12px`、`background:#563cfa` |
| 图标 | 20×20px、`stroke:#fff;stroke-width:2`（对勾徽章） |
| 列表间距 | `gap:12px` |

**徽标卡（`.quality-cert-badge`）**：`background:#f9fafb; border-radius:14px; padding:20px; gap:8px`；右栏 `flex:0 0 380px` 两列网格 `gap:12px`（≤767px 整栏隐藏）。

**CTA（`.quality-certs-cta`）**：蓝底胶囊（同 btn-primary），`margin-top:24px`；图标 16×16 `stroke:#fff`。

---

## 8. 制造能力区（Expertise，`.expertise`）

### 8.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#020303`（深色） | 同左 | 同左 |
| 布局 | `grid; grid-template-columns:minmax(0,1fr) minmax(420px,600px); column-gap:40px; row-gap:24px` | 单列 | 同左 |
| 内边距 | `240px 100px` | `200px 40px` | `120px 24px` |

### 8.2 字体规范（深色底）

| 元素 | 字体 | 桌面 | 移动 |
|---|---|---|---|
| 小标题 | Manrope 16px/400/`#fff`（菱形图标 `#fff`） | 同左 | 同左 |
| 标题 `.expertise-heading` | Syne 400 | `48px / 52px / -0.48px / #fff` | `36px / 42px / -0.36px` |
| 描述 `.expertise-desc` | Manrope 400 | `16px / 25px / #fff` | 同左 |
| 底部大标题 h2 | Syne 400 | `48px / 52px / #fff` | `36px / 42px` |

**左右列**：左 `gap:24px; max-width:700px`；右 `flex-direction:column; align-items:flex-start; gap:24px; max-width:600px`。

### 8.3 组件样式

**能力图标占位（`.expertise-logo-ph`）**

| 属性 | 桌面 | 移动 ≤767px |
|---|---|---|
| 尺寸 | 96×96px | `flex:0 0 calc(50% - 6px)`，`aspect-ratio:1` |
| 圆角 | `8px` | `12px` |
| 背景 | `rgba(255,255,255,.1)`（实际为透明 + 图片 `object-fit:fill`） | 同左 |
| 间距 | `gap:12px` | 同左（可换行） |

**按钮 `.expertise-btn`**：白底黑字胶囊（反色主按钮），`border:1px solid #fff; padding:12px 20px`；hover `background:#563cfa;border-color:#563cfa;color:#fff`。

**链接 `.expertise-link`**：Manrope 16px/400/`#563cfa`，`gap:6px; margin-top:24px`；hover `gap:12px`。

**底部（`.expertise-bottom`）**：`margin-top:60px; flex-direction:column; gap:40px`。

---

## 9. 核心技术区（Partner Integrations / IPL Technologies，`.partner-integrations`）

### 9.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#f3f4f6`（`--grey-100`，内联） | 同左 | 同左 |
| 布局 | `flex; gap:60px`（左 `flex:1; max-width:500px` + 右 `flex:1`） | `flex-direction:column; gap:32px` | 同左 |
| 内边距 | `60px 100px` | `60px 40px` | `40px 24px` |

### 9.2 字体规范

| 元素 | 字体 | 值 |
|---|---|---|
| 小标题 | Manrope 16px/400 | `margin-bottom:24px` |
| 标题 `.partner-integrations-heading` | Syne 400 | `48px / 52px / #020303`（≤959px `36/42`） |
| 描述 `.partner-integrations-desc` | Manrope 400 | `16px / 25px / #020303` |
| 技术卡标题 | Syne 400（内联） | `16px / #020303` |
| 技术卡描述 | Manrope 400（内联） | `13px / 18px / #6b7280` |

### 9.3 组件样式

**网格（`.partner-grid`）**：3 列 `gap:12px`（≤767px 2 列）。

**技术卡（`.tech-card`）**

| 属性 | 桌面 | 移动 ≤767px |
|---|---|---|
| 内边距 | `20px` | `12px` |
| 内部间距 | `gap:8px` | `gap:6px` |
| 主文本色 | `#0f172a` | 同左 |
| 图标容器 `.tech-icon` | 192×192px、圆角 `32px` | `100% / max-width:150px / aspect-ratio:1 / 圆角 24px` |
| 图标 | `object-fit:contain` | 同左 |

**Logo 卡（`.partner-logo-card`，未在首页直接使用但已定义）**：`padding:20px 12px; min-height:60px; border-radius:12px`；图片 `opacity:.7` → hover `1`。

---

## 10. 案例研究区（Our Work，`.our-work`）

### 10.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#020303`，`padding:60px 0` | 同左 | 同左 |
| 容器内边距 | `0 100px` | `0 40px` | `0 24px` |

### 10.2 字体规范（深色底）

| 元素 | 字体 | 桌面 | 移动 |
|---|---|---|---|
| 小标题 | Manrope 16px/400/`#fff` | 同左 | 同左 |
| 标题 `.our-work-heading` | Syne 400 | `48px / 52px / #fff` | `36px / 42px` |
| 引言 `.our-work-intro` | Manrope 400 | `16px / 25px / #fff`，`max-width:1200px` | 同左 |
| 卡标签 `.work-card-tag` | Manrope 600 大写 | `12px / letter-spacing:.5px / #fff` | 同左 |
| 卡标题（h3） | Syne 400 | `21px / 27px / #fff` | 同左 |

**头部（`.our-work-header`）**：`flex; flex-direction:column; gap:24px; margin-bottom:40px`（≤959px `gap:16px`）。

**链接**：描边蓝 `.our-work-link`（见 0.7）+ 蓝底 `.our-work-projects-cta`（同 btn-primary，`border:1px solid #563cfa`）。

### 10.3 案例卡（`.work-card`）

| 属性 | 值 |
|---|---|
| 网格 | 实际 4 列（CSS 声明 5 列，内联 `grid-template-columns:repeat(4,1fr)` 覆盖）`gap:20px`（≤959px 2 列；≤767px `gap:12px`） |
| 背景 / 圆角 | `#fff` / `16px` / `overflow:hidden` |
| Hover | `translateY(-4px)` |
| 图片 | 宽 100% × 高 `338px`（≤767px `247px`），`object-fit:cover` |
| Overlay | `absolute; inset:0; padding:16px`，`opacity:0 → 1`（hover，`transition:.3s`），底部渐变 |
| Overlay 渐变（各卡不同） | `linear-gradient(0deg, rgba(236,72,153,.85) 0%, transparent 60%)` ｜ `rgba(30,64,175,.85)` ｜ `rgba(124,58,237,.85)` ｜ `rgba(180,83,9,.85)` |
| 标签胶囊 | `background:#aeaeae; padding:4px 12px; border-radius:100px; margin-bottom:4px; width:fit-content` |
| 标题胶囊 | `background:#aeaeae; padding:6px 16px; border-radius:100px; margin-top:4px; width:fit-content` |

---

## 11. 客户评价区（Testimonials，`.testimonials`）

### 11.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#f9fafb`（`--grey-50`） | 同左 | 同左 |
| 容器内边距 | `40px 100px 124px` | `40px 40px 132px` | `32px 24px 140px` |
| 布局 | `flex; align-items:flex-start; gap:60px` | `flex-direction:column; gap:24px` | 同左 |

### 11.2 字体规范

| 元素 | 字体 | 桌面 | 移动 ≤767px |
|---|---|---|---|
| 引言 `.testimonial-quote` | Syne 400 | `24px / 30px / #020303`，`margin-bottom:24px` | `20px / 26px` |
| 作者名 `.testimonial-author-name` | Manrope 400 | `16px / 25px / #020303` | 同左 |
| 作者职位 `.testimonial-author-role` | Manrope 400 | `14px / 21px / #6b7280` | 同左 |
| 链接 `.testimonial-cta` | Manrope 400 | `16px / #563cfa`，`margin-top:24px`，hover `gap:12px` | 同左 |

### 11.3 组件样式

- **引用图标**：64×64px，`fill:rgba(86,60,250,.2)`；`absolute; right:184px; bottom:24px`（≤959px `124px`；≤767px `108px`）
- **作者头像**：48×48px 圆形（`border-radius:50%`），白底内边距 4px；作者区 `gap:8px; flex-wrap:wrap`
- **导航按钮**：48×48px 圆形、`border:1px solid #020303` 透明底；hover `background:#020303;color:#fff`；图标 24×24 `stroke:currentColor;stroke-width:2`；`absolute; right:100px; bottom:40px`（≤959px `40px`；≤767px `24px`）
- **分页**：`absolute; left:100px; bottom:52px`（≤959px `40px`；≤767px `24px; bottom:56px`），文本如 `1/3`

---

## 12. 页脚（Footer，`.site-footer`）

### 12.1 区块容器

| 属性 | 桌面 ≥1200 | 平板 ≤959px | 移动 ≤767px |
|---|---|---|---|
| 背景 | `#020303`，白字，`padding:120px 0` | `60px 0` | 同左 |
| 全宽 | `width:100vw; margin-left/right:-50vw`（视觉全宽） | 同左 | 同左 |
| 容器内边距 | `0 100px` | `0 40px` | `0 24px` |

### 12.2 网格（`.footer-grid`）

| 断点 | 列 |
|---|---|
| 桌面 | `1.3fr 1fr 1fr 1.2fr`，`gap:60px` |
| ≤959px | 两列 `1fr 1fr`，`gap:40px` |
| ≤767px | 单列，`gap:32px` |

### 12.3 字体规范（深色底）

| 元素 | 字体 | 值 |
|---|---|---|
| 列标题（h4） | Manrope 600 | `18px / 27px / #fff`，`margin-bottom:16px` |
| 链接（a） | Manrope 400 | `16px / 25px / #fff`，`padding:6px 0`，hover `#b4b4b4` |
| CTA 列标题 | Manrope 600 | `42px / 50px`，`margin-bottom:12px`（≤959px `30/38`；≤767px `26/34`） |
| CTA 描述（p） | Manrope 400 | `16px / 25px` |
| 联系链接 | Manrope 400 | `16px / 25px / #fff`，下划线 `#563cfa` `offset:4px`，hover 下划线透明 |
| 公司信息 | Manrope 400 | `14px / 21px / #fff`，`margin-bottom:8px` |
| 信息列小链接 | Manrope 400 | `14px / 21px`，`padding:2px 0`，下划线 `#563cfa` `offset:3px` |

### 12.4 组件样式

- **CTA 按钮**：复用 `.our-work-link`（描边蓝胶囊），`margin-top:12px`，文本 `Get in touch`
- **版权行**：`© iShine Technology Ltd 2026 All rights reserved.`（含 Privacy Policy / FAQ 内联下划线链接）；公司名 `12px / #b4b4b4`

---

## 13. 规范校验说明

### 13.1 校验范围与方法

- **数据来源**：首页 `src/pages/index.astro` 内 `<style>` 全局样式（L18–562）+ 各 section 内联样式 + 交互脚本，未含外部组件
- **校验方式**：逐类选择器对照 `getComputedStyle()` 渲染结果与规范表，已验证的断点：桌面 1441px、平板 768–1279px、移动 ≤767px（含 698px、959px 中间断点）
- **与线上一致性**：本规范所有参数均直接取自页面当前实现；若设计稿与线上有差异，以本规范（=线上实现）为准

### 13.2 已知注意事项（实现细节，勿视为规范偏差）

| 项 | 说明 |
|---|---|
| Hero 主标题字号 | 规范值 `54px`（桌面）/ `52px`（tablet compact）/ `36px`（移动）；CSS 另有 `.hero-heading h1` 的 `62px` 声明被内联样式覆盖，实际不生效 |
| 案例卡网格 | CSS 声明 5 列，HTML 内联 `grid-template-columns:repeat(4,1fr)` 覆盖为 4 列，以 4 列为准 |
| 页脚 CTA 描述色 | CSS 定义 `color:var(--black)`（深色文字），处于深色页脚背景上，视觉对比度存疑，属既有实现 |
| Trust Bar 符号 | 首页隐藏了下拉 chevron、mega 按钮图标等装饰符号（`visibility:hidden`）以保持版式，实际展示为纯文本导航 |
| 移动菜单面板 | 默认 `opacity:0; visibility:hidden`，打开时显示；`≤698px` 时 `top:130px`、宽 `calc(100% - 32px)` |
| 字体加载 | Manrope 400/500/600/700 + Syne 400/700，来自 Google Fonts；缺失时回退 `-apple-system,Roboto,Helvetica,sans-serif` |

### 13.3 复用约定

1. 任何页面新增 section 时，应优先复用 `0.x` 全局规则（令牌、按钮、小标题、断点）与现有 section 模式
2. 新增大标题字号遵循三档降级：桌面 `48px/52px` → 平板 `36px/42px` → 移动 `28px/34px`（Syne）；正文统一 Manrope `16px/25px`
3. 胶囊按钮内边距统一 `12px 20px`、圆角 `100px`、hover 间隙 `12px`
4. 深色区块（`#020303`）上的标题用 Syne 白字，正文 Manrope 白字，二级文本 `rgba(255,255,255,.7/.8)` 或 `#b4b4b4`
5. 分割线统一 `#e5e7eb`（1px），卡片阴影两档：常规 `0 10px 24px rgba(2,3,3,.06)`、浮层 `0 20px 40px rgba(2,3,3,.15)`
