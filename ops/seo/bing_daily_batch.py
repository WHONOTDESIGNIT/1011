# -*- coding: utf-8 -*-
"""Bing 逐 URL 收录核验（按天分批，可断点续跑）。

为什么要"按天分批"
------------------
Bing Webmaster 的 GetUrlInfo 有**host 级每日配额**（实测报文 {"ErrorCode":5,
"Message":"ERROR!!! ThrottleHost"}）。关键实测结论：

  · 配额按**请求数**计，不是按不同 URL 数 —— 重复查询也消耗额度；
  · 一旦耗尽，**退避/重试完全无效**：实测连续 40 分钟、每 30–300 秒重试，零成功；
  · 配额按日重置（UTC 00:00 = 北京时间 08:00），**换一天才会恢复**；
  · 限流只作用于 GetUrlInfo，GetCrawlStats 等聚合接口不受影响。

因此本脚本的正确用法是：**每次只跑一个小额度，按天累积**，而不是一次跑完。
把限流当作"未收录"写进结果是最危险的错误（会系统性低估收录率），
故本脚本对限流一律 **不落盘**，只记入当日统计。

决策点：逐条核验值得继续吗？
----------------------------
本脚本的 `--limit` 初值 10 是**保守假设，不是实测额度**。首跑（2026-10-17 08:30）
之后必须用真实数字复核：

  · 若日均有效额度 ≥ 约 100 条/天 → 3175 条约 1 个月可完成，**逐条核验值得继续**；
  · 若日均仅 ~10 条/天            → 需约 318 天，**不具可行性**。

后者情况下的既定退路（已与业主确认）：
  **放弃逐条核验，日报只保留 GetCrawlStats 的聚合值 InIndex 作为 Bing 指标。**
  （该值随时间变化，脚本运行时实时查询，不写死。）
  理由：聚合值不受 GetUrlInfo 的日配额限制，随时可查，且它本就是 Bing 后台
  Site Explorer 显示的那个数；逐条核验只是"锦上添花"，不该为此投入一年。

查看真实额度：读 `_bing_batch_state.json` 的 `totals` 字段，按日对比
`indexed_known + unknown_url` 与 `throttled`。

凭证
----
API key 从同目录 bing_api_key.txt 读取（不写入版本库）。
若文件不存在，回退到环境变量 BING_WEBMASTER_API_KEY。

用法
----
  python bing_daily_batch.py                # 跑默认额度（10 条）并打印统计
  python bing_daily_batch.py --limit 30     # 指定本次额度
  python bing_daily_batch.py --report       # 只打印累计进度，不发请求
"""
import argparse
import collections
import datetime
import io
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

# ── 统一配置 / 干跑层（模式见同目录 preflight.py）──────────────────────
from preflight import preflight, dry_run_enabled, write_path, stage_note, require_env, optional_env


sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = optional_env('DSH_DATA_DIR', HERE)
STATE = os.path.join(DATA_DIR, '_bing_batch_state.json')
RESULTS = os.path.join(DATA_DIR, '_bing_valid_only.jsonl')     # 只存有效结论
KEY_FILE = os.path.join(HERE, 'bing_api_key.txt')

BASE = 'https://ssl.bing.com/webmaster/api.svc/json'
SITE = 'https://iplmanufacturer.com/'
# 站点清单来自仓库（与构建链共用同一份），路径从环境变量取
LIST = os.path.join(require_env('DSH_REPO_ROOT', '站点仓库根目录（含 site-urls.txt）'),
                    'site-urls.txt')

DEFAULT_LIMIT = 10
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def load_key():
    # 凭据优先级：环境变量 → 本目录 → .wx-bridge（凭据留在工作区，不入库）
    env = os.environ.get('BING_WEBMASTER_API_KEY', '').strip()
    if env:
        return env
    for cand in (KEY_FILE, os.path.join(os.environ.get('DSH_WORKSPACE', ''), 'bing_api_key.txt')):
        if cand and os.path.exists(cand):
            return io.open(cand, encoding='ascii').read().strip()
    return ''


def call_geturl(url, key):
    q = urllib.parse.urlencode({'siteUrl': SITE, 'url': url})
    full = '%s/GetUrlInfo?apikey=%s&%s' % (BASE, key, q)
    try:
        with urllib.request.urlopen(full, timeout=40, context=CTX) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        try:
            return e.code, e.read().decode('utf-8', 'replace')[:300]
        except Exception:
            return e.code, ''
    except Exception as e:
        return 'ERR', str(e)[:140]


