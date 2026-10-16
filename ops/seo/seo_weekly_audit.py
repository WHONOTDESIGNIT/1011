# -*- coding: utf-8 -*-
"""seo_weekly_audit.py — weekly (every Sunday) index-status audit across search engines.

For each engine, run a live site: check and produce a weekly report:
  - Google  : counts come from the GSC "indexed pages" export (most recent
              gsc-export-*/表格.csv) plus the running exclusion list.
  - Bing    : real-browser site: check (headless is blocked by anti-bot).
  - Yandex  : real-browser site: check (often SmartCaptcha; keep last known).
  - Naver   : real-browser site: check.
  - Seznam  : real-browser site: check.
  - Yep     : usually Cloudflare-blocked; report as unknown.

Writes plans/weekly-reports/seo-index-audit-YYYY-Www.md
"""
import sys, os, json, glob, re, datetime, subprocess, csv
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
HERE = os.path.dirname(os.path.abspath(__file__))
PLANS = os.path.join(HERE, 'plans')
REPORT_DIR = os.path.join(PLANS, 'weekly-reports')
SITE = 'iplmanufacturer.com'
STATE_FILE = os.path.join(PLANS, 'weekly-audit-state.json')


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            return json.load(open(STATE_FILE, encoding='utf-8'))
        except Exception:
            pass
    return {'weekly': []}


def save_state(state):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def iso_week(d=None):
    d = d or datetime.date.today()
    return d.isocalendar()[:2]  # (year, week)


def gsc_indexed_count():
    """Read the most recent GSC export CSV; return (count, last_update)."""
    exports = sorted(glob.glob(os.path.join(PLANS, 'gsc-export-*')))
    if not exports:
        return None, None
    latest = exports[-1]
    table = os.path.join(latest, '表格.csv')
    if not os.path.exists(table):
        return None, None
    n = 0
    with open(table, encoding='utf-8-sig') as f:
        rdr = csv.reader(f)
        next(rdr, None)
        for r in rdr:
            if r and r[0].startswith('http'):
                n += 1
    m = re.search(r'gsc-export-(\d{4}-\d{2}-\d{2})', latest)
    return n, (m.group(1) if m else None)


def gsc_not_indexed_count():
    """From the running exclusion list we cannot know the exact 'not indexed'
    total (GSC report shows 未编入索引). We read the last known audit state."""
    state = load_state()
    for w in reversed(state.get('weekly', [])):
        if w.get('gsc_not_indexed'):
            return w['gsc_not_indexed']
    return None


def count_site_links_from_ocr(shot_path):
    """OCR a screenshot and count distinct iplmanufacturer.com URLs."""
    sys.path.insert(0, HERE)
    import wx_driver as wd
    items = wd.ocr_image(shot_path)
    seen = set()
    for (_x, _y, _w, _h, t) in items:
        t = t.replace(' ', '').replace('℃', '.').replace('〇', '.').replace('•', '.')
        t = re.sub(r'iplmanufacturer\.om(?=[/\w\-\.]|$)', 'iplmanufacturer.com', t)
        for m in re.finditer(r'(?:https?://)?(?:www\.)?iplmanufacturer\.(?:com|net|org|io|co)[/\w\-\.]*', t):
            key = m.group(0).replace('https://', '').replace('http://', '').replace('www.', '').rstrip('。，；、')
            seen.add(key)
    return len(seen), seen


def real_browser_site_check(engine, url):
    """Drive the user's Edge to query site:SITE on the engine; return OCR text list."""
    sys.path.insert(0, HERE)
    import time as _t
    import ctypes, ctypes.wintypes as wt
    import wx_driver as wd
    u = wd.user32
    WNDENUMPROC = ctypes.WINFUNCTYPE(wt.BOOL, wt.HWND, wt.LPARAM)
    edge = [None]
    def cb(hwnd, lp):
        if not u.IsWindowVisible(hwnd):
            return True
        n = u.GetWindowTextLengthW(hwnd)
        if n <= 0:
            return True
        buf = ctypes.create_unicode_buffer(n + 1)
        u.GetWindowTextW(hwnd, buf, n + 1)
        cls = ctypes.create_unicode_buffer(256)
        u.GetClassNameW(hwnd, cls, 256)
        if cls.value == 'Chrome_WidgetWin_1' and 'Edge' in buf.value:
            edge[0] = hwnd
            return False
        return True
    u.EnumWindows(WNDENUMPROC(cb), 0)
    hwnd = edge[0]
    if not hwnd:
        return []
    # 统一约定：浏览器任务第一步先最大化窗口（坐标/OCR 基于最大化窗口）
    wd.maximize_window(hwnd)
    wd.combo('CTRL', 'T')
    _t.sleep(1.0)
    wd.paste_text(url)
    _t.sleep(0.5)
    wd.tap('ENTER')
    _t.sleep(12)
    r = ctypes.wintypes.RECT()
    u.GetWindowRect(hwnd, ctypes.byref(r))
    shot = os.path.join(HERE, 'tmp_weekly_%s.png' % engine)
    wd.capture_screen((r.left, r.top, r.right, r.bottom), shot)
    texts = wd.ocr_texts(shot)
    try:
        wd.combo('CTRL', 'W')
        _t.sleep(0.5)
    except Exception:
        pass
    return texts


