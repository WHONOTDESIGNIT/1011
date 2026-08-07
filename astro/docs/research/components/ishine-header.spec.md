# iShine 全站统一 Header + Top Bar 设计规范

> 规范源：`src/pages/index.astro`（首页内联实现，L55-188 CSS / L569-850 结构）
> 统一组件：`src/components/SiteHeader.astro`（与首页逐字节一致，全站唯一实现）
> 适用范围：iShine 全站所有页面 + develo-\* 复刻页面（header 与 top bar 必须完全一致）

---

## 0. 设计令牌

| Token | 值 | 用途 |
|-------|-----|------|
| `--blue` | `#563cfa` | CTA 按钮、下拉卡片链接、下划线 |
| `--black` | `#020303` | 文字、描边 |
| `--white` | `#ffffff` | header 背景、反白文字 |
| `--grey-50` | `#f9fafb` | mega-card 背景 |
| `--grey-100` | `#f3f4f6` | 占位/图片背景 |
| `--grey-200` | `#e5e7eb` | 分隔线 |
| `--grey-400` | `#9ca3af` | 次要文字 |
| `--grey-500` | `#6b7280` | 描述文字 |
| 字体 | Manrope（正文/导航）、Syne（mega-card 标题） | 全站统一 |

---

## 1. Top Bar（Trust Bar）

### 结构
```
.trust-bar#trust-bar (fixed, 顶部)
  .trust-bar-inner
    .trust-slide[data-slide=shipping]   → Global Shipping（SVG 地球 24×24）
    .trust-slide[data-slide=private-label] → Private Label（SVG 标签 24×24）
    .trust-slide[data-slide=chatgpt]    → ChatGPT Top Collection（SVG 星 24×24）
```

### 视觉标准
- `position: fixed; top: 0; left: 0; right: 0; z-index: 100`
- `height: 60px`（所有断点不变）
- `display: flex; align-items: center; justify-content: center`
- `background: transparent`（悬停区域穿透 `pointer-events: none`）
- 3 条轮播只显示 1 条：`aria-hidden="true"` → `display: none`；`"false"` → `display: flex`
- `.trust-text`：Manrope 16px / 400 / 25px，色 `#020303`
- slide 内边距 `12px 24px`、icon 与文字 gap `8px`

### 交互规则
- 自动轮播：`setInterval` 3000ms，`aria-hidden` 硬切换（无动画）
- 滚动自动隐藏（state-machine 防抖 100ms）：
  - `scrollY === 0` → 显示（移除 `trust-bar-hidden`）
  - 离开顶部 → 隐藏：`.trust-bar-hidden { opacity: 0; transform: translateY(-100%) }`

### 响应式（≤768px）
- slide padding `10px 16px`；`.trust-text` 14px / 21px

---

## 2. Site Header（主导航栏）

### 结构
```
header.site-header#site-header
  .header-inner
    a.header-logo  → img /images/logos/ishine-logo.png
    .header-main-nav
      nav.header-nav.desktop-nav
        .nav-dropdown-wrapper → Products（mega-dropdown--wide）
        .nav-dropdown-wrapper → Services（mega-dropdown）
        .nav-dropdown-wrapper → About（mega-dropdown）
        .nav-dropdown-wrapper → Resources（mega-dropdown）
        a.nav-item → Our Work（纯链接 /clients）
      .header-cta → a.btn-cta "Get in touch"
    button.nav-collapse-btn#nav-collapse-btn（汉堡按钮，默认隐藏）
```

### 尺寸定义
| 项 | 值 |
|----|-----|
| `.site-header` 定位 | `fixed; top: 66px; left: 50%; translateX(-50%); width: calc(100% - 48px); max-width: 1400px; z-index: 110` |
| `.site-header.site-header-top-top-hidden` | `top: 0`（配合 top bar 隐藏） |
| `.header-inner` | `height: 70px; padding: 0 24px 0 40px; background: #fff; border-radius: 40px; box-shadow: 0 10px 24px rgba(2,3,3,.06)` |
| `.header-logo` | `height: calc(100% - 12px)`（即 58px）；img `object-fit: contain` |
| `.header-main-nav` | `justify-content: flex-end; gap: 38px; margin-left: auto` |
| `.header-nav` | `gap: 8px` |
| `.nav-item` | `padding: 12px 16px; Manrope 16px/25px; color: #020303; border-radius: 8px` |
| `.nav-item:hover` | `background: rgba(0,0,0,.04)` |
| `.header-cta` | `gap: 12px` |
| `.btn-cta` | `padding: 12px 20px; background: #563cfa; color: #fff; Manrope 16px; border-radius: 100px` |
| `.btn-cta:hover` | `gap: 12px; background: #374151` |
| `.nav-collapse-btn` | `40×40px 圆形; background: #563cfa; 绝对定位 right: 24px; top: 50%` |

