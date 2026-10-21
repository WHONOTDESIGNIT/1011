# 1011 · iplmanufacturer.com

iShine Technology 官网。Astro 5 + Netlify，22 语言（en 无前缀，其余 `/xx/`）。

## 唯一有效的结构

| 路径 | 作用 |
|---|---|
| `astro/` | 构建与部署入口；`netlify.toml` 的 `base = "astro/"` |
| `astro/messages/*.json` | 线上语言包（22 个）。意大利语同样取自静态 `astro/messages/it.json` |
| `ops/seo/` | SEO 定时任务脚本与凭据（Windows 计划任务直接读本目录，勿移动） |
| `docs/` | 设计与规范文档 |

`dist/`、`site-urls.txt`、`node_modules/` 都是构建产物或本地状态，不入库。
`site-urls.txt` 每次构建由 `astro/scripts/generate-site-urls.mjs` 重写，`ops/seo` 从磁盘读它。

## 本地构建

```powershell
cd astro
npm ci          # 严格按 package-lock.json 安装（与 Netlify 一致）
npm run build   # 14 步 guard（frontmatter / llms / sitemap / hreflang / JSON-LD / 基线）
npm run dev     # 本地预览
```

构建要全绿才算通过：`✅ all checks passed`，产出约 3,433 个 HTML 页面。
守卫失败先看 `ops/RUNBOOK.md`，不要直接改守卫。

## 每个 clone 装一次钩子

```powershell
git config core.hooksPath ops/seo/git-hooks
```

钩子只检查 **staged** 文件里的凭据、本机路径和联系方式；未安装时静默不生效。

## 约定

- 改动走分支推送到 `origin`，由 owner 合并；不直接改 `main`。
- 不在仓库根新建临时脚本或日志（历史遗留的 `verify_*.js` / `_build_*.log` 已清理）。
- 提交前 `git status` 应为空——构建不再弄脏工作区。