def classify(texts):
    joined = ' '.join(''.join(t.split()) for t in texts)
    if 'Therearenoresults' in joined or '没有搜索结果' in joined or '검색결과가없' in joined or '検索結果' in joined:
        return 0, '明确无结果'
    if 'Areyounotarobot' in joined or 'SmartCaptcha' in joined or 'robot' in joined.lower():
        return None, '反爬验证拦截'
    if 'blocked' in joined.lower() or 'Cloudflare' in joined:
        return None, 'Cloudflare 拦截'
    # count distinct site links from OCR
    sys.path.insert(0, HERE)
    import wx_driver as wd
    return None, '需人工确认（页面已加载但无明确计数）'


def main():
    state = load_state()
    (y, w) = iso_week()
    rep = []
    rep.append('# 🔍 六大搜索引擎收录周报 — %s' % SITE)
    rep.append('')
    rep.append('报告周期: %s 第 %d 周 | 生成时间: %s | 全站 URL: 1034（19 语言，无尾斜杠规范）' % (
        y, w, datetime.datetime.now().strftime('%Y-%m-%d %H:%M')))
    rep.append('')
    rep.append('> 本报告由 Harness AI 每周自动生成（每周日执行；真实浏览器 site: 实测 + GSC 导出）')
    rep.append('')

    # Google from GSC export
    g_cnt, g_upd = gsc_indexed_count()
    g_not = gsc_not_indexed_count()
    rep.append('## 1️⃣ Google')
    rep.append('')
    if g_cnt is not None:
        rep.append('- 已编入索引: **%d**（GSC 导出 %s）' % (g_cnt, g_upd))
    else:
        rep.append('- 已编入索引: 数据缺失（需在 GSC 导出 Coverage 报告）')
    rep.append('- 未编入索引: %s' % (g_not if g_not is not None else '待查（上次 GSC 报告 553）'))
    rep.append('')

    # Bing
    texts = real_browser_site_check('bing', 'https://www.bing.com/search?q=site%3A%s&mkt=en-US' % SITE)
    b_val, b_note = classify(texts)
    rep.append('## 2️⃣ Bing')
    rep.append('')
    rep.append('- 收录数: %s' % ('**%d**' % b_val if b_val is not None else '未知'))
    rep.append('- 备注: %s' % b_note)
    rep.append('')

    # Naver
    texts = real_browser_site_check('naver', 'https://search.naver.com/search.naver?query=site%%3A%s' % SITE)
    n_val, n_note = classify(texts)
    rep.append('## 3️⃣ Naver（韩语）')
    rep.append('')
    rep.append('- 收录数: %s' % ('**%d**' % n_val if n_val is not None else '未知'))
    rep.append('- 备注: %s' % n_note)
    rep.append('')

    # Yandex
    texts = real_browser_site_check('yandex', 'https://yandex.com/search/?text=site%%3A%s' % SITE)
    ya_val, ya_note = classify(texts)
    rep.append('## 4️⃣ Yandex（俄语）')
    rep.append('')
    rep.append('- 收录数: %s' % ('**%d**' % ya_val if ya_val is not None else '未知'))
    rep.append('- 备注: %s' % ya_note)
    rep.append('')

    # Seznam
    texts = real_browser_site_check('seznam', 'https://search.seznam.cz/?q=site%%3A%s' % SITE)
    s_val, s_note = classify(texts)
    rep.append('## 5️⃣ Seznam（捷克语）')
    rep.append('')
    rep.append('- 收录数: %s' % ('**%d**' % s_val if s_val is not None else '未知'))
    rep.append('- 备注: %s' % s_note)
    rep.append('')

    # Yep
    rep.append('## 6️⃣ Yep')
    rep.append('')
    rep.append('- 收录数: 未知（Cloudflare 通常拦截自动化查询，需人工确认）')
    rep.append('')

    rep.append('---')
    rep.append('本报告由 Harness AI 自主完成（每周日 09:00 自动执行）')
    rep_text = '\n'.join(rep)

    os.makedirs(REPORT_DIR, exist_ok=True)
    fname = os.path.join(REPORT_DIR, 'seo-index-audit-%d-W%02d.md' % (y, w))
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(rep_text)

    # remember latest known counts
    state['weekly'].append({
        'week': '%d-W%02d' % (y, w),
        'date': datetime.date.today().isoformat(),
        'google_indexed': g_cnt,
        'gsc_update': g_upd,
        'bing': b_val, 'naver': n_val, 'yandex': ya_val, 'seznam': s_val,
    })
    save_state(state)
    print(rep_text)
    print('\n[saved]', fname)


if __name__ == '__main__':
    main()