### 交互规则（header nav-mode，JS 驱动）
1. 测量 `padding + logo宽 + nav gap + nav宽`，计算 `requiredWidth`
2. 当 `实际gap ≤ safeGap` 或 `容器宽 ≤ requiredWidth` → 添加 `.header-menu-only`
3. `.header-menu-only` 时：`.header-main-nav` 淡出（`opacity:0; visibility:hidden; pointer-events:none`），`.nav-collapse-btn` 显示（`opacity:1; visibility:visible`）
4. 触发 `layout:header-metrics` 自定义事件（供 hero 等联动）
5. `resize` + `ResizeObserver`（监听 header-inner/logo/main-nav）实时重算

---

## 3. Mega Dropdown（桌面下拉）

### 通用
- 定位：`absolute; top: calc(100% + 12px); left: 50%; translateX(-50%) translateY(4px)`
- 样式：`min-width: 640px; background: #fff; border-radius: 20px; box-shadow: 0 20px 40px rgba(2,3,3,.15)`
- 显示：`.nav-dropdown-wrapper:hover` / `.mega-dropdown.open` → `opacity:1; visibility:visible; translateY(0)`（200/250ms 过渡）
- chevron 旋转 180°（hover）
- 结构：`.mega-left`（链接区）+ `.mega-divider`（1px 竖线 #e5e7eb）+ `.mega-right`（260px 卡片区）

### Products 专属（.mega-dropdown--wide）
- `min-width: 800px`（≤1279px → 720px；≤1099px → 640px）；`left: 0`（不居中）
- `.mega-products-grid`：2 列产品卡（模型名 16px/500 + 标语 13px #6b7280 + 60×60 圆角图）
- `.mega-divider-h`：1px 横线
- `.mega-components`：4 列组件卡（44×44 图 + 12px/500 名称）
- `.mega-right` 卡片：150px 高产品图 + Syne 21px 标题 + 描述 + 紫色链接按钮

### 链接样式
- `.mega-link`：padding `10px 14px`，radius 10px，hover `rgba(0,0,0,.04)`
- `.mega-link-title`：Manrope 18px/500/26px #020303；`.mega-link-desc`：14px/400/21px #6b7280
- `.mega-card-btn`：紫色描边 pill（`color:#563cfa`），hover 填充紫色白字 gap+6px

### 响应式
- `≤959px`：`.mega-dropdown { display: none !important }`（移动端用 mobile-menu-panel）

---

## 4. Mobile Menu（移动端抽屉）

### 结构
```
.mobile-menu-overlay#mobile-menu-overlay（遮罩）
.mobile-menu-panel#mobile-menu-panel（抽屉）
  .mobile-menu-group × 4（Products/Services/About/Resources 手风琴）
    button.mobile-menu-toggle（18px/26px 标题 + chevron）
    .mobile-submenu（max-height 手风琴展开）
  a.mobile-menu-link（Our Work）
  .mobile-menu-cta > a.btn-cta（宽 100%）
```

### 尺寸/交互
- overlay：`rgba(74,98,211,.1)`，`inset:0`，z-index 108
- panel：`top: 148px; left: 50%; translateX(-50%); width: calc(100% - 48px); max-width: 520px; padding: 20px; radius: 20px; z-index: 115`；`max-height: calc(100vh - 160px); overflow-y: auto`
- 打开：`body overflow: hidden`；按钮图标 汉堡 ↔ ✕ 切换；`aria-expanded` 同步
- 手风琴：`.mobile-submenu max-height: 0 → 560px`（300ms）+ chevron 旋转 180°
- 链接点击 / 遮罩点击 / Esc / resize(≥容器宽) → 关闭

### 响应式（≤698px）
- panel：`top: 130px; width: calc(100% - 32px); padding: 18px`

---

## 5. 响应式断点总表

| 断点 | 变化 |
|------|------|
| ≤959px | mega-dropdown 隐藏；移动菜单生效（JS header-menu-only 接管） |
| ≤768px | trust-bar slide padding 10px 16px、text 14px |
| ≤698px | header-inner 高度 70→56px、padding `0 24px 0 32px`；site-header 宽度 `calc(100% - 32px)`；mobile panel top 130px |

---

## 6. 一致性约束（改造与验收标准）

1. 所有页面 header/top bar 必须使用 `SiteHeader.astro`（首页内联实现作为规范源保留，但视觉与交互必须与本规范逐项一致）
2. 禁用任何页面级覆盖 header 样式的规则生效（组件全局样式优先级必须最高）
3. 页面不得残留重复的 trust 轮播 / 导航 / 移动菜单脚本（避免双 interval / 双监听）
4. 内容区顶部偏移与固定 header 高度匹配：trust 60px + header top 66px + 70px = **136px**