def classify(http, body):
    """限流与"未收录"必须严格区分——这是本脚本的核心口径。"""
    b = str(body)
    if http == 200:
        return 'indexed_known'
    if 'ThrottleHost' in b or 'Throttle' in b:
        return 'throttled'
    if 'InvalidUrl' in b:
        return 'unknown_url'
    return 'other_error'


def load_state():
    if os.path.exists(STATE):
        try:
            return json.load(io.open(STATE, encoding='utf-8'))
        except Exception:
            pass
    return {'done': {}, 'quota_exhausted_dates': [], 'totals': {}}


def save_state(st):
    io.open(write_path(STATE), 'w', encoding='utf-8', newline='').write(
        json.dumps(st, ensure_ascii=False, indent=1))


QUEUE_FILE = os.path.join(DATA_DIR, '_bing_queue.json')


def load_urls(use_queue=True):
    """待查 URL 清单。

    优先用 DSH_DATA_DIR/_bing_queue.json（有序队列，由 bing_make_queue.py 生成）：
    高价值优先、其余抽样，顺序即优先级。存在该文件时只用它，
    避免"全量清账"把有限额度摊薄。
    没有队列文件时回退到仓库 site-urls.txt（全量）。
    """
    if use_queue and os.path.exists(QUEUE_FILE):
        import json as _json
        try:
            q = _json.load(io.open(QUEUE_FILE, encoding='utf-8'))
            return [str(u).strip() for u in q if str(u).strip()]
        except Exception as e:
            print('  ⚠ 队列文件无法解析（%r），回退到 site-urls.txt' % (e,))
    return [l.strip() for l in io.open(LIST, encoding='utf-8') if l.strip()]


def valid_urls():
    """已有有效结论的 URL 集合（indexed_known 或 unknown_url）"""
    s = set()
    if os.path.exists(RESULTS):
        for line in io.open(RESULTS, encoding='utf-8'):
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
                if r.get('verdict') in ('indexed_known', 'unknown_url'):
                    s.add(r['url'])
            except Exception:
                pass
    return s


def fetch_inindex():
    """取 GetCrawlStats 的最新 InIndex（Bing 后台显示的收录数）。

    这个接口不受 GetUrlInfo 的令牌桶限制，可以随时查。
    返回 None 表示查询失败（不应因此让整个报告失败）。
    """
    q = urllib.parse.urlencode({'siteUrl': SITE})
    url = '%s/GetCrawlStats?apikey=%s&%s' % (BASE, load_key(), q)
    try:
        with urllib.request.urlopen(url, timeout=30, context=CTX) as r:
            rows = (json.loads(r.read().decode('utf-8', 'replace')) or {}).get('d') or []
        if not rows:
            return None
        last = rows[-1]

        def _ms(v):
            try:
                n = int(str(v).replace('/Date(', '').replace(')/', ''))
                return datetime.datetime.fromtimestamp(n / 1000, datetime.UTC)
            except Exception:
                return None

        dt = _ms(last.get('Date'))
        return {'inindex': last.get('InIndex'),
                'date': dt.strftime('%Y-%m-%d') if dt else str(last.get('Date'))}
    except Exception:
        return None


def report(st):
    urls = load_urls()
    done = valid_urls()
    # 队列范围与全站范围不同：done 里可能有一批不在当前队列内的 URL。
    # 所以"剩余"必须按"队列里尚未有结论的条数"算，不能用总量相减。
    in_queue_done = sum(1 for u in urls if u in done)
    remaining = len(urls) - in_queue_done
    src = QUEUE_FILE if (QUEUE_FILE and os.path.exists(QUEUE_FILE)) else LIST
    print('=== Bing 逐 URL 核验进度 ===')
    print('  队列来源        : %s' % os.path.basename(src))
    print('  队列条数        : %d' % len(urls))
    print('  其中已有结论    : %d (%.1f%%)' % (
        in_queue_done, 100.0 * in_queue_done / max(len(urls), 1)))
    print('  队列剩余待查    : %d' % remaining)
    print('  全站累计已核验  : %d 条（含队列外的历史结论）' % len(done))
    idx = 0
    unk = 0
    if os.path.exists(RESULTS):
        for line in io.open(RESULTS, encoding='utf-8'):
            try:
                v = json.loads(line).get('verdict')
                if v == 'indexed_known':
                    idx += 1
                elif v == 'unknown_url':
                    unk += 1
            except Exception:
                pass
    print('    ├ Bing 已发现并抓取 : %d' % idx)
    print('    └ Bing 明确未收录   : %d' % unk)
    print('  配额耗尽日        : %s' % (', '.join(st.get('quota_exhausted_dates', [])) or '（无）'))
    print()
    agg = fetch_inindex()
    if agg:
        print('  参照：GetCrawlStats.InIndex = %s（%s，实时查询，不受逐条额度限制）'
              % (agg['inindex'], agg['date']))
    else:
        print('  参照：GetCrawlStats.InIndex 查询失败（不影响本轮逐条结果）')
    print('  注：GetUrlInfo 返回 200 仅表示 Bing 已发现并抓取过，不等于已在搜索结果展示。')


