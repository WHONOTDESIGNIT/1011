# Netlify 部署配置说明

> 本文档记录本仓库的 Netlify 构建配置与部署经验，**推送 / merge 前务必对照"检查清单"**。
> 最后更新：2026-08-07（修复了 `base` 缺失导致的构建失败）

## 1. 项目结构（关键）

```
仓库根
├── astro/            ← 真实构建项目（所有站点代码）
├── messages/         ← i18n 文案（astro 通过 ../../../messages/en.json 引用，构建必需）
├── src/content/blog/ ← 博客源文件（astro 通过 ../../../src/content/blog/**/*.mdx 引用，构建必需）
├── netlify.toml      ← Netlify 构建配置
└── 1011-main/        ← 历史嵌套旧站副本，构建不使用（勿改勿依赖）
```

**教训**：`astro/` 不是仓库根的项目！Netlify 构建必须指定 `base = "astro/"`，否则会在错误目录运行 `npm run build`。

## 2. 正确的 netlify.toml

```toml
[build]
  base = "astro/"
  publish = "dist/"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
```

路径语义（全部**相对 base**）：
- `base = "astro/"` → 构建目录
- `publish = "dist/"` → 发布目录 = `astro/dist/`
- `command = "npm run build"` → 在 `astro/` 内执行

## 3. 本次踩坑记录（2026-08-07）

- **现象**：Netlify 构建失败，日志 `Failed during stage 'Reading and parsing configuration files' / Base di...`
- **根因**：merge 后的 `netlify.toml` 的 `[build]` 段**丢失了 `base` 字段**。Netlify 因此回退到 UI 后台配置的 Base directory，而 UI 里残留的是仓库中**不存在**的旧目录，配置解析阶段直接报错——**根本没进入编译**。
- **修复**：在 netlify.toml 显式写 `base = "astro/"`（netlify.toml 优先于 UI 配置），并删除引用旧路径 `1011-main/astro/` 的失效 `ignore` 脚本。

## 4. 推送 / merge 前检查清单（防止再犯）

1. **本地构建必须通过**：`cd astro && npm run build`，exit 0。
2. **检查 netlify.toml 的 `[build]` 段**，必须同时有：
   - `base = "astro/"`
   - `publish = "dist/"`
   - `command = "npm run build"`
3. **merge 冲突解决时重点检查 netlify.toml**——本类错误正是在 merge 中悄悄丢失字段导致的。
4. **不要依赖 Netlify UI 配置**：netlify.toml 优先；UI 可能残留无效值（本次就是 UI 的旧 base 导致失败）。
5. **确认构建分支**：Netlify 生产分支是 `main`（不是 `master`）。推错分支不会触发部署。
6. **确认构建必需目录已提交**：`astro/`、`messages/`、`src/content/blog/`、`netlify.toml` 缺一不可。
7. **push 后在 Netlify 确认**：Deploys 页看到 "Base directory: astro/" 且构建绿色。
8. **不要加 `ignore` 脚本跳过构建**：除非其路径与当前结构（`astro/`、`src/content/blog/`、`messages/`）完全一致，否则会误跳过部署。

## 5. 其他注意点

- Netlify 构建环境是 Linux（noble）；Windows 本地提交时的 CRLF/LF 行尾符警告无碍构建，但会产生 git diff 噪音。
- 生产域名：iplmanufacturer.com；sitemap：`/sitemap.xml`。
- 本仓库有 develo 克隆页（`astro/src/pages/develo-*.astro`），已通过 `robots.txt` 屏蔽收录，保留无碍。
