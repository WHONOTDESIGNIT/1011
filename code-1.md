# Language Switcher 须知 & 多语页面开发规范

## 一、Language Switcher 消失的常见原因

Language Switcher 由 `BaseLayout.astro` 统一渲染，位于顶部 `<section class="lang-bar">` 内。以下情况会导致它消失或被推到视线之外：

### 1. `stickyNav={false}` 导致 lang bar 不 sticky
`BaseLayout` 的 `stickyNav` prop 控制顶部两个条是否 `position: sticky`：

- `stickyNav={true}`（默认）→ lang bar + header 固定悬浮
- `stickyNav={false}` → lang bar + header 随页面滚动

**无论 `stickyNav` 为何值，Language Switcher 都在 DOM 中正常渲染**，只是当 `false` 时随页面滚动。用户需要上滚才能看到。

📌 已在 `blog/[slug].astro` 设置 `stickyNav={false}`。

### 2. HTML 模板语法错误
在 Astro 的模板中，`class` 不支持用 `{condition ? 'a' : 'b'}` 这样的表达式。必须使用 `class:list`：

```astro
<!-- ❌ 错误 -->
<section class="{condition ? 'sticky' : ''} top-0">

<!-- ✅ 正确 -->
<section class:list={['top-0', condition ? 'sticky' : '']}>
```

过去曾用错误语法导致类名无法正确应用，影响了 lang bar 的布局。

### 3. inline 定位脚本推到错误位置
BaseLayout 中有一段 `<script is:inline>`，它会计算 nav 中最后一个链接的位置，将 Language Switcher 对齐到 Contact 按钮右侧。如果 nav 为空或页面未加载完成，脚本可能计算失败，导致 switcher `marginLeft` 设为零或负数，被其他元素遮挡。

### 4. 页面自己返回 404
如果页面有 `if (locale !== 'en') { return new Response('Not found', { status: 404 }); }` 这样的守卫，那么访问 `/es/...` 会直接返回 404，BaseLayout 根本不渲染。

✅ 多语言页面必须改为：
```astro
if (locale !== 'en' && locale !== 'es') {
  return new Response('Not found', { status: 404 });
}
```

## 二、新增语言时的 checklist

### 1. `i18n.ts` — 注册翻译文件
```ts
// src/lib/i18n.ts
import en from '../../../messages/en.json';
import es from '../../../messages/es.json';  // ← 新增

const messagesByLocale = {
  en: en as Messages,
  es: es as Messages,  // ← 新增
};
```

### 2. 页面 locale 守卫
每个页面都需要更新 locale 守卫：
```astro
if (locale !== 'en' && locale !== 'es') {
  return new Response('Not found', { status: 404 });
}
```

### 3. 硬编码数据的分语言方案
在 page 的 frontmatter script 中定义一个 `isEn` 变量：
```astro
const isEn = locale === 'en';
```

然后用三元表达式为每个硬编码文案提供双语版本：
```astro
const pageTitle = isEn ? 'Products' : 'Productos';
const products = isEn ? [
  // ...英文
] : [
  // ...西语
];
```

### 4. `lang` prop
传递给 `BaseLayout` 的 `lang` 保持 `{locale}`：
```astro
<BaseLayout title={pageTitle} lang={locale} ...>
```

## 三、已支持德语的页面

| 页面 | 状态 |
|:----|:----:|
| 首页 `index.astro` | ✅ |

## 四、已支持西语的页面

| 页面 | 状态 |
|:----|:----:|
| 产品列表 `products/index.astro` | ✅ |
| 产品详情 `products/[slug].astro` | ✅ |
| 联系页面 `contact/index.astro` | ✅ |

## 五、未支持西语/德语的页面（返回 404）

这些页面仍限 `en`，需要按上述 checklist 逐一改造：
- about/ `*.astro`
- catalogue/index.astro
- blog/ `*.astro`
- clients/ `*.astro`
- components/ `*.astro`
- contact/index.astro
- faq/index.astro
- media/index.astro
- services/ `*.astro`

---

## 六、一键提交命令

```bash
git add -A && git commit -m "Update: all current project changes" && git push origin master --force && git push origin master:main --force git@github.com:WHONOTDESIGNIT/1011.git
```
