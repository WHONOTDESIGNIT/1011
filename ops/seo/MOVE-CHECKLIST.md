# MOVE-CHECKLIST · 仓库搬家时要跟着改的东西

搬一次仓库根 = **纯本地操作**：Netlify 只认 git 仓库和仓库内的相对路径，
本地文件夹放哪儿、在哪一层，都不影响部署。

真正会断的只有"写死了绝对路径"的地方。这个文件就是那份清单。
（具体机器的旧路径、新路径、任务定义备份目录不入库，写在本地未跟踪的说明里。）

## 1. 定时任务（Windows）

共 7 个，全部调用同一支入口，只有 `-Name` 不同：

| 任务名 | `-Name` |
|---|---|
| DSH_Bing_Coverage_Daily | bing-coverage |
| DSH_GSC_RequestIndexing_Daily | gsc-index |
| GSC-URL-Inspection-Daily | gsc-daily |
| DSH_Medium_Daily | medium-daily |
| DSH_SEO_Daily | seo-daily |
| DSH_SEO_Email | seo-email |
| DSH_SEO_Weekly | seo-weekly |

改法（先禁用，改完再启用；三个 Ready 的尤其别忘）：

```powershell
$repo = (git rev-parse --show-toplevel)
$new  = "-NoProfile -ExecutionPolicy Bypass -File $repo\ops\seo\run-task.ps1 -Name bing-coverage"
Set-ScheduledTask -TaskName DSH_Bing_Coverage_Daily `
  -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $new)
```

搬之前先导出定义，万一中断可以一键还原：

```powershell
Export-ScheduledTask -TaskName DSH_Bing_Coverage_Daily |
  Out-File "$env:TEMP\iShine-task-backup.xml"
# 还原：Register-ScheduledTask -Xml (Get-Content ... -Raw) -TaskName ...
```

## 2. 配置（不入库）

- `ops/seo/.env` → `DSH_REPO_ROOT=<新的仓库根>`
- `DSH_DATA_DIR` 不用改：它指向数据目录，与仓库位置无关

## 3. 验收（缺一不可）

```powershell
cd astro; npm run build                                   # ✅ all checks passed / 3,433 页
.\ops\seo\run-task.ps1 -Name bing-coverage -ExtraArgs "--dry-run"   # 清单可读、exit 0
git worktree list                                         # 只剩主仓库
git config core.hooksPath                                 # ops/seo/git-hooks
```

## 4. 搬完别急着一件事

归档目录的改名要**单独一轮**做，并且同一次把所有引用（AGENTS.md、commit body、
分支恢复清单）一起改到新路径 —— 否则"去那里找回"的指引会集体失效，
下一次事故就藏在这批断链里。
