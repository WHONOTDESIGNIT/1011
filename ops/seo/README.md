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


## 配置与干跑的统一模式（新增脚本照抄此节）

**`preflight.py` 是模式定义文件。** 本目录每个脚本都必须按同一套写法接配置与干跑，
不要各写各的——8 个脚本 8 种风格会让下一次维护无从下手。

```python
from preflight import (require_env, optional_env, preflight, dry_run_enabled,
                       write_path, write_dir, stage_note)

REPO_ROOT = require_env('DSH_REPO_ROOT', '站点仓库根目录（含 site-urls.txt）')
TIMEOUT   = optional_env('DSH_TIMEOUT', '30')     # 只有确实该有默认值的才用 optional_env

def main():
    preflight()            # 缺必需变量则一次性报出全部并 exit 2
    ...

# 写入前把路径交给 write_path()（或 write_dir()，见下）：
with open(write_path(STATE_FILE), 'w') as f: ...
# 读取**不要**用 write_path——读取要基于真实输入，只让"写"改道

# 任何会发请求 / 驱动浏览器的函数，开头一行 guard：
if dry_run_enabled():
    stage_note('indexnow_submit', '本应对 %d 条发 POST（已跳过）' % len(urls))
    return True, 'DRY-RUN 已跳过'
```

五条硬性约定：

1. **必需变量缺失即失败，不回落默认值。** 静默默认值会让脚本在错误路径上跑出
   "看起来正常"的结果，比直接报错危险得多。`require_env` 只记录，由 `preflight()`
   汇总后一次性报出（含变量名与用途），退出码 2。
2. **guard 的返回签名必须与真实路径一致。** 少一个元组元素，调用方解包就炸——
   而这个错误只在干跑时暴露。**注意本目录存在异形返回值**：`indexnow_submit`
   返回 2 元组、`indexnow_submit_batch` 返回 3 元组、
   `real_browser_site_check` 返回 **list**（不是 `None`，调用方会对元素调
   `.split()`）。照抄别人的 guard 前先看它真实 return 什么。
3. **干跑的写入重定向到 `.dry-run/<时间戳>/`，不是丢弃。** 干跑的价值之一是能检视
   "本来会写出什么"；同时保证真实文件零改动。检视 `would-do.log` 可见全部被跳过的副作用。
4. **干跑不得触碰桌面。** 浏览器驱动（UIA/OCR）也算副作用，必须 guard。
5. **要写的文件一律过 `write_dir()`，不要依赖"别的代码先 makedirs 过"。**
   脚本里常见 `makedirs(OUT_DIR)` 然后 `open(state)` 的隐含顺序；一旦 `state`
   被改道到暂存目录，父目录就没人建了——真实运行正常，只有干跑报
   `FileNotFoundError`。`write_dir()` 自己保证父目录存在，消除这种顺序依赖。

### 路径变量（三个，语义不同，别混用）

| 变量 | 含义 | 典型位置 |
| --- | --- | --- |
| `DSH_WORKSPACE` | **应用目录** = `.wx-bridge` 本身（其下有 `plans/`、`spool/`、凭据） | `/path/.wx-bridge` |
| `DSH_DATA_DIR` | **平铺数据目录**：直接放着 `_bing_*.jsonl`、`_gsc_*.json` 等结果文件 | 默认同 `DSH_WORKSPACE` |
| `DSH_APP_DIR` | **第三方本地模块目录**：`wx_driver.py`、`boot311.py` 所在 | 默认同 `DSH_WORKSPACE` |

三个分开是有原因的：早期版本把前两者混用同一个变量，导致同一个变量在测试里指向不同
东西（`medium_daily.py` 曾把报告写进 `ops/seo/.wx-bridge/`）。测试环境用不同取值就能
验证写入是否真的被改道。

### 为什么有三个脚本没有 `dry_run_enabled()` guard

`bing_reclassify.py`、`gsc_bucket_analysis.py`、`gsc_daily_merge.py` 是纯本地读写，
不驱动浏览器、不发请求。**它们不是"有意的省略"，而是已用更强的手段覆盖**：
它们的写入全部经过 `write_path()`，而"真实文件零改动、产物全在 `.dry-run/` 下"
由冒烟测试的 mtime 快照直接证明——**这比代码里任何 guard 都强**（guard 只能证明
你想到了的副作用点）。给它们加 guard 反而会阻止产出"干跑本来要看的结果"
（例如 `gsc_bucket_analysis` 的分桶统计本身就是干跑的输出）。

若将来给这类脚本加了网络或桌面操作，**必须补 guard**，不能再靠 mtime 覆盖。

### 至少有一次冒烟必须在「干净目录」下跑

