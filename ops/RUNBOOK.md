# RUNBOOK · 构建与守卫故障排查

本文件记录"构建/守卫失败时先查什么"，避免直接改守卫逻辑。
新增条目请注明日期与触发原因。

---

## 1. 依赖构建产物的守卫失败时，先查 `astro/dist/`

**症状**：`check-llms.mjs`、`check-llms-specs.mjs`、`verify-baseline.mjs`、`check-jsonld.mjs` 报错说某个文件/页面不存在或数量不符。

**原因**：这些守卫读的是 `astro/dist/` 里的构建产物。`dist/` 是 `.gitignore` 的产物目录，可能为空或残缺。

**检查顺序**（按此顺序做，不要跳步）：

```powershell
# 1. dist 是否存在且非空
Test-Path astro/dist
(Get-ChildItem astro/dist -Recurse -File -Filter *.html | Measure-Object).Count
# 期望：约 3285 个 .html（随内容增长，见 scripts/baseline.json 的 htmlTotal）

# 2. 若为 0 或明显偏少 → 重建，不要改守卫
cd astro
npm run build
```

**已知实例**：2026-10-20 发现 `astro/dist` 为 0 文件，当时 `check-llms.mjs` 无法本地执行。原因是产物目录被清空，不是守卫逻辑错误。**未找到自动删除 dist 的脚本**，推测为某次构建中断或手动清理。

**判断准则**：守卫报"某个产物不存在"时，先怀疑产物，再怀疑守卫。守卫本身有独立的正反测试（见第 2 节），不要用改守卫的方式绕过产物缺失。

---

## 2. 守卫和规则的自测方法

改 `ops/seo/clean_check.py` 或新增守卫前，先跑正反测试，确认改动真的生效且没有过度放行。

### `clean_check.py`（提交前钩子）

```powershell
# 正向：真实私有 IP 应被抓
# 注意：本文件本身要能通过 R6，所以地址在运行时拼接，不写字面量。
$a = '10' + '.0.0.1'
$b = '192' + '.168.1.50'
"host: $a`nhost: $b" | Set-Content ops/seo/_probe.txt -Encoding utf8
python ops/seo/clean_check.py ops/seo/_probe.txt
# 期望：2 处命中，exit 1

# 反向：语义化版本不应被误伤
"version: ^10" + ".7.6" | Set-Content ops/seo/_probe.txt -Encoding utf8
python ops/seo/clean_check.py ops/seo/_probe.txt
# 期望：0 命中，exit 0

Remove-Item ops/seo/_probe.txt -Force
```

**路径级白名单的存在意义**：`astro/public/llms.txt` 的职责包含公开联系方式，R5 邮箱规则必然命中。白名单收窄到「文件 + 规则 + 具体值」，放行的是那一个已声明的联系邮箱，不是整个文件。新增白名单必须同样收窄，并附上"为什么不能放宽到文件级"的理由。

验证白名单没有放宽成文件级通行证（同样不写字面量地址，运行时拼接）：

```powershell
Copy-Item astro/public/llms.txt astro/public/llms.txt.bak
$r = 'rogue' + '@somebody-plc.com'
"rogue: $r" | Add-Content astro/public/llms.txt -Encoding utf8
python ops/seo/clean_check.py astro/public/llms.txt
# 期望：仍命中这个未声明的地址（只有已声明的那个联系邮箱被放行）
Move-Item astro/public/llms.txt.bak astro/public/llms.txt -Force
```

### `check-llms-coverage.mjs`（llms.txt 覆盖守卫）

```powershell
# 正向
cd astro; node scripts/check-llms-coverage.mjs        # 期望 exit 0

# 反向：塞一个不存在的 slug
"- [bogus](https://iplmanufacturer.com/blog/does-not-exist)" | Add-Content public/llms.txt -Encoding utf8
node scripts/check-llms-coverage.mjs                  # 期望 exit 1 并点名该 slug
```

---

## 3. 提交时钩子拦截的处理原则

`ops/seo/git-hooks/pre-commit` 调用 `clean_check.py --staged`，只扫**暂存文件**（刻意如此：全量扫描会让人开始加 `--no-verify`）。

**处理顺序**：

1. 先看命中项是真问题还是规则误报。
2. 真问题 → 改文件。
3. 规则误报 → **修正则精度**，不要用 `--no-verify` 绕过。
4. 规则本身正确但内容合法（如公开联系邮箱）→ 加**路径级 + 规则级 + 值级**白名单。
5. `--no-verify` 仅作最后手段，且 commit message 必须写明「为什么这是合法内容」与「规则为什么暂时无法修正」。

**已知历史**：

| 日期 | 情况 | 处理 |
|---|---|---|
| 2026-10-20 | `llms.txt` 的公开联系邮箱触发 R5，导致每次触碰该文件都要 `--no-verify` | 加三级白名单，不再需要绕过 |
| 2026-10-20 | R6 私有 IP 正则的 `10` 分支只匹配 3 段，把 `package.json` 里 `^10.7.6` 当私有 IP 拦下 | 修正为统一 4 段匹配 |

---

## 4. 不要做的事

- 不要为了让构建通过而放宽守卫的判定条件 —— 守卫失败通常是对的。
- 不要手工编辑 `astro/dist/_redirects`（构建期整体覆盖，见 `scripts/flatten-html.mjs` 注释）。
- 不要在不确认 `dist/` 状态的情况下重跑单条守卫并下结论。
