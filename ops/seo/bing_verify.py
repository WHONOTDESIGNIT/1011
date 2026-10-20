"""Bing 收录核验：对 3278 条清单逐条调 GetUrlInfo（只读，不提交）。

输出：
  - _bing_urlinfo.jsonl   每行一条结果
  - 控制台进度与分类统计
判定口径（Bing Webmaster API 不直接暴露"已收录"布尔值）：
  - known   : GetUrlInfo 返回 200 → Bing 已发现该 URL（有 DiscoveryDate/LastCrawledDate）
  - unknown : GetUrlInfo 返回 400 InvalidUrl → Bing 未收录该 URL
  另记录 LastCrawledDate，用于区分"已发现且近期抓取"与"已发现但久未抓取"。
"""
import json, io, urllib.request, urllib.parse, datetime, ssl, time, os, sys, collections

# ── 统一配置 / 干跑层（模式见同目录 preflight.py）──────────────────────
from preflight import preflight, dry_run_enabled, write_path, stage_note, require_env, optional_env



preflight()   # 缺必需变量即报出并退出（不回落默认值）
KEY = "28c525592dbb4fc481531dcfb7ce33db"
BASE = "https://ssl.bing.com/webmaster/api.svc/json"
SITE = "https://iplmanufacturer.com/"
# 平铺数据目录（_bing_*.jsonl 所在）；默认与应用目录相同。
# 与 DSH_WORKSPACE 分开是因为二者语义不同：后者是 .wx-bridge（含 plans/），
# 前者是直接放着结果文件的数据目录。测试时可以让它们指向不同位置。
DATA_DIR = optional_env('DSH_DATA_DIR', require_env('DSH_WORKSPACE', '.wx-bridge 目录（含 plans/）'))
OUT = os.path.join(DATA_DIR, '_bing_urlinfo.jsonl')
LIST = os.path.join(require_env('DSH_REPO_ROOT', '站点仓库根目录（含 site-urls.txt）'),
                    'site-urls.txt')

ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE


def ms(v):
    try:
        n = int(str(v).replace("/Date(", "").replace(")/", ""))
        if n <= 0 or n > 4102444800000:   # 2100-01-01 上限，防越界
            return None
        return datetime.datetime.fromtimestamp(n / 1000, datetime.UTC)
    except Exception:
        return None


def get(method, **kw):
    q = urllib.parse.urlencode(kw)
    url = "%s/%s?apikey=%s&%s" % (BASE, method, KEY, q)
    last = None
    for attempt in (1, 2, 3):
        try:
            with urllib.request.urlopen(url, timeout=40, context=ctx) as r:
                return r.status, json.loads(r.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            # 读错误体本身也可能半途断流（IncompleteRead）——单独兜住，勿让它冒泡
            try:
                body = e.read().decode("utf-8", "replace")[:300]
            except Exception:
                body = ""
            return e.code, body
        except Exception as e:
            last = e
            if attempt < 3:
                time.sleep(2 * attempt)
    return "ERR", str(last)[:140]


def classify(http, body):
    """把 API 响应归类。

    关键：GetUrlInfo 的 400 有两种完全不同的含义，绝不可混为一谈——
      · {"ErrorCode":5,"Message":"ERROR!!! ThrottleHost"} → **限流**，是测量失败；
      · {"ErrorCode":7,"Message":"ERROR!!! InvalidUrl"}  → Bing 不认识该 URL，是真实结论。
    把限流当成「未收录」会系统性低估收录率（本脚本第一版就犯了这个错）。
    """
    b = str(body)
    if http == 200:
        return "indexed_known"
    if "ThrottleHost" in b or "Throttle" in b:
        return "throttled"
    if "InvalidUrl" in b:
        return "unknown_url"
    return "other_error"


urls = [l.strip() for l in io.open(LIST, encoding="utf-8") if l.strip()]
done = set()
if os.path.exists(OUT):
    for line in io.open(OUT, encoding="utf-8"):
        try:
            done.add(json.loads(line)["url"])
        except Exception:
            pass
todo = [u for u in urls if u not in done]
print("清单 %d 条 | 已完成 %d | 本次待查 %d" % (len(urls), len(done), len(todo)), flush=True)

if dry_run_enabled():
    print("  [dry-run] 跳过 %d 条 URL 的 GetUrlInfo 查询（未发请求）" % len(todo))
    stage_note("bing_verify", "本应查询 %d 条（已跳过）" % len(todo))
    raise SystemExit(0)
now = datetime.datetime.now(datetime.UTC)
# 写入走 write_path()：--dry-run 下改道 .dry-run/，不污染真实结果文件
out = io.open(write_path(OUT), "a", encoding="utf-8")
stat = collections.Counter()
t0 = time.time()
# 退避游标：命中限流后等待、再继续，而不是把限流写进结果当结论
backoff = 0
for i, u in enumerate(todo, 1):
    st, d = get("GetUrlInfo", siteUrl=SITE, url=u)
    verdict = classify(st, d)
    rec = {"url": u, "checkedAt": now.isoformat(), "http": st, "verdict": verdict}
    if verdict == "indexed_known" and isinstance(d, dict):
        x = d.get("d", {}) or {}
        disc, crawl = ms(x.get("DiscoveryDate")), ms(x.get("LastCrawledDate"))
        rec.update({
            "known": True,
            "discovery": disc.isoformat() if disc else None,
            "lastCrawled": crawl.isoformat() if crawl else None,
            "daysSinceCrawl": round((now - crawl).total_seconds() / 86400, 1) if crawl else None,
            "docSize": x.get("DocumentSize"),
        })
    else:
        rec.update({"known": False, "raw": str(d)[:200]})
    # 限流：不写结果（避免污染），改为等待后重试；连续限流则逐步拉长间隔
    if verdict == "throttled":
        stat["throttled_skipped"] += 1
        backoff = min(backoff + 30, 300)
        time.sleep(backoff)
        continue
    if verdict not in ("indexed_known", "unknown_url"):
        stat["other_error"] += 1
        continue
    backoff = 0
    stat[verdict] += 1
    out.write(json.dumps(rec, ensure_ascii=False) + "\n")
    if stat["indexed_known"] + stat["unknown_url"] <= 5 or (stat["indexed_known"] + stat["unknown_url"]) % 25 == 0:
        out.flush()
        el = time.time() - t0
        eff = stat["indexed_known"] + stat["unknown_url"]
        print("  有效 %d/%d  indexed=%d unknown=%d 限流跳过=%d  %.2fs/url" % (
            eff, len(todo), stat["indexed_known"], stat["unknown_url"],
            stat["throttled_skipped"], el / max(i, 1)), flush=True)
out.close()
print("DONE indexed_known=%d unknown_url=%d throttled_skipped=%d other_error=%d" % (
    stat["indexed_known"], stat["unknown_url"], stat["throttled_skipped"], stat["other_error"]), flush=True)