def main():
    preflight()   # 缺必需变量即报出并退出
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int, default=DEFAULT_LIMIT,
                    help='本次最大请求数（含被限流的请求，因配额按请求数计）')
    ap.add_argument('--report', action='store_true', help='只打印进度，不发请求')
    ap.add_argument('--interval', type=float, default=None,
                    help='两次请求之间等待的秒数（默认取 DSH_BING_INTERVAL 或 45）')
    ap.add_argument('--queue', default=None,
                    help='all=忽略队列文件走全量清单；也可给自定义队列文件路径')
    # --dry-run 由 preflight 层识别（读 sys.argv）；这里必须也声明，
    # 否则 argparse 会以 unrecognized arguments 直接报错退出。
    ap.add_argument('--dry-run', action='store_true',
                    help='只验证路径与配置，不发请求、不写结果')
    args = ap.parse_args()

    # 请求间隔：实测 Bing 的 GetUrlInfo 是**令牌桶**而非硬日额度——
    # 1 条/秒连发会在第 19 次被限流，而 1 条/30 秒可连续 20 次无限流。
    # 所以控的是"密度"，不是"每天多少条"。默认 45 秒留出余量。
    interval = args.interval
    if interval is None:
        try:
            interval = float(os.environ.get('DSH_BING_INTERVAL', '45'))
        except ValueError:
            interval = 45.0
    # 队列来源：默认用 _bing_queue.json（高价值优先 + 抽样）；--queue all 走全量
    global QUEUE_FILE
    if args.queue:
        if args.queue.lower() == 'all':
            QUEUE_FILE = ''          # 空路径 => 不存在 => 回退 site-urls.txt
        else:
            QUEUE_FILE = args.queue
    st = load_state()
    if args.report:
        report(st)
        return

    key = load_key()
    if not key and not dry_run_enabled():
        print('❌ 未找到 API key：请把 key 写入 %s，或设置环境变量 BING_WEBMASTER_API_KEY' % KEY_FILE)
        sys.exit(1)
    if not key:
        # 干跑的意义就是验证配置。缺 key 说明配置不全，此时报成功会给出虚假信心。
        print('❌ 未找到 API key（环境变量 BING_WEBMASTER_API_KEY / 本目录 bing_api_key.txt /'
              ' DSH_WORKSPACE/bing_api_key.txt 均无）')
        print('   干跑用于验证配置是否齐备，配置缺失时不应报告成功。')
        sys.exit(2)

    today = datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%d')
    done = valid_urls()
    todo = [u for u in load_urls() if u not in done]
    if not todo:
        print('✅ 全部 %d 条均已有有效结论，无需再查。' % len(load_urls()))
        report(st)
        return

    if dry_run_enabled():
        # 干跑不发任何请求（不落盘已在 write_path 处处理；这里是"不打 API"）
        all_urls = load_urls()
        print('  [dry-run] API key  : 已取得')
        src = QUEUE_FILE if (QUEUE_FILE and os.path.exists(QUEUE_FILE)) else LIST
        print('  [dry-run] 队列来源 : %s（%d 条）' % (src, len(all_urls)))
        print('  [dry-run] 结果文件 : %s（%s）' % (
            RESULTS, '存在，已有 %d 条有效结论' % len(done) if os.path.exists(RESULTS) else '不存在 —— 视为全新状态'))
        print('  [dry-run] 剩余待查 : %d 条' % len(todo))
        if not all_urls:
            print('❌ 清单为空，几乎一定是 DSH_REPO_ROOT 配错（期望 site-urls.txt 有内容）')
            sys.exit(2)
        if not os.path.exists(RESULTS) and done:
            print('⚠ 结果文件不存在但已有完成记录，状态不一致，请检查 DSH_DATA_DIR')
        print('  [dry-run] 跳过全部 GetUrlInfo 请求（未发网络调用）')
        stage_note('bing_daily_batch', '本应查询 %d 条（已跳过）' % len(todo))
        return

    print('=== Bing 逐 URL 核验（本次额度 %d 次请求）===' % args.limit)
    print('  UTC 日期 %s | 剩余待查 %d | 上次有效结论 %d | 请求间隔 %.0f 秒' % (
        today, len(todo), len(done), interval))

    out = io.open(write_path(RESULTS), 'a', encoding='utf-8')
    stat = collections.Counter()
    requests_made = 0
    throttle_streak = 0

    for u in todo:
        if requests_made >= args.limit:
            break
        requests_made += 1
        http, body = call_geturl(u, key)
        verdict = classify(http, body)

        if verdict == 'throttled':
            # 限流 = 无效测量：不落盘，立即停止本轮（继续试只会白烧额度）
            stat['throttled'] += 1
            throttle_streak += 1
            print('  ⛔ 第 %d 次请求即被限流，停止本轮（配额已耗尽，按日重置）' % requests_made)
            if today not in st['quota_exhausted_dates']:
                st['quota_exhausted_dates'].append(today)
            break

        throttle_streak = 0

        if verdict == 'other_error':
            # 网络/传输层失败（DNS 解析失败、连接重置等）不是"收录结论"，
            # 与限流一样属于**测量失败**：不落盘、不标 done，只计数。
            # 落盘会让"已核验"统计虚高，也会把失败当成结论带进后续分析。
            stat['other_error'] += 1
            print('  ⚠ 测量失败（不是结论）: %s  ← %s'
                  % (str(body)[:60], u.replace('https://iplmanufacturer.com', '')))
            time.sleep(min(interval, 2.0))
            continue

        rec = {'url': u, 'checkedAt': datetime.datetime.now(datetime.UTC).isoformat(),
               'http': http, 'verdict': verdict}
        if verdict == 'indexed_known':
            try:
                d = json.loads(body).get('d', {}) or {}
            except Exception:
                d = {}

            def ms(v):
                try:
                    n = int(str(v).replace('/Date(', '').replace(')/', ''))
                    return datetime.datetime.fromtimestamp(n / 1000, datetime.UTC) if 0 < n < 4102444800000 else None
                except Exception:
                    return None

            disc, crawl = ms(d.get('DiscoveryDate')), ms(d.get('LastCrawledDate'))
            rec.update({'known': True,
                        'discovery': disc.isoformat() if disc else None,
                        'lastCrawled': crawl.isoformat() if crawl else None,
                        'docSize': d.get('DocumentSize')})
        else:
            rec.update({'known': False, 'raw': str(body)[:200]})
        stat[verdict] += 1
        st['done'][u] = verdict
        out.write(json.dumps(rec, ensure_ascii=False) + '\n')
        out.flush()
        mark = '已发现' if verdict == 'indexed_known' else '未收录'
        print('  [%d/%d] %-6s %s' % (requests_made, args.limit, mark,
                                     u.replace('https://iplmanufacturer.com', '')))
        time.sleep(interval)   # 令牌桶补充慢：密度是关键，间隔过短会把桶抽干

    out.close()
    st['totals'][today] = dict(stat)
    save_state(st)
    valid = stat['indexed_known'] + stat['unknown_url']
    print()
    print('  本轮：有效 %d（已发现 %d / 未收录 %d），限流 %d，测量失败 %d，共发请求 %d'
          % (valid, stat['indexed_known'], stat['unknown_url'],
             stat['throttled'], stat['other_error'], requests_made))
    print()
    report(st)

    # 发出过请求、却一条有效结论都没有、也不是限流 => 网络或配置故障。
    # 必须以非零退出，否则计划任务的 LastTaskResult 仍是 0，故障无声。
    # 2026-10-18/19 连续两天 25 次请求全 DNS 失败却报成功，就是缺这道判断。
    if requests_made > 0 and valid == 0 and stat['throttled'] == 0:
        print()
        print('❌ 本轮零有效结论，且非限流所致 —— 判为网络/配置故障，退出码 1')
        print('   已检查：DSH_REPO_ROOT / DSH_DATA_DIR / API key / 出网 DNS')
        sys.exit(1)


if __name__ == '__main__':
    main()