只在一个已经跑过很久的目录上做冒烟是不够的：**路径解析可能靠"陈旧输入恰好存在"而通过**，
给出虚假信心。规则是——**把输入文件指向一个空目录，证明路径解析是从零成立的**。

实测（空 `DSH_DATA_DIR`，`DSH_WORKSPACE` 只提供 `plans/`）：

| 脚本 | 退出码 | 行为 |
| --- | --- | --- |
| `bing_reclassify.py` / `gsc_bucket_analysis.py` / `gsc_daily_merge.py` / `gsc_run.mjs` | 1 | 响亮失败（ENOENT）—— 正确 |
| `bing_verify.py` | 0 | 清单来自 `DSH_REPO_ROOT`（存在），结果文件不存在按"全新状态"处理 —— 正确 |
| `bing_daily_batch.py` | 0 | 结果文件不存在按"全新状态"处理 —— 正确 |

空目录**最终零文件**，证明写入确实全部改道。

这次实验顺带修掉一个真弱点：`bing_daily_batch.py` 原先在**缺 API key 时干跑也返回 0**。
干跑的意义就是验证配置齐备，配置缺失却报成功属于"静默成功"——最危险的失败模式。
现在它 `exit 2`，并且干跑会显式打印**输入与结果的来源**：

```
[dry-run] API key  : 已取得
[dry-run] 清单文件 : <repo>/site-urls.txt（3278 条）
[dry-run] 结果文件 : <...>/_bing_valid_only.jsonl（不存在 —— 视为全新状态）
[dry-run] 剩余待查 : 3278 条
```

"不存在 —— 视为全新状态"与"存在，已有 N 条"两种措辞是刻意的：前者可能是全新环境、
也可能只是 `DSH_DATA_DIR` 配错，把状态说清楚让人能自己判断，而不是让脚本猜。

### 验证干跑真的无副作用


**不要靠读代码**（那依赖你是否想到了全部副作用点）。跑前后比对文件 mtime：

```bash
# 跑前留快照
find ops/seo -type f -printf '%p|%T@|%s\n' | sort > /tmp/before.txt
python ops/seo/seo_daily.py --dry-run
find ops/seo -type f -printf '%p|%T@|%s\n' | sort > /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt   # 差异应只出现在 .dry-run/ 下
```

任何 `.dry-run/` 之外的改动都说明有漏网的写入。

`seo_daily.py` 的实测结果（2026-10-16）：退出码 0；差异 3 项全部位于
`.dry-run/20261016-141611/`（日报、重定向后的状态文件、`would-do.log`）；
真实 `plans/seo-state.json` 的 mtime 未变。

## 计划任务如何调用（launcher 机制）

**所有计划任务都通过 `run-task.ps1 -Name <任务名>` 启动**，参数与说明集中在 `tasks.json`，
路径与凭据集中在 `.env`（不入库，从 `CONFIG.example.env` 复制）。

```
程序: powershell.exe
参数: -NoProfile -ExecutionPolicy Bypass -File "<repo>\ops\seo\run-task.ps1" -Name bing-coverage
```

```powershell
.\run-task.ps1 -Name bing-coverage -List          # 看这个任务会跑什么（不执行）
.\run-task.ps1 -Name bing-coverage -ExtraArgs "--dry-run"   # 手工加开关
```

**为什么参数放在 `tasks.json` 而不写在任务命令行里**（这是踩过的坑）：
把 `--dry-run` 经 `powershell.exe -File` 传参**不可靠** —— 外层 PowerShell 先做参数绑定，
一个以连字符开头、后面没有空白的 token 会被**逐字符展开**，`--dry-run` 变成
`- - d r y - r u n`；`--limit 10` 只因为空格终止扫描才幸免。用 argv 探针实测确认过。
把开关放进文件，就从根上消除了这个失败模式，而不是继续绕过它。

**为什么启动器是 `.ps1` 而不是 `.cmd`**：`.cmd` 的 `for /f` 用**系统 ANSI 码页**读取文件，
而 `.env` 是 UTF-8，中文路径（本机工作区路径就是中文）会被读坏，表现为"变量明明配了却为空"。
PowerShell 可以显式指定 UTF-8 读取，因此启动器必须是 PowerShell。

**两条硬性约定**：
1. **`.ps1` 文件保持纯 ASCII。** Windows PowerShell 5.1 对**无 BOM** 的 UTF-8 文件按 ANSI
   码页解码，非 ASCII 内容会变乱码并可能破坏语法。中文留给 Python 脚本打印。
2. **启动器设置 `[Console]::OutputEncoding = UTF-8`。** 否则 5.1 用 ANSI 码页解码子进程
   stdout，Python 打印的中文在日志里会变成乱码。

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
