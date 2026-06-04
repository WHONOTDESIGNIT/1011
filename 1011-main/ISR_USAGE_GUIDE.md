# ISR 功能使用指南

## 快速参考

### 1. 查看当前 Sitemap
```bash
# 访问
https://iplmanufacturer.com/sitemap.xml

# 自动包含：
- 所有静态页面（产品/服务/关于等）
- 所有博客文章（13篇 × 4语言）
- 1小时自动更新
```

### 2. 手动触发内容更新

#### 更新所有博客页面
```bash
curl -X POST https://iplmanufacturer.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-secret-here",
    "type": "tag",
    "tag": "blog"
  }'
```

#### 更新单篇博客文章
```bash
curl -X POST https://iplmanufacturer.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-secret-here",
    "type": "path",
    "path": "/en/blog/01-the-future-of-ipl-technology-trends-for-2025"
  }'
```

#### 更新所有产品页面
```bash
curl -X POST https://iplmanufacturer.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-secret-here",
    "type": "tag",
    "tag": "products"
  }'
```

### 3. 配置环境变量（必需）

在 Netlify Dashboard → Site Settings → Environment Variables 添加：

```bash
REVALIDATE_SECRET=your-secure-random-string-min-32-chars
```

生成安全密钥：
```bash
# 在终端运行
openssl rand -base64 32
```

### 4. 测试 API 端点

#### 检查 API 是否正常
```bash
curl https://iplmanufacturer.com/api/revalidate

# 响应示例：
{
  "message": "Revalidation API is ready",
  "usage": {
    "method": "POST",
    "body": { ... }
  }
}
```

## 自动化场景

### A. GitHub Actions（推送代码时触发）

创建 `.github/workflows/revalidate.yml`：

```yaml
name: Revalidate Content

on:
  push:
    branches: [main]
    paths:
      - 'src/content/blog/**'

jobs:
  revalidate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger ISR Revalidation
        run: |
          curl -X POST https://iplmanufacturer.com/api/revalidate \
            -H "Content-Type: application/json" \
            -d '{
              "secret": "${{ secrets.REVALIDATE_SECRET }}",
              "type": "tag",
              "tag": "blog"
            }'
```

### B. Netlify Build Hook（完整重建）

用于重大内容更新：

1. Netlify Dashboard → Build & Deploy → Build Hooks
2. 创建 Build Hook: `Content Update`
3. 保存 URL: `https://api.netlify.com/build_hooks/xxxxx`

触发构建：
```bash
curl -X POST https://api.netlify.com/build_hooks/xxxxx
```

### C. CMS 集成（如 TinaCMS）

在 CMS 保存钩子中调用：

```javascript
// tina/config.ts
export default defineConfig({
  // ...
  admin: {
    auth: {
      onLogin: async () => {
        // 可选：登录后刷新内容
      },
      onLogout: async () => {},
    },
  },
  build: {
    publicFolder: "public",
    outputFolder: "admin",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "post",
        label: "Blog Posts",
        path: "src/content/blog",
        format: "mdx",
        ui: {
          router: ({ document }) => `/blog/${document._sys.filename}`,
        },
        // 保存后触发重新验证
        onCreate: async () => {
          await fetch('https://iplmanufacturer.com/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secret: process.env.REVALIDATE_SECRET,
              type: 'tag',
              tag: 'blog'
            })
          });
        },
        onUpdate: async () => {
          // 同上
        },
        fields: [
          // 字段定义...
        ],
      },
    ],
  },
});
```

## 缓存行为说明

### 用户访问流程

```
第1次访问（构建后）:
├─ CDN 缓存命中 → 返回静态页面（< 50ms）

1小时后第1次访问:
├─ CDN 缓存过期
├─ Netlify Function 重新生成（~ 200-500ms）
├─ 更新缓存
└─ 返回新页面给用户

后续访问:
└─ CDN 缓存命中 → 返回更新后的页面（< 50ms）
```

### 手动重新验证后

```
调用 API:
├─ 清除指定 tag/path 的缓存
└─ 下次访问时触发重新生成
```

## 监控和调试

### 1. 检查页面 ISR 状态

在浏览器开发者工具 Network 标签中查看响应头：

```http
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
X-Netlify-Cache: HIT  ← 缓存命中
Age: 1234  ← 缓存存在时间（秒）
```

### 2. Netlify Analytics

访问 Netlify Dashboard → Analytics：
- Function 调用次数
- 平均响应时间
- 缓存命中率

### 3. 常见问题

#### Q: 更新内容后没有立即看到变化？
**A**: ISR 是"按需"刷新，需要：
1. 等待缓存过期（1-2小时）
2. 或调用 `/api/revalidate`
3. 或触发完整构建

#### Q: API 返回 401 Unauthorized？
**A**: 检查：
1. `REVALIDATE_SECRET` 环境变量是否配置
2. 请求中的 `secret` 是否匹配
3. Netlify 环境变量是否在重启后生效

#### Q: 如何强制立即更新？
**A**: 两种方式：
1. 调用 `/api/revalidate` API
2. 触发 Netlify Build Hook 完整重建

## 性能基准

| 指标 | 目标值 | 当前状态 |
|-----|--------|---------|
| TTFB | < 100ms | ✅ (CDN 缓存命中) |
| LCP | < 2.5s | ✅ (静态生成) |
| CLS | < 0.1 | ✅ (无布局偏移) |
| Function 冷启动 | < 1s | ✅ (Netlify 优化) |

## 最佳实践

### 1. 选择合适的 ISR 时间

```typescript
// 频繁更新的内容（博客、新闻）
export const revalidate = 3600; // 1小时

// 中等更新频率（产品信息）
export const revalidate = 7200; // 2小时

// 很少更新的内容（公司介绍）
export const revalidate = 86400; // 24小时
```

### 2. 组合使用 Tag 和 Path

```bash
# 大范围更新：使用 tag
curl ... -d '{"type":"tag","tag":"blog"}'

# 精确更新：使用 path
curl ... -d '{"type":"path","path":"/en/blog/specific-post"}'
```

### 3. 避免过度重新验证

不要在每次小改动后都调用 API，利用 ISR 的自动刷新机制：
- 内容修复：等待自动刷新
- 重要更新：手动触发
- 紧急修复：完整重建

## 支持

遇到问题？检查：
1. [SEO_ISR_OPTIMIZATION_SUMMARY.md](./SEO_ISR_OPTIMIZATION_SUMMARY.md) - 完整技术文档
2. [Netlify 日志](https://app.netlify.com) - Function 调用记录
3. [Next.js ISR 文档](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
