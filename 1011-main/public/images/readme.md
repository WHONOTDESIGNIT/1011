# 图片资源管理指南

## 目录结构

```
public/images/
├── hero/           # 首页和页面横幅图片
├── products/       # 产品相关图片
├── blog/           # 博客文章图片
├── team/           # 团队成员照片
├── clients/        # 客户案例和合作伙伴图片
├── services/       # 服务页面相关图片
├── about/          # 关于我们页面图片
├── icons/          # 图标和小型装饰图片
├── logos/          # 公司和合作伙伴标志
└── gallery/        # 产品展示和案例图片
```

## 目录用途说明

### 📸 hero/
- **用途**: 首页横幅、页面头部背景图
- **建议尺寸**: 1920x1080px 或更高
- **格式**: WebP (首选), JPEG
- **命名**: `hero-homepage.webp`, `hero-services.webp`

### 🛍️ products/
- **用途**: IPL设备产品图片、产品详情图
- **建议尺寸**: 800x600px (产品展示), 1200x900px (详情页)
- **格式**: WebP (首选), PNG (透明背景)
- **命名**: `ipl-device-model-name.webp`, `product-feature-1.webp`

### 📝 blog/
- **用途**: 博客文章配图、缩略图
- **建议尺寸**: 800x450px (16:9比例)
- **格式**: WebP, JPEG
- **命名**: `blog-post-title-slug.webp`, `blog-thumbnail-001.webp`

### 👥 team/
- **用途**: 团队成员头像、公司团队照片
- **建议尺寸**: 400x400px (头像), 1200x800px (团队照)
- **格式**: WebP, JPEG
- **命名**: `team-member-name.webp`, `team-group-photo.webp`

### 🤝 clients/
- **用途**: 客户案例图片、合作伙伴展示
- **建议尺寸**: 600x400px
- **格式**: WebP, PNG
- **命名**: `client-company-name.webp`, `case-study-title.webp`

### 🔧 services/
- **用途**: 服务页面插图、流程图、服务展示
- **建议尺寸**: 800x600px
- **格式**: WebP, SVG (图标类)
- **命名**: `service-oem-odm.webp`, `process-diagram.svg`

### ℹ️ about/
- **用途**: 公司历史、办公环境、企业文化图片
- **建议尺寸**: 1200x800px
- **格式**: WebP, JPEG
- **命名**: `company-office.webp`, `company-history.webp`

### 🎨 icons/
- **用途**: 小图标、装饰性图片、UI元素
- **建议尺寸**: 64x64px, 128x128px
- **格式**: SVG (首选), PNG
- **命名**: `icon-feature-name.svg`, `decoration-element.svg`

### 🏢 logos/
- **用途**: 公司Logo、合作伙伴Logo、认证标志
- **建议尺寸**: 矢量格式或高分辨率
- **格式**: SVG (首选), PNG (透明背景)
- **命名**: `logo-company-name.svg`, `certification-iso.png`

### 🖼️ gallery/
- **用途**: 产品展示画廊、案例展示、工厂图片
- **建议尺寸**: 1200x900px
- **格式**: WebP, JPEG
- **命名**: `gallery-product-showcase-01.webp`, `factory-tour-01.webp`

## 图片格式建议

### 优先级排序:
1. **WebP** - 最佳压缩比，现代浏览器支持
2. **AVIF** - 未来趋势，更好的压缩
3. **JPEG** - 传统格式，兼容性好
4. **PNG** - 需要透明背景时使用
5. **SVG** - 矢量图形，图标和Logo

## 命名规范

### 基本规则:
- 使用小写字母和连字符
- 避免空格和特殊字符
- 包含描述性关键词
- 添加适当的版本号或日期

### 示例:
```
✅ 好的命名:
- hero-homepage-2024.webp
- product-ipl-pro-max.webp
- team-ceo-portrait.webp
- icon-checkmark-green.svg

❌ 避免的命名:
- IMG_001.jpg
- 产品图片.png
- hero image.webp
- logo final FINAL.png
```

## 图片优化建议

### 压缩设置:
- **WebP**: 质量 80-85%
- **JPEG**: 质量 75-85%
- **PNG**: 使用工具如 TinyPNG 压缩

### 响应式图片:
- 提供多种尺寸版本
- 使用 Next.js Image 组件
- 考虑不同设备的显示需求

## 在代码中使用图片

### Next.js Image 组件:
```tsx
import Image from 'next/image';

// 本地图片
<Image
  src="/images/products/ipl-device-pro.webp"
  alt="IPL设备专业版"
  width={800}
  height={600}
  priority // 首屏图片使用
/>

// 背景图片
<div 
  className="bg-cover bg-center"
  style={{
    backgroundImage: 'url(/images/hero/homepage-hero.webp)'
  }}
>
```

### CSS 中使用:
```css
.hero-section {
  background-image: url('/images/hero/services-hero.webp');
  background-size: cover;
  background-position: center;
}
```

## 版本控制

- 空目录包含 `.gitkeep` 文件以确保被Git跟踪
- 大文件考虑使用 Git LFS
- 定期清理未使用的图片资源

## 性能优化

1. **懒加载**: 非首屏图片使用懒加载
2. **预加载**: 关键图片使用 preload
3. **CDN**: 考虑使用CDN加速图片加载
4. **缓存**: 设置适当的缓存策略

---

**注意**: 上传图片前请确保拥有相应的使用权限，避免版权问题。