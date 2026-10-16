# ops/seo —— 站点 SEO 运维脚本

这些脚本**不参与站点构建**。构建链在 `astro/`（见 `astro/package.json` 的 `build`）。
本目录放的是本地/定时运行的运维逻辑：收录提交、收录核验、日报。

## 为什么放在仓库里

不是为了让它们被部署，而是为了**有历史**。

典型案例：`seo_daily.py` 的 URL 校准曾经把线上 `sitemap.xml` 的 **22 个子 sitemap 地址**
当成全站页面清单写回 `site-urls.txt`，导致清单被静默截断成 22 条，每日提交的其实是
sitemap 文件而不是页面，持续多日无人察觉。**有 git 历史时，"曾经正确、某次改动后截断"
一眼可查；没有历史时只能靠推算原始基数。**

## 入什么，不入什么

| | 内容 |
| --- | --- |
| **入库** | 逻辑脚本、配置模板（`CONFIG.example.env`）、必要的说明 |
| **不入库** | 状态文件（`seo-state.json` 等，每日变动、只产生噪音 diff）、凭据（`seo_smtp_config.json`、`bing_api_key.txt`）、结果数据（`*.jsonl`）、任何本机绝对路径 |

状态文件不入库是刻意的：它的价值在于**当前值**，不在于历史；把它版本化只会制造
误导性的 diff。真正需要"能回滚"的是逻辑。

## 文件

| 文件 | 作用 | 调度 |
| --- | --- | --- |
| `seo_daily.py` | 每日收录提交（Google sitemap / Bing IndexNow 全量 / Yandex / Naver / Seznam）+ 生成日报 | 原 23:59（当前任务已禁用） |
| `seo_weekly_audit.py` | 周度审计 | 原每周（已禁用） |
| `gsc_bucket_analysis.py` | 分析 GSC 未编入索引原因分桶（配合覆盖率工作簿） | 手动 |
| `CONFIG.example.env` | 路径与凭据的配置模板 —— **换机器时先看这个** | — |

## 另在别处维护的脚本

下列脚本与本目录同属运维逻辑，**尚未迁入**（待按 `CONFIG.example.env` 的口径
统一配置来源后再移入）；当前留在本地工作区：

- `_gsc_run.mjs`、`_gsc_daily.ps1`、`_gsc_daily_merge.py`、`_gsc_supervisor.ps1`
- `_gsc_single.mjs`、`_gsc_verdict_test.mjs`、`_gsc_inspect_batch.mjs`、`_gsc_login.mjs`
- `bing_daily_batch.py`、`_bing_verify.py`、`_bing_reclassify.py`
- `seo_email_smtp.py`（引用 `seo_smtp_config.json`）、`medium_daily.py`

迁入时要满足的硬性要求：不写死本机路径、凭据只从外部文件读、
缺配置显式报错。用 `clean_check.py` 验证后再提交。

## 提交前自检

```bash
python ops/seo/clean_check.py --changed origin/main   # 只查本次改动涉及的文件
python ops/seo/clean_check.py --staged                # 只查已暂存的文件
```

退出码 0 = 通过，1 = 有命中。规则见脚本头部注释（绝对路径、凭据形态、
凭据赋值、联系信息、内网地址）。**只扫改动文件**是刻意的：全量扫描会拖慢每次提交，
最终结果是大家开始加 `--no-verify`，规则形同虚设。


## 使用前提

1. 按 `CONFIG.example.env` 设置环境变量
2. 把凭据文件放在本目录（已被 `.gitignore` 排除）
3. 站点根目录可访问 `{INDEXNOW_KEY}.txt`（IndexNow 校验用）

## 已知的外部限制

- **Google GSC 网址检查**：浏览器 UI 路径有**未公开的每日配额**，耗尽后当日无法继续。
  实测在仅 3–5 次后即被拒（`超出了配额 / 您已超出资源的网址检查配额`）。
  官方文档只给了 API 路径的额度（URL Inspection API：2000 QPD）。
- **Bing `GetUrlInfo`**：有 host 级每日配额，超出返回
  `{"ErrorCode":5,"Message":"ERROR!!! ThrottleHost"}`。退避重试无效，须换日。
  **注意：限流是"测量失败"，绝不可当作"未收录"写入结果**，否则会系统性低估收录率。
  聚合接口 `GetCrawlStats` 不受此限，其 `InIndex` 字段即 Bing 后台显示的收录数。
