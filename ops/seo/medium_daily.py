#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
medium_daily.py — Medium 每日精选采集 + 日报 + 微信/QQ 推送
==============================================================
数据源: Medium tag RSS（https://medium.com/feed/tag/{tag}，无需 JS、无需登录）
阅读链接: readmedium.com 镜像（https://readmedium.com/{medium_url}，浏览器端可用）
话题优先级: P1 IPL hair removal > P2 hair removal > P3 skin care > P4 品牌方 CEO/研发话题
推送: 微信文件传输助手 + QQ「我的手机」（spool outbox，watcher 自动发送）
日报: plans/medium-daily/medium-daily-YYYY-MM-DD.md
纯 Python 标准库实现，无外部依赖。每日 06:30（北京时间）由计划任务 DSH_Medium_Daily 触发。

用法:
  python medium_daily.py              # 正常采集 10 篇 + 推送
  python medium_daily.py --dry-run    # 只生成日报，不推送
  python medium_daily.py --limit 5    # 采集 5 篇
  python medium_daily.py --force      # 当日已运行过也强制重跑（推送去重守卫）
"""

import argparse
import email.utils
import html
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

# ── 统一配置 / 干跑层（模式见同目录 preflight.py）──────────────────────
from preflight import write_dir, preflight, dry_run_enabled, write_path, stage_note, require_env, optional_env


# ---------------------------------------------------------------- 配置区
# 工作基目录（.wx-bridge 的父目录，含 plans/ 与 spool/ 的上级）
# 工作区根目录：不写死本机路径，从环境变量取（缺了在 preflight() 处响亮失败）
# DSH_WORKSPACE 的语义与其他脚本一致 = .wx-bridge 目录本身（不是它的父目录）。
WORKSPACE = require_env('DSH_WORKSPACE', '.wx-bridge 目录（含 plans/、spool/）')
# 数据/输出目录单独可配，便于测试时与真实工作区隔离
DATA_DIR = optional_env('DSH_DATA_DIR', WORKSPACE)
WX_SPOOL = os.path.join(DATA_DIR, "spool", "outbox")
QQ_SPOOL = os.path.join(DATA_DIR, "spool_qq", "outbox")
OUT_DIR  = os.path.join(DATA_DIR, "plans", "medium-daily")
STATE    = os.path.join(OUT_DIR, "state.json")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
TIMEOUT = 25
KEEP_DAYS = 30          # state 中文章去重窗口
DEFAULT_LIMIT = 10

# 话题 → (优先级, Medium tag 列表, 命中关键词)
# 关键词按重要度排序，标题命中加分高于摘要命中
TOPICS = [
    {
        "key": "ipl", "label": "IPL 脱毛（第一优先级）", "priority": 30,
        "tags": ["ipl-hair-removal", "ipl", "ipl-treatment", "ipl-device", "ipl-laser-hair-removal",
                 "intense-pulsed-light", "at-home-ipl", "beauty-devices"],
        "keywords": ["ipl", "intense pulsed light", "ipl device", "ipl hair removal",
                     "laser hair removal device", "at-home ipl", "home ipl", "ipl machine",
                     "ipl photofacial", "photofacial"],
    },
    {
        "key": "hair", "label": "脱毛（第二优先级）", "priority": 20,
        "tags": ["hair-removal", "laser-hair-removal", "hair-removal-at-home", "body-hair-removal", "laser"],
        "keywords": ["hair removal", "laser hair removal", "waxing", "epilation", "shaving",
                     "hair growth", "permanent hair removal"],
    },
    {
        "key": "skincare", "label": "皮肤护理", "priority": 12,
        "tags": ["skincare", "skin-care", "skincare-routine", "skincare-tips",
                 "light-therapy", "led-light-therapy", "phototherapy", "dermatology"],
        "keywords": ["skincare", "skin care", "skin barrier", "facial", "anti-aging",
                     "sensitive skin", "dermatology", "light therapy", "led light", "phototherapy",
                     "acne", "skin", "sunscreen", "serum", "moisturizer"],
    },
    {
        "key": "brand", "label": "品牌方 CEO / 研发工程师关注话题", "priority": 8,
        "tags": ["beauty-industry", "beauty-tech", "direct-to-consumer", "private-label",
                 "manufacturing", "industrial-design", "product-development", "supply-chain"],
        "keywords": ["beauty brand", "beauty industry", "d2c", "direct to consumer", "private label",
                     "oem", "odm", "sourcing", "supply chain", "manufacturing", "product development",
                     "industrial design", "brand building", "ecommerce", "retail", "consumer",
                     "ceo", "founder", "rd", "research", "innovation", "hardware", "product launch",
                     "certification", "fda", "ce marking", "quality control"],
    },
]

# 销售帖 / SEO spam 模式（标题命中 -12，摘要命中 -6）
SPAM_PATTERNS = [
    "price in pakistan", "price in india", "price in uae", "price in saudi",
    "in pakistan", "in india", "in bangladesh", "in nigeria", "in philippines",
    "best deals", "buy now", "coupon", "discount", "promo code", "% off",
    "free shipping", "cheapest", "amazon deal", "buynsale",
]
# 品牌方提及加分（用户点名的品牌 + 行业主流品牌）
BRAND_MENTIONS = [
    "mallows beauty", "ku-2", "ku2", "hetrios", "roxa",
    "jovs", "ulike", "nood", "silk'n", "silk n", "braun", "philips lumea",
    "smoothskin", "lumea", "me sleek", "triapulse", "sensica",
]
# whynotdesign / 自有品牌相关
WHYNOT_KEYWORDS = ["whynotdesign", "why not design"]

# IPL 消歧：Indian Premier League（板球）负向词——标题命中 -30、摘要命中 -10
IPL_CRICKET_WORDS = [
    "cricket", "trophy", "runs", "run scorer", "match", "wicket", "tournament",
    "rcb", "mumbai indians", "chennai super kings", "auction", "trade",
    "players", "batting", "bowling", "league", "sport", "premier league", "franchise",
]

TODAY = datetime.now().strftime("%Y-%m-%d")


# ---------------------------------------------------------------- 工具
def log(msg):
    print("[%s] %s" % (datetime.now().strftime("%H:%M:%S"), msg), flush=True)


def fetch(url, delay_before=2.0):
    """带 UA 的 GET；429 重试一次（12s 退避）后放弃该 tag，避免拖慢整体。
    连续 429 由调用方用返回标记中止。"""
    time.sleep(delay_before)
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept": "application/rss+xml, text/xml, */*",
            "Accept-Language": "en-US,en;q=0.9",
        })
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.read().decode("utf-8", "replace"), False
    except urllib.error.HTTPError as e:
        if e.code == 429:
            log("429 %s -> retry in 12s" % url)
            time.sleep(12)
            try:
                req = urllib.request.Request(url, headers={
                    "User-Agent": UA,
                    "Accept": "application/rss+xml, text/xml, */*",
                })
                with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                    return resp.read().decode("utf-8", "replace"), False
            except Exception as e2:
                return None, True  # rate_limited=True
        return None, False
    except Exception as e:
        log("FETCH FAIL %s : %r" % (url, e))
        return None, False


def strip_html(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def parse_date(s):
    try:
        return email.utils.parsedate_to_datetime(s)
    except Exception:
        return None


def score_article(item, topic):
    """话题关键词：标题 +8/词、摘要 +3/词；品牌提及 +10；whynotdesign +15；spam 模式扣分"""
    title_l = (item["title"] or "").lower()
    snip_l = (item["snippet"] or "").lower()
    score = 0
    for kw in topic["keywords"]:
        if kw in title_l:
            score += 8
        elif kw in snip_l:
            score += 3
    for b in BRAND_MENTIONS:
        if b in title_l or b in snip_l:
            score += 10
    for w in WHYNOT_KEYWORDS:
        if w in title_l or w in snip_l:
            score += 15
    for s in SPAM_PATTERNS:
        if s in title_l:
            score -= 12
        elif s in snip_l:
            score -= 6
    if topic["key"] == "ipl":
        # 硬性否决：标题或摘要含板球词 → 绝不归入 IPL（光疗）话题
        if any(c in title_l or c in snip_l for c in IPL_CRICKET_WORDS):
            return -999
        for c in IPL_CRICKET_WORDS:
            if c in title_l:
                score -= 30
            elif c in snip_l:
                score -= 10
    return score


def classify(articles):
    """每篇文章归入最高优先级话题；在已有基础分（新鲜度）上累加话题分"""
    result = []
    for a in articles:
        best = None
        for t in TOPICS:
            s = score_article(a, t)
            if s > 0 and (best is None or s > best[1]):
                best = (t, s)
        if best is None:
            # 兜底：归入 brand，给基础分 2（话题广度）
            best = (TOPICS[3], 2)
        a["score"] += best[1]  # 累加而非覆盖：保留新鲜度惩罚
        a["topic_key"] = best[0]["key"]
        result.append(a)
    return result


def quota_fill(by_topic, limit):
    """配额分配：P1 最多 4、P2 最多 2、P3 最多 2、P4（品牌 CEO/研发）2 席；某类不足时溢出给下一类。
    分数低于 SCORE_FLOOR 的文章视为噪声，不入选。"""
    SCORE_FLOOR = -100
    caps = {"ipl": 4, "hair": 2, "skincare": 2, "brand": 2}
    picked = []
    for t in TOPICS:
        pool = [a for a in by_topic.get(t["key"], []) if a["score"] > SCORE_FLOOR]
        pool.sort(key=lambda a: -a["score"])
        n = min(caps[t["key"]], len(pool), limit - len(picked))
        picked.extend(pool[:n])
        if len(picked) >= limit:
            break
    return picked[:limit]


# ---------------------------------------------------------------- 采集
def collect_articles():
    seen = {}
    items = []
    consecutive_429 = 0
    for t in TOPICS:
        for tag in t["tags"]:
            url = "https://medium.com/feed/tag/%s" % tag
            body, rate_limited = fetch(url)
            if rate_limited:
                consecutive_429 += 1
                if consecutive_429 >= 6:
                    log("rate limited repeatedly, abort remaining tag fetches")
                    return items
                continue
            consecutive_429 = 0
            if not body:
                continue
            try:
                root = ET.fromstring(body)
            except ET.ParseError as e:
                log("PARSE FAIL %s : %r" % (tag, e))
                continue
            for item in root.iter("item"):
                def field(tag_name):
                    el = item.find(tag_name)
                    return el.text if el is not None and el.text else ""
                guid = (item.findtext("guid") or "").strip()
                if not guid:
                    continue
                if guid in seen:
                    continue
                seen[guid] = True
                title = strip_html(field("title"))
                link = (field("link") or "").strip().split("?")[0]
                desc = strip_html(field("description"))
                # 提取 snippet：优先 medium-feed-snippet，否则取 desc 首 220 字符
                m = re.search(r"medium-feed-snippet[^>]*>(.*?)</p>", field("description"), re.S)
                snippet = strip_html(m.group(1)) if m else desc[:220]
                pub = parse_date(field("pubDate"))
                if pub is not None:
                    pub = pub.replace(tzinfo=None)  # 统一 naive，避免与 datetime.now() 相减报错
                items.append({
                    "guid": guid,
                    "title": title,
                    "url": link,
                    "snippet": snippet[:260],
                    "published": pub.strftime("%Y-%m-%d") if pub else "",
                    "age_days": (datetime.now() - pub).days if pub else 999,
                })
    log("collected %d unique articles" % len(items))
    return items


def freshness_bonus(a):
    """新鲜度权重：越新越高；>180 天直接淘汰（返回极低分）"""
    if a["age_days"] <= 7:
        return 6
    if a["age_days"] <= 14:
        return 3
    if a["age_days"] <= 30:
        return 0
    if a["age_days"] <= 60:
        return -10
    if a["age_days"] <= 180:
        return -25
    return -999


# ---------------------------------------------------------------- 日报
def build_report(picked, date_str):
    lines = []
    lines.append("# Medium 精选日报 — %s" % date_str)
    lines.append("")
    lines.append("> 来源: Medium tag RSS ｜ 阅读: readmedium.com 免费镜像 ｜ 由 Harness 自主完成")
    lines.append("> 话题优先级: IPL 脱毛 > 脱毛 > 皮肤护理 > 品牌方 CEO/研发关注")
    lines.append("")
    n = 0
    for t in TOPICS:
        group = [a for a in picked if a["topic_key"] == t["key"]]
        if not group:
            continue
        n += 1
        lines.append("## %d. %s（%d 篇）" % (n, t["label"], len(group)))
        lines.append("")
        for i, a in enumerate(group, 1):
            rm = "https://readmedium.com/%s" % a["url"]
            lines.append("%d. **%s**" % (i, a["title"]))
            lines.append("   - 摘要: %s" % (a["snippet"] or "—"))
            lines.append("   - 发布: %s ｜ Medium: %s" % (a["published"] or "未知", a["url"]))
            lines.append("   - 免费阅读(readmedium): %s" % rm)
            lines.append("")
    return "\n".join(lines)


def build_chat_text(picked, date_str):
    """微信/QQ 推送正文：每篇一行（序号+分类+标题+readmedium 短链）"""
    tag_of = {"ipl": "IPL", "hair": "脱毛", "skincare": "护肤", "brand": "品牌"}
    lines = ["【Medium 每日精选】%s · %d 篇" % (date_str, len(picked))]
    lines.append("（IPL脱毛>脱毛>护肤>品牌CEO/研发，免费阅读=readmedium镜像）")
    lines.append("")
    for i, a in enumerate(picked, 1):
        t = tag_of.get(a["topic_key"], "?")
        lines.append("%d.[%s] %s" % (i, t, a["title"]))
        lines.append("   https://readmedium.com/%s" % a["url"])
    lines.append("")
    lines.append("全文报告: .wx-bridge\\plans\\medium-daily\\medium-daily-%s.md" % date_str)
    return "\n".join(lines)


# ---------------------------------------------------------------- 状态
def load_state():
    if os.path.exists(STATE):
        try:
            with open(STATE, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"seen": {}, "last_run_date": None}


def save_state(state):
    # write_dir 自己保证父目录存在，不依赖调用顺序（原实现靠 OUT_DIR 的 makedirs 先跑过）
    with open(write_dir(STATE), "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def prune_seen(state):
    cutoff = (datetime.now() - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%d")
    state["seen"] = {g: d for g, d in state["seen"].items() if d >= cutoff}


def filter_unseen(articles, state):
    fresh = []
    for a in articles:
        if a["guid"] not in state["seen"]:
            fresh.append(a)
    return fresh


# ---------------------------------------------------------------- 推送
def push_spool(text, spool_dir, name):
    if dry_run_enabled():
        # 投递到微信/QQ spool 会真的把消息发出去，干跑必须跳过
        stage_note("push_spool", "本应投递到 %s（已跳过）" % spool_dir)
        return False
    os.makedirs(spool_dir, exist_ok=True)
    path = os.path.join(spool_dir, "%s-%s.json" % (name, TODAY))
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"text": text}, f, ensure_ascii=False)
    log("outbox -> %s" % path)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    ap.add_argument("--dry-run", action="store_true", help="只生成日报不推送")
    ap.add_argument("--force", action="store_true", help="当日已运行也强制重跑")
    ap.add_argument("--now", default=TODAY, help="报告日期（默认今天）")
    args = ap.parse_args()

    os.makedirs(os.path.dirname(write_path(os.path.join(OUT_DIR, "_"))), exist_ok=True)
    state = load_state()

    if state.get("last_run_date") == args.now and not args.force:
        log("already ran today (%s); use --force to rerun" % args.now)
        return

    articles = collect_articles()
    articles = [a for a in articles if a["age_days"] <= 180]  # 硬性过滤：>180 天直接剔除
    articles = filter_unseen(articles, state)
    log("after dedup+age filter: %d articles" % len(articles))

    for a in articles:
        a["score"] = freshness_bonus(a)  # 先给基础分（含新鲜度），classify 在其上累加话题分
    classified = classify(articles)
    by_topic = {}
    for a in classified:
        by_topic.setdefault(a["topic_key"], []).append(a)

    picked = quota_fill(by_topic, args.limit)
    # 兜底：配额不满时按总分补齐（含已被分类到各话题的，同样受分数下限约束）
    if len(picked) < args.limit:
        rest = sorted((a for a in classified if a not in picked and a["score"] > -100),
                      key=lambda a: -a["score"])
        picked.extend(rest[: args.limit - len(picked)])

    if not picked:
        log("no articles selected")
        return

    report = build_report(picked, args.now)
    report_path = os.path.join(OUT_DIR, "medium-daily-%s.md" % args.now)
    with open(write_path(report_path), "w", encoding="utf-8") as f:
        f.write(report)
    log("report -> %s" % report_path)

    if not args.dry_run:
        text = build_chat_text(picked, args.now)
        push_spool(text, WX_SPOOL, "medium-daily")
        push_spool(text, QQ_SPOOL, "medium-daily")
    else:
        log("--dry-run: push skipped")

    # 状态：记录已见文章与运行日期
    for a in picked:
        state["seen"][a["guid"]] = args.now
    state["last_run_date"] = args.now
    prune_seen(state)
    save_state(state)

    log("done: %d articles, %s" % (len(picked), "pushed" if not args.dry_run else "dry-run"))


if __name__ == "__main__":
    sys.exit(main())
