"""纠正 _bing_urlinfo.jsonl 的判定口径。

原脚本把 GetUrlInfo 的 400 一律当成 "Bing 未收录该 URL"，但其中绝大多数其实是
  {"ErrorCode":5,"Message":"ERROR!!! ThrottleHost"}
—— Bing 的 host 级限流，是**测量失败**，不是收录结论。
把限流当成"未收录"会系统性低估收录情况，是错误数据。

本脚本就地重写每条记录的 verdict：
  indexed_known : http 200，Bing 有该 URL 的抓取记录（真实结论）
  throttled     : http 400 且含 ThrottleHost（无效测量，需退避后重试）
  unknown_url   : http 400 且明确 InvalidUrl（真实结论：Bing 不认识该 URL）
  other_error   : 其它（含 503 等），无效测量
"""
import json, io, collections, os

# ── 统一配置 / 干跑层（模式见同目录 preflight.py）──────────────────────
from preflight import preflight, dry_run_enabled, write_path, stage_note, require_env, optional_env



preflight()   # 缺必需变量即报出并退出（不回落默认值）
DATA_DIR = optional_env('DSH_DATA_DIR', require_env('DSH_WORKSPACE', '.wx-bridge 目录（含 plans/）'))
P = os.path.join(DATA_DIR, '_bing_urlinfo.jsonl')
recs = []
for line in io.open(P, encoding="utf-8"):
    line = line.strip()
    if not line:
        continue
    try:
        recs.append(json.loads(line))
    except Exception:
        pass
print("  读入记录:", len(recs))

BUCKETS = os.path.join(DATA_DIR, '_bing_buckets.jsonl')
out = io.open(write_path(BUCKETS), "w", encoding="utf-8")
stat = collections.Counter()
for r in recs:
    body = str(r.get("raw", ""))
    http = r.get("http")
    if http == 200:
        v = "indexed_known"
    elif "ThrottleHost" in body:
        v = "throttled"
    elif "InvalidUrl" in body:
        v = "unknown_url"
    else:
        v = "other_error"
    r["verdict"] = v
    stat[v] += 1
    out.write(json.dumps(r, ensure_ascii=False) + "\n")
out.close()

print()
print("  === 纠正后的判定分布 ===")
for k, v in stat.most_common():
    print("    %-14s %5d" % (k, v))
print()
print("  ⚠ 有效测量（真实结论）:", stat["indexed_known"] + stat["unknown_url"])
print("  ⚠ 无效测量（限流/其他）:", stat["throttled"] + stat["other_error"])
print()
print("  已写出纠正版 ->", os.path.basename(BUCKETS))

# 有效测量里，按深度看分布（Bing 认识的都是浅层页面，这本身是个结论）
if stat["indexed_known"]:
    print()
    print("  === indexed_known 的 URL（全部 %d 条）===" % stat["indexed_known"])
    for r in recs:
        if r.get("verdict") == "indexed_known":
            print("    %s" % r["url"].replace("https://iplmanufacturer.com", ""))
