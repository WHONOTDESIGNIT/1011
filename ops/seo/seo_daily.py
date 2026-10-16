# -*- coding: utf-8 -*-
"""seo_daily.py — daily SEO submission job (runs 23:59 via Task Scheduler).

- Loads the full site URL list.
- Google: rotate 10 URLs/day for GSC URL Inspection (queue file) + daily sitemap.xml submit.
- Bing: IndexNow FULL-SITE push every day (Bing Webmaster quota: 10,000 URLs/day;
  single IndexNow request cap: 10,000 → auto-chunked).
- Yandex: 10 URLs/day from the EN+RU pools via IndexNow.
- Writes a daily report markdown and appends to the report index.
"""
import sys, os, json, datetime, time, hashlib, urllib.request, urllib.parse, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── 统一配置 / 干跑层（模式见同目录 preflight.py；本目录其余脚本照抄此段）──────
from preflight import (require_env, optional_env, preflight, dry_run_enabled,
                       write_path, stage_note)

HERE = os.path.dirname(os.path.abspath(__file__))

# 路径：不写死本机绝对路径。REPO_ROOT 指向站点仓库（含 site-urls.txt、astro/）。
# 本脚本当前的输入都来自相对 __file__ 的 PLANS/，REPO_ROOT 尚未被读到——
# 它是为 _bing_verify.py 那类需要直接读仓库 site-urls.txt 的批处理工具预留的，
# 故现在就设为必需：那批工具即将迁入，提前设好省得再改一次。
# 失败模式是响亮的 exit 2 + 变量名与用途说明，不是静默错误，故"必需但暂未使用"是安全的。
REPO_ROOT = require_env('DSH_REPO_ROOT', '站点仓库根目录（含 site-urls.txt、astro/）—— 当前为预留，见上方注释')
WORKSPACE = optional_env('DSH_WORKSPACE', os.path.dirname(HERE))

PLANS = os.path.join(HERE, 'plans')          # 输入数据：相对本脚本，随目录迁移
URLS_FILE = os.path.join(PLANS, 'site-urls.txt')
STATE_FILE = os.path.join(PLANS, 'seo-state.json')
REPORT_DIR = os.path.join(PLANS, 'daily-reports')
SITE = 'https://iplmanufacturer.com'

# config (IndexNow key generated 2026-08-17; key file deployed to site root)
_KEY_FILE = os.path.join(HERE, 'indexnow_key.txt')
def _load_key():
    try:
        return open(_KEY_FILE, encoding='ascii').read().strip()
    except Exception:
        return ''
INDEXNOW_KEY = os.environ.get('INDEXNOW_KEY', '') or _load_key()
INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

GOOGLE_PER_DAY = 10
YANDEX_PER_DAY = 10
NAVER_PER_DAY = 50      # Naver Search Advisor documented daily limit
SEZNAM_PER_DAY = 10     # conservative; Seznam webmaster limit not public (IndexNow no hard cap)
BING_PER_DAY = 10000    # Bing Webmaster quota: 10,000 URLs/day → 站内全部 URL 每日全量推送
INDEXNOW_MAX_PER_REQUEST = 10000  # IndexNow 单次请求上限（超出则分片提交）

def calibrate_urls(verbose=True):
    """校准步骤：提交前把 site-urls.txt 与线上 sitemap.xml 对齐。

    - 拉取线上 sitemap（权威部署状态，含全部语言与新增页面）。
    - 与本地 site-urls.txt 对比：
      * 本地缺失的线上 URL → 补入；
      * 本地存在但线上已删除/重定向的 URL → 移除（防止提交死链）；
      * 尾斜杠统一去除、去重、按优先级重排。
    - 有变化时自动重写 site-urls.txt 与 site-urls.md，并返回变化统计。

    Returns dict(added, removed, total) 供报告使用。
    """
    import ssl, urllib.request, re as _re
    from collections import Counter as _C
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    def _fetch(url):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=40, context=ctx) as r:
            return r.read().decode('utf-8', errors='replace')

    # ⚠ 线上 sitemap.xml 是**索引**（sitemapindex），其 <loc> 只是 22 个子 sitemap 的地址。
    # 旧实现直接把这 22 条当成全站清单写回 site-urls.txt，导致清单被静默截断成 22 条、
    # 每日提交的其实是 sitemap 文件而非页面。必须跟进子 sitemap 才能拿到真实页面 URL。
    try:
        data = _fetch(SITE + '/sitemap.xml')
    except Exception as e:
        print('  [calibrate] ⚠ 线上 sitemap 索引抓取失败（%r），跳过校准，沿用本地清单' % (e,))
        return {'added': 0, 'removed': 0, 'total': len(load_urls()), 'skipped': True,
                'lastmod': {'total': 0, 'with_lm': 0, 'newest': '', 'oldest': ''}}

    index_locs = [u.rstrip('/') for u in _re.findall(r'<loc>(.*?)</loc>', data)]
    is_index = '<sitemapindex' in data
    # lastmod 覆盖统计：Bing 官方口径里 lastmod 是其唯一认可的时效信号
    # （changefreq / priority 被忽略），故纳入日报以监视信号是否退化。
    lm = {'total': 0, 'with_lm': 0, 'newest': '', 'oldest': ''}
    if is_index:
        live_set = set()
        failed = []
        for child in index_locs:
            # 只跟同站子 sitemap，避免把外站 URL 收进清单
            if not child.startswith(SITE):
                continue
            try:
                cdata = _fetch(child)
            except Exception as e:
                failed.append((child, e))
                continue
            for u in _re.findall(r'<loc>(.*?)</loc>', cdata):
                live_set.add(u.rstrip('/'))
            # 逐 <url> 块检查 lastmod，累计覆盖
            for block in _re.findall(r'<url>(.*?)</url>', cdata, _re.S):
                lm['total'] += 1
                m = _re.search(r'<lastmod>(.*?)</lastmod>', block)
                if m:
                    lm['with_lm'] += 1
                    v = m.group(1).strip()
                    if not lm['newest'] or v > lm['newest']:
                        lm['newest'] = v
                    if not lm['oldest'] or v < lm['oldest']:
                        lm['oldest'] = v
        if failed:
            # 任一子 sitemap 抓取失败 → 清单不完整，宁可不校准也不写回残缺清单
            print('  [calibrate] ⚠ %d 个子 sitemap 抓取失败，跳过校准以免写回残缺清单' % len(failed))
            for c, e in failed[:3]:
                print('      %s : %r' % (c, e))
            return {'added': 0, 'removed': 0, 'total': len(load_urls()), 'skipped': True,
                'lastmod': {'total': 0, 'with_lm': 0, 'newest': '', 'oldest': ''}}
        # 兜底：跟完之后若条数明显不合理（少于子 sitemap 数），也判定为异常
        if len(live_set) <= len(index_locs):
            print('  [calibrate] ⚠ 子 sitemap 跟进后仅得 %d 条（疑异常），跳过校准' % len(live_set))
            return {'added': 0, 'removed': 0, 'total': len(load_urls()), 'skipped': True,
                'lastmod': {'total': 0, 'with_lm': 0, 'newest': '', 'oldest': ''}}
    else:
        live_set = set(index_locs)

    live = sorted(live_set)
    local = set()
    if os.path.exists(URLS_FILE):
        for line in open(URLS_FILE, encoding='utf-8'):
            s = line.strip().rstrip('/')
            if s.startswith('http'):
                local.add(s)

    added = sorted(live_set - local)
    removed = sorted(local - live_set)
    changed = added or removed

    # 守卫：清单突然大幅缩水几乎一定是抓取/解析出问题，不允许静默写回
    if changed and len(live) < 100:
        print('  [calibrate] ⚠ 解析出的清单仅 %d 条（<100），拒绝写回以防截断，沿用本地清单' % len(live))
        return {'added': 0, 'removed': 0, 'total': len(load_urls()), 'skipped': True,
                'lastmod': {'total': 0, 'with_lm': 0, 'newest': '', 'oldest': ''}}

    if changed:
        # 重排：优先级排序后写回
        urls = sorted(live, key=lambda u: _prio_key(u))
        with open(write_path(URLS_FILE), 'w', encoding='utf-8') as f:
            f.write('\n'.join(urls) + '\n')
        # 同步更新 site-urls.md
        _write_urls_md(urls)
        if verbose:
            print('  [calibrate] site-urls.txt 已校准：新增 %d 条，移除 %d 条（当前共 %d 条）'
                  % (len(added), len(removed), len(urls)))
            for u in added[:10]:
                print('    +', u)
            if len(added) > 10:
                print('    ... 等共 %d 条新增' % len(added))
            for u in removed[:10]:
                print('    -', u)
            if len(removed) > 10:
                print('    ... 等共 %d 条移除' % len(removed))
    else:
        if verbose:
            print('  [calibrate] site-urls.txt 与线上 sitemap 一致（%d 条），无需校准' % len(live))
    return {'added': len(added), 'removed': len(removed), 'total': len(live), 'skipped': False, 'lastmod': lm}


def _prio_key(u):
    """URL 排序键：首页 < 英文核心栏目 < 其他英文 < 本地化页面。"""
    path = u.replace(SITE, '').strip('/')
    seg = path.split('/') if path else []
    first = seg[0] if seg else ''
    if not path:
        return 0
    if first in ('products', 'services', 'components', 'blog', 'about',
                 'clients', 'faq', 'catalogue', 'contact', 'meet-the-team'):
        return 1
    lang_set = ('tr','ro','ar','es','fr','ru','he','fa','el','pt-BR','pt-PT','nl','id','th','pl','ja','ko','cs','vi','de','it')
    if first in lang_set:
        return 3
    return 2


def _write_urls_md(urls):
    """Write grouped site-urls.md view (mirrors gen_site_urls_v3.py output)."""
    try:
        from collections import Counter as _C
        langs = ('tr','ro','ar','es','fr','ru','he','fa','el','pt-BR','pt-PT','nl','id','th','pl','ja','ko','cs','vi','de','it')
        def lang_of(u):
            p = u.replace(SITE, '').strip('/')
            seg = p.split('/')[0] if p else ''
            return seg if seg in langs else 'en'
        by = {}
        for u in urls:
            by.setdefault(lang_of(u), []).append(u)
        md_path = os.path.join(PLANS, 'site-urls.md')
        with open(write_path(md_path), 'w', encoding='utf-8') as f:
            f.write('# iplmanufacturer.com 全站 URL 清单（%d 语言，无尾斜杠）\n\n' % len(by))
            f.write('生成: 校准自动更新 | 总 URL: %d | 来源: 线上 sitemap.xml\n\n' % len(urls))
            for lang in ['en'] + [l for l in sorted(by) if l != 'en']:
                f.write('\n## %s (%d)\n\n' % (lang, len(by[lang])))
                for u in by[lang]:
                    f.write('- %s\n' % u)
    except Exception:
        pass


def load_urls():
    if not os.path.exists(URLS_FILE):
        return []
    urls = [l.strip().rstrip('/') for l in open(URLS_FILE, encoding='utf-8') if l.strip().startswith('http')]
    return sorted(urls, key=_prio_key)

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            return json.load(open(STATE_FILE, encoding='utf-8'))
        except Exception:
            pass
    return {'google_submitted': {}, 'bing_submitted': {}, 'yandex_submitted': {},
            'naver_submitted': {}, 'seznam_submitted': {}, 'last_run': ''}

def save_state(state):
    # 干跑下重定向到 .dry-run/，真实状态文件零改动（见 ops/preflight.py 的模式说明）
    with open(write_path(STATE_FILE), 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    stage_note('save_state', '写了 %d 个引擎的提交记录' % len(state))

def en_ru_pool(urls):
    en, ru = [], []
    for u in urls:
        path = u.replace(SITE, '').strip('/')
        first = path.split('/')[0] if path else ''
        if first == 'ru':
            ru.append(u)
        elif first != 'en' and first not in ('tr','ro','ar','es','fr','he','fa','el','pt-BR','pt-PT','nl','id','th','pl','ja','ko','cs','vi','de','it'):
            en.append(u)  # no language prefix = en
    return en, ru

def _norm(u):
    """Normalize URL for index-status comparison (strip trailing slash, scheme)."""
    return u.rstrip('/').replace('https://', '').replace('http://', '')

def load_known_indexed(path):
    """Load a list of already-indexed URLs (from exports / site: results)."""
    out = set()
    if os.path.exists(path):
        for line in open(path, encoding='utf-8'):
            s = line.strip()
            if s.startswith('http'):
                out.add(_norm(s))
    return out

def update_known_indexed_from_results(results, path):
    """Append URLs confirmed indexed (skipped as already indexed) to the
    exclusion list so they are never re-submitted."""
    new_entries = []
    for (u, ok, note) in results:
        if '已收录' in note or 'Indexed' in note:
            new_entries.append(u)
    if new_entries:
        existing = set()
        if os.path.exists(path):
            for line in open(path, encoding='utf-8'):
                s = line.strip()
                if s.startswith('http'):
                    existing.add(_norm(s))
        added = [u for u in new_entries if _norm(u) not in existing]
        if added:
            with open(path, 'a', encoding='utf-8') as f:
                for u in added:
                    f.write(u + '\n')
            print('  [gsc] 追加 %d 个已收录 URL 到排除清单' % len(added))

def rotate_pick(pool, already, n, exclude=None):
    """Pick n URLs to submit TODAY.

    - exclude: known-INDEXED URLs (never re-submit these).
    - Priority 1: URLs never submitted before (fresh).
    - Priority 2 (only if pool exhausted): rotate re-submission among
      previously submitted-but-not-indexed URLs (refresh).
    """
    exclude = exclude or set()
    out = []
    for u in pool:
        if len(out) >= n:
            break
        if _norm(u) in exclude:
            continue
        if u not in already:
            out.append(u)
    if len(out) < n:
        for u in pool:
            if len(out) >= n:
                break
            if _norm(u) in exclude:
                continue
            if u not in out:
                out.append(u)
    return out

GSC_INSPECT_URL = 'https://search.google.com/search-console/inspect?resource_id=https://iplmanufacturer.com/'
GSC_WAIT_AFTER_SUBMIT = 30   # seconds: wait for the verification result before next URL
GSC_SITEMAP_URL = 'https://search.google.com/search-console/sitemaps?resource_id=https://iplmanufacturer.com/'
GSC_SITEMAP = 'sitemap.xml'


def gsc_sitemap_submit():
    """每日一次：在 GSC「站点地图」页提交 sitemap.xml（浏览器驱动）。

    UIA（无障碍树 = DOM 级）后台驱动优先：不依赖屏幕坐标/OCR/窗口焦点；
    UIA 环境不可用时回退 OCR+坐标流程。返回 (ok, note)。"""
    if dry_run_enabled():
        # 干跑不启动浏览器：UIA/OCR 都会真实操作桌面，属于副作用
        stage_note('gsc_sitemap_submit', '本应驱动浏览器提交 sitemap.xml（已跳过）')
        return True, 'DRY-RUN 已跳过（未驱动浏览器）'
    try:
        r = _gsc_sitemap_submit_uia()
        if r is not None:
            return r
    except Exception as e:
        print('  [gsc] UIA 异常，回退 OCR 流程: %r' % (e,))
    return _gsc_sitemap_submit_ocr()


def _uia_bootstrap():
    """加载 wxautox.uia（含 pywin32 路径与 DLL 目录）。失败返回 None。"""
    try:
        _site = os.path.join(HERE, 'site311')
        for _sub in ('', 'win32', os.path.join('win32', 'lib'), 'pythonwin', 'pywin32_system32'):
            _p = os.path.join(_site, _sub) if _sub else _site
            if os.path.isdir(_p) and _p not in sys.path:
                sys.path.insert(0, _p)
        _sys32 = os.path.join(_site, 'pywin32_system32')
        if os.path.isdir(_sys32):
            os.environ['PATH'] = _sys32 + os.pathsep + os.environ.get('PATH', '')
            if hasattr(os, 'add_dll_directory'):
                os.add_dll_directory(_sys32)
        import wxautox.uia.uiautomation as _auto
        return _auto
    except Exception:
        return None


def _uia_send_type_text(text, interval=0.03):
    """内联 SendInput Unicode 逐字符输入（避免导入 wx_driver 引发 COM 公寓冲突）。"""
    import ctypes as _c
    from ctypes import wintypes as _wt
    _u = _c.windll.user32
    class _KB(_c.Structure):
        _fields_ = [('wVk', _wt.WORD), ('wScan', _wt.WORD), ('dwFlags', _wt.DWORD),
                    ('time', _wt.DWORD), ('dwExtraInfo', _c.c_void_p)]
    class _UN(_c.Union):
        _fields_ = [('mi', _c.c_byte * 28), ('ki', _KB), ('hi', _c.c_byte * 24)]
    class _IN(_c.Structure):
        _fields_ = [('type', _wt.DWORD), ('u', _UN)]
    for ch in text:
        for _up in (0, 0x0002):
            _i = _IN()
            _i.type = 1
            _i.u.ki.wScan = ord(ch)
            _i.u.ki.dwFlags = 0x0004 | _up
            _u.SendInput(1, _c.byref(_i), _c.sizeof(_IN))
        time.sleep(interval)


def _uia_send_vk(vk, up=False):
    """SendInput 发送虚拟键（不依赖 wx_driver，避免 COM 公寓冲突）。"""
    import ctypes as _c
    from ctypes import wintypes as _wt
    _u = _c.windll.user32
    class _KB(_c.Structure):
        _fields_ = [('wVk', _wt.WORD), ('wScan', _wt.WORD), ('dwFlags', _wt.DWORD),
                    ('time', _wt.DWORD), ('dwExtraInfo', _c.c_void_p)]
    class _UN(_c.Union):
        _fields_ = [('mi', _c.c_byte * 28), ('ki', _KB), ('hi', _c.c_byte * 24)]
    class _IN(_c.Structure):
        _fields_ = [('type', _wt.DWORD), ('u', _UN)]
    _i = _IN()
    _i.type = 1
    _i.u.ki.wVk = vk
    _i.u.ki.dwFlags = 0x0002 if up else 0
    _u.SendInput(1, _c.byref(_i), _c.sizeof(_IN))


def _uia_key_combo(vks, delay=0.06):
    """按顺序按下再松开一组虚拟键（如 [0x11, 0x52] = Ctrl+R）。"""
    for v in vks:
        _uia_send_vk(v)
        time.sleep(delay)
    for v in reversed(vks):
        _uia_send_vk(v, up=True)
        time.sleep(delay)


def _gsc_sitemap_submit_uia():
    """UIA 后台驱动提交 sitemap.xml。

    成功返回 (True, note)；失败返回 (False, note)；UIA 环境不可用返回 (None, '...')，
    供上层回退 OCR 流程。"""
    import time as _t
    import ctypes as _c
    from ctypes import wintypes as _wt
    auto = _uia_bootstrap()
    if auto is None:
        return None, 'UIA 库加载失败'
    u = _c.windll.user32
    hwnd = _find_edge_hwnd()
    if not hwnd:
        return False, 'Edge 窗口未找到'
    # 统一约定：激活并最大化（纯 ctypes，避免 import wx_driver 污染 UIA 的 COM 公寓）
    u.ShowWindow(hwnd, 3)  # SW_MAXIMIZE
    u.SetForegroundWindow(hwnd)
    _t.sleep(1.2)
    root = auto.GetRootControl()
    d = datetime.date.today()
    today_cn = '%d 年 %d 月 %d 日' % (d.year, d.month, d.day)

    def _find_input():
        return root.EditControl(Name='输入站点地图网址', searchDepth=0xFFFFFFFF)

    # 1) 找输入框：占位符匹配 → 激活「站点地图」标签页 → 刷新页面（重置 Chromium
    #    可访问性树：提交成功后 UIA 树会碎片化，F5 后恢复）
    inp = _find_input()
    if not inp.Exists(4):
        tab = root.Control(RegexName='^站点地图$', searchDepth=0xFFFFFFFF)
        if tab.Exists(3):
            try:
                tab.GetSelectionItemPattern().Select()
            except Exception:
                pass
            _t.sleep(2)
        inp = _find_input()
    for _ in range(2):
        if inp.Exists(2):
            break
        _uia_key_combo([0x11, 0x52])  # Ctrl+R 刷新页面
        _t.sleep(12)
        inp = _find_input()
    if not inp.Exists(8):
        return False, 'GSC 站点地图输入框未定位到（UIA）'

    # 2) 聚焦输入框；若已有 sitemap 值（上次提交残留）则跳过输入；否则键入 + 复核
    inp.SetFocus()
    _t.sleep(0.8)
    val = ''
    try:
        val = inp.GetValuePattern().Value or ''
    except Exception:
        pass
    if 'sitemap' not in val.lower():
        _uia_send_type_text('sitemap.xml')
        _t.sleep(1.2)
        try:
            val = inp.GetValuePattern().Value or ''
        except Exception:
            pass
    if 'sitemap' not in val.lower():
        try:
            inp.GetValuePattern().SetValue('sitemap.xml')
            _t.sleep(0.8)
            val = inp.GetValuePattern().Value or ''
        except Exception:
            pass
    if 'sitemap' not in val.lower():
        return False, 'sitemap.xml 未能输入到输入框（UIA，当前值 %r）' % val

    # 3) 精确找「提交」按钮并 Invoke（RegexName 精确匹配，避免误中「提交反馈」）
    btn = root.ButtonControl(RegexName='^提交$', searchDepth=0xFFFFFFFF)
    if not btn.Exists(8):
        return False, '提交按钮未定位到（UIA）'
    try:
        btn.GetInvokePattern().Invoke()
    except Exception as e:
        return False, '提交按钮 Invoke 失败: %r' % (e,)

    # 4) 验证：目标文本扫描（提交确认横幅 / 行时间=今天），并保存证据截图
    verdict = None
    note = ''
    for _i in range(3):
        _t.sleep(6)
        for tag in ('已成功提交站点地图', '已成功提交', '定期处理该站点地图'):
            if root.Control(SubName=tag, searchDepth=0xFFFFFFFF).Exists(2):
                verdict = '页面出现「%s」确认' % tag
                break
        if verdict:
            break
        if root.Control(SubName=today_cn, searchDepth=0xFFFFFFFF).Exists(2):
            verdict = 'sitemap 行「上次读取时间」=%s' % today_cn
            break
        note = '（第 %d 轮未扫描到确认）' % (_i + 1)
    shot = os.path.join(HERE, 'tmp_gsc_uia_done.png')
    try:
        from PIL import ImageGrab
        _r = _wt.RECT()
        u.GetWindowRect(hwnd, _c.byref(_r))
        ImageGrab.grab(bbox=(_r.left, _r.top, _r.right, _r.bottom)).save(shot)
    except Exception:
        pass
    if verdict:
        return True, 'sitemap.xml 已提交（UIA 验证：%s；证据截图 %s）' % (verdict, shot)
    return False, 'UIA 已点击提交但未扫描到确认文本%s（证据截图 %s）' % (note, shot)


def _gsc_sitemap_submit_ocr():
    """回退方案：OCR + 坐标流程提交 sitemap.xml。

    使用现有 Edge 主窗口，流程上做足防护：
      1. 窗口置顶(TOPMOST) + 最大化 + 前台强制验证（防止点击落错窗口/标签页）
      2. 新标签页 → Ctrl+L 聚焦地址栏 → 粘贴 GSC Sitemaps URL → 回车
      3. 轮询等待并验证地址栏出现 search.google.com（确认页面真的加载），再等输入框渲染
      4. OCR 定位「添加新的站点地图」下输入框 → 双击 → 输入 sitemap.xml → OCR 复核
         落位（两轮未落位即中止，绝不在错误页面盲点）
      5. OCR 定位「提交」按钮点击（兜底坐标：输入框右侧同排）
      6. 验证：出现「已提交」提示（≥2 处）或 sitemap 行「上次读取时间」变为今天，
         或表格中 sitemap.xml 行为「成功」；保存证据截图
      7. 关闭工作标签页、取消置顶

    Returns (ok, note)。"""
    import time as _t
    import ctypes, ctypes.wintypes as wt
    import wx_driver as wd
    u = wd.user32
    hwnd = _find_edge_hwnd()
    if not hwnd:
        return False, 'Edge 窗口未找到'
    # 统一约定：浏览器任务第一步先最大化窗口；置顶防遮挡；强制前台
    left, top, right, bottom = wd.maximize_window(hwnd)
    try:
        wd.make_topmost(hwnd, True)
    except Exception:
        pass
    for _ in range(5):
        wd.activate_window(hwnd)
        _t.sleep(0.5)
        if u.GetForegroundWindow() == hwnd:
            break
    shot = os.path.join(HERE, 'tmp_gsc_sitemap_page.png')
    d = datetime.date.today()
    today_cn = '%d 年 %d 月 %d 日' % (d.year, d.month, d.day)

    def _grab():
        """抓窗口自身内容（print_window）+ 缩小 OCR（坐标自动还原）。"""
        wd.activate_window(hwnd)
        _t.sleep(0.3)
        p = wd.print_window(hwnd, shot)
        if not p:
            r = wt.RECT()
            u.GetWindowRect(hwnd, ctypes.byref(r))
            wd.capture_screen((r.left, r.top, r.right, r.bottom), shot)
        return wd.ocr_image_ascii(shot, max_width=1920)

    def _joined(items):
        return ' '.join(''.join(t.split()) for (_x, _y, _w, _h, t) in items)

    def _find_input(items):
        for (x, y, w, h, t) in items:
            tt = ''.join(t.split())
            if '输入站点地图网址' in tt or '输入站点地图' in tt:
                return (x, y, w, h)
        return None

    def _paste_url():
        wd.combo('CTRL', 'L')
        _t.sleep(0.6)
        wd.paste_text(GSC_SITEMAP_URL)
        _t.sleep(0.5)
        wd.tap('ENTER')

    # 1) 新标签页导航到 GSC Sitemaps 页，验证地址栏/页面，轮询等待输入框渲染
    wd.combo('CTRL', 'T')
    _t.sleep(1.0)
    _paste_url()
    input_box = None
    for attempt in range(10):
        _t.sleep(10 if attempt == 0 else 8)
        items = _grab()
        j = _joined(items).replace('℃', '.').replace('，', '').replace('。', '.')
        if 'search.google.com' not in j and 'GoogleSearchConsole' not in j:
            # 页面明显不对（例如落到了搜索页）→ 重新粘贴导航（不关标签）
            _paste_url()
            continue
        input_box = _find_input(items)
        if input_box:
            break
    if not input_box:
        return False, 'GSC 站点地图输入框未定位到（最终页面：%s）' % _joined(_grab())[:80]

    # 2) 双击输入框 + 输入 sitemap.xml + OCR 复核落位（最多两轮，仍失败即中止）
    ix, iy, iw, ih = input_box
    cx, cy = left + ix + iw // 2, top + iy + ih // 2
    landed = False
    for _ in range(2):
        wd.click(cx, cy); _t.sleep(1.0)
        wd.click(cx, cy); _t.sleep(0.1)
        wd.click(cx, cy); _t.sleep(1.0)
        wd.type_text(GSC_SITEMAP, interval=0.03)
        _t.sleep(1.2)
        items = _grab()
        area = ' '.join((''.join(t.split())).replace('i', 'l').replace('I', 'l').replace('1', 'l')
                        for (_x, _y, _w, _h, t) in items
                        if _y > iy - 40 and _y < iy + 150)
        if 'sltemap' in area or 'sitemap' in area.lower():
            landed = True
            break
        wd.combo('CTRL', 'A'); _t.sleep(0.3)  # 清空重试
    if not landed:
        return False, 'sitemap.xml 未能输入到输入框（OCR 复核失败），已中止避免误点'

    # 3) 找「提交」按钮并点击（同行优先、同距取最右；兜底坐标）
    items = _grab()
    cands = []
    for (x, y, w, h, t) in items:
        tt = ''.join(t.split())
        if '提交' in tt or 'submit' in tt.lower():
            cands.append((x, y, w, h))
    clicked = None
    if cands:
        def _score(c):
            x, y, w, h = c
            return (abs((y + h // 2) - (iy + ih // 2)), -x)  # 行距近优先，同距取最右
        cands.sort(key=_score)
        bx, by, bw, bh = cands[0]
        clicked = (left + bx + bw // 2, top + by + bh // 2)
    else:
        clicked = (left + ix + iw + 150, top + iy + ih // 2)  # 兜底：输入框右侧同排
    wd.click(clicked[0], clicked[1])

    # 4) 验证提交结果（多等两次：Google 读取 sitemap 需要时间）+ 证据截图
    note = ''
    verdict = None
    for _ in range(3):
        _t.sleep(6)
        items = _grab()
        joined2 = _joined(items)
        note = '点击提交按钮(%d,%d)；提交后页面含：%s' % (clicked[0], clicked[1], joined2[:150])
        toast_cnt = joined2.count('已提交')  # 表头「已提交的站点地图」计 1 次，≥2 说明有提交提示
        row_today = ('sitemap' in joined2.lower()) and (today_cn in joined2)
        if toast_cnt >= 2:
            verdict = '出现「已提交」提示（全文 %d 处）' % toast_cnt
            break
        if row_today:
            verdict = 'sitemap 行「上次读取时间」=%s（Google 已重新读取）' % today_cn
            break
    done_shot = os.path.join(HERE, 'tmp_gsc_sitemap_done.png')
    p2 = wd.print_window(hwnd, done_shot)
    if not p2:
        r = wt.RECT()
        u.GetWindowRect(hwnd, ctypes.byref(r))
        wd.capture_screen((r.left, r.top, r.right, r.bottom), done_shot)
    # 关闭工作标签页 + 取消置顶
    try:
        wd.activate_window(hwnd)
        _t.sleep(0.4)
        wd.combo('CTRL', 'W'); _t.sleep(0.8)
    except Exception:
        pass
    try:
        wd.make_topmost(hwnd, False)
    except Exception:
        pass
    if verdict:
        return True, 'sitemap.xml 已提交（验证：%s；%s）' % (verdict, note)
    if '成功' in joined2 and 'sitemap' in joined2.lower():
        return True, 'sitemap.xml 在表格中状态成功（%s）' % note
    return False, '点击已执行但未识别到成功标记：' + note


def _find_edge_hwnd():
    """Return the HWND of the main visible Edge window."""
    sys.path.insert(0, HERE)
    import ctypes, ctypes.wintypes as wt
    import wx_driver as wd
    u = wd.user32
    WNDENUMPROC = ctypes.WINFUNCTYPE(wt.BOOL, wt.HWND, wt.LPARAM)
    edge = [None]
    def cb(hwnd, lparam):
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
    return edge[0]


def _ocr_locate_input(hwnd, shot_path):
    """OCR-locate the GSC inspect input box (space-insensitive). Returns
    window-relative (x, y, w, h) or None."""
    import wx_driver as wd
    items = wd.ocr_image(shot_path)
    for (x, y, w, h, t) in items:
        tt = ''.join(t.split())
        if '检查' in tt and '任何网址' in tt:
            return (x, y, w, h)
    return None


def _click_primary_dialog_btn(hwnd, left, top):
    """After clicking 请求编入索引 a confirm dialog appears. Locate and click
    its primary (solid dark/blue) button, which sits right of the 取消 button.

    Returns (screen_cx, screen_cy) on success, else None."""
    import wx_driver as wd
    import time as _t
    p = os.path.join(HERE, 'tmp_gsc_dialog.png')
    wd.print_window(hwnd, p)
    # 1) locate 取消 via OCR
    cancel = None
    for (x, y, w, h, t) in wd.ocr_image(p):
        if '取消' in ''.join(t.split()):
            cancel = (x, y, w, h)
            break
    if cancel:
        # primary button sits right of cancel on the same row (measured layout)
        cx, cy, cw, ch = cancel
        pcx, pcy = left + cx + 435, top + cy + 10
        # 2) verify that point is on a solid dark/blue button
        sys.path.insert(0, os.path.join(HERE, 'site311'))
        from PIL import Image
        img = Image.open(p).convert('RGB')
        W, H = img.size
        if 0 <= cx + 435 < W and 0 <= cy + 10 < H:
            r, g, b = img.getpixel((cx + 435, cy + 10))
            if r < 160 and g < 180 and b < 200:
                return (pcx, pcy)
    # fallback: solid-rect pixel scan in the right half of the dialog
    sys.path.insert(0, os.path.join(HERE, 'site311'))
    from PIL import Image
    img = Image.open(p).convert('RGB')
    W, H = img.size
    best = None
    for y in range(1150, 1380):
        xs = [x for x in range(2150, min(W, 2600)) if (lambda q: q[0] < 160 and q[1] < 180 and q[2] < 200)(img.getpixel((x, y)))]
        if len(xs) > 80:
            if best is None:
                best = [min(xs), max(xs), y, y]
            else:
                best[0] = min(best[0], min(xs)); best[1] = max(best[1], max(xs))
                best[2] = min(best[2], y); best[3] = max(best[3], y)
    if best and (best[1] - best[0]) < 400:
        x0, x1, y0, y1 = best
        return (left + (x0 + x1) // 2, top + (y0 + y1) // 2)
    return None


def google_submit_via_browser(urls):
    """Drive the user's Edge browser through GSC URL Inspection, requesting
    indexing ONLY for NOT-yet-indexed URLs.

    Robust flow per URL:
      1. maximize Edge, Ctrl+T new tab, navigate to GSC URL-inspection page
      2. OCR-locate the inspect input, DOUBLE-click it, type the URL
         (typing is more reliable than clipboard paste on this page)
      3. Enter -> wait for the inspection result
      4. if 请求编入索引 button shows -> click it, wait for the confirm
         dialog, click its primary button
      5. WAIT for the verification result (GSC_WAIT_AFTER_SUBMIT s) — the
         request is not instantly confirmed — then OCR the final state
      6. only then move to the next URL

    Returns list of (url, ok, note)."""
    import time as _t
    import wx_driver as wd
    u = wd.user32
    hwnd = _find_edge_hwnd()
    if not hwnd:
        return [(url, False, 'Edge 窗口未找到') for url in urls]
    results = []
    # 统一约定：浏览器任务第一步先最大化窗口
    left, top, right, bottom = wd.maximize_window(hwnd)
    # open a fresh tab pointed at the GSC inspect page
    wd.combo('CTRL', 'T')
    _t.sleep(1.2)
    wd.paste_text(GSC_INSPECT_URL)
    _t.sleep(0.5)
    wd.tap('ENTER')
    _t.sleep(14)

    # make sure the inspect page actually loaded (retry navigation)
    shot0 = os.path.join(HERE, 'tmp_gsc_req.png')
    wd.print_window(hwnd, shot0)
    if not _ocr_locate_input(hwnd, shot0):
        wd.combo('CTRL', 'W')
        _t.sleep(0.8)
        wd.combo('CTRL', 'T')
        _t.sleep(1.2)
        wd.paste_text(GSC_INSPECT_URL)
        _t.sleep(0.5)
        wd.tap('ENTER')
        _t.sleep(14)
        wd.print_window(hwnd, shot0)

    for url in urls:
        try:
            wd.activate_window(hwnd)
            _t.sleep(0.8)
            left, top, right, bottom = wd.get_window_rect(hwnd)
            # --- locate the inspect input via OCR (space-insensitive) ---
            shot = os.path.join(HERE, 'tmp_gsc_req.png')
            wd.print_window(hwnd, shot)
            target = _ocr_locate_input(hwnd, shot)
            if not target:
                results.append((url, False, 'GSC 输入框未定位到'))
                continue
            tx, ty, tw, th = target
            cx, cy = left + tx + tw // 2, top + ty + th // 2
            # --- double-click + type (v11/v12-verified reliable sequence:
            #     单击 -> 双击 -> 直接 type_text，不要 Ctrl+A，否则输入失效) ---
            wd.click(cx, cy)
            _t.sleep(1.0)
            wd.click(cx, cy)
            _t.sleep(0.1)
            wd.click(cx, cy)
            _t.sleep(1.0)
            wd.type_text(url, interval=0.02)
            _t.sleep(1.5)
            # verify the URL actually landed in the input (input-area OCR only)
            wd.print_window(hwnd, shot)
            items_in = wd.ocr_image(shot)
            area_joined = ' '.join(
                (''.join(t.split())).replace('℃', '.').replace('I', 'l').replace('1', 'l')
                for (_x, _y, _w, _h, t) in items_in if _y > ty - 40 and _y < ty + 150)
            # 用 URL 路径特征匹配（OCR 会把 i/I/l 混淆，因此两边都规范化）
            # 取 URL 前两个路径段作为提示（输入框可能截断显示长 URL）
            path_part = url.replace('https://iplmanufacturer.com', '').strip('/')
            segs = [s for s in path_part.split('/') if s]
            hint = '/'.join(segs[:2]).replace('i', 'l').replace('I', 'l')
            area_norm = area_joined.replace('i', 'l').replace('I', 'l')
            if hint and hint not in area_norm:
                results.append((url, False, 'URL 未进入输入框（OCR 未确认）'))
                continue
            wd.tap('ENTER')
            _t.sleep(16)
            # --- inspect the result ---
            wd.print_window(hwnd, shot)
            items = wd.ocr_image(shot)
            compact_texts = [''.join(t.split()) for (_x, _y, _w, _h, t) in items]
            joined = ' '.join(compact_texts)
            btn = None
            for (x, y, w, h, t) in items:
                compact = ''.join(t.split())
                if '请求编入索引' in compact or '请求编制索引' in compact or 'Requestindexing' in compact.lower():
                    btn = (x, y, w, h)
                    break
            if btn:
                bx, by, bw, bh = btn
                wd.click(left + bx + bw // 2, top + by + bh // 2)
                _t.sleep(3)
                # confirm dialog -> click primary button
                pb = _click_primary_dialog_btn(hwnd, left, top)
                if pb:
                    wd.click(pb[0], pb[1])
                else:
                    wd.tap('ENTER')  # fallback: Enter confirms the dialog
                # --- WAIT for the verification result before the next URL ---
                _t.sleep(GSC_WAIT_AFTER_SUBMIT)
                wd.print_window(hwnd, shot)
                joined2 = ' '.join(''.join(t.split()) for (_x, _y, _w, _h, t) in wd.ocr_image(shot))
                if '已请求编入索引' in joined2 or '已请求' in joined2 or '再次请求' in joined2:
                    results.append((url, True, '已请求编入索引（等待 %ds 验证）' % GSC_WAIT_AFTER_SUBMIT))
                elif '正在测试' in joined2 or '测试实际网址' in joined2:
                    results.append((url, True, '请求已提交，正在测试实际网址（等待 %ds 验证）' % GSC_WAIT_AFTER_SUBMIT))
                else:
                    results.append((url, True, '已点击请求编入索引（验证文本未识别：%s）' % joined2[:60]))
            elif '已收录' in joined or '编入索引' in joined or 'Indexed' in joined:
                results.append((url, False, '已收录，跳过（无需请求）'))
            else:
                results.append((url, False, '状态未知：%s' % joined[:60]))
        except Exception as e:
            results.append((url, False, '异常: %r' % (e,)))
        _t.sleep(1)
    # close the working tab
    try:
        wd.combo('CTRL', 'W')
        _t.sleep(0.8)
    except Exception:
        pass
    return results

def indexnow_submit(urls, host='iplmanufacturer.com'):
    """Submit URLs via IndexNow. Returns (ok, msg).

    请求体含 keyLocation（与 1011-main 的 submit-indexnow.mjs 一致），
    便于引擎校验 key 文件（尤其 Yandex）。"""
    if dry_run_enabled():
        # 干跑：绝不发请求。返回签名必须与真实路径一致，否则调用方解包会炸。
        stage_note('indexnow_submit', '本应对 %d 条发 POST（已跳过）' % len(urls))
        return True, 'DRY-RUN 已跳过（未发请求）'
    if not INDEXNOW_KEY:
        return False, 'IndexNow key 未配置（需在站点根目录部署 {key}.txt）'
    key_location = 'https://%s/%s.txt' % (host, INDEXNOW_KEY)
    body = json.dumps({'host': host, 'key': INDEXNOW_KEY,
                       'keyLocation': key_location, 'urlList': urls}).encode()
    req = urllib.request.Request(INDEXNOW_ENDPOINT, data=body,
                                 headers={'Content-Type': 'application/json; charset=utf-8'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status in (200, 202), 'HTTP %d' % r.status
    except Exception as e:
        return False, str(e)


def indexnow_submit_batch(urls, host='iplmanufacturer.com',
                          chunk=INDEXNOW_MAX_PER_REQUEST):
    """IndexNow 批量推送：按每次 ≤10,000 条分片，全部成功才算成功。

    Returns (ok, msg, submitted_count)。
    msg 汇总每片的 HTTP 结果，如 '2707条→HTTP 200'。"""
    if dry_run_enabled():
        stage_note('indexnow_submit_batch', '本应对 %d 条发 POST（已跳过）' % len(urls))
        return True, 'DRY-RUN 已跳过（%d 条未推送）' % len(urls), 0
    if not urls:
        return True, '无待推送 URL', 0
    if not INDEXNOW_KEY:
        return False, 'IndexNow key 未配置（需在站点根目录部署 {key}.txt）', 0
    ok_all, msgs, total = True, [], 0
    for i in range(0, len(urls), chunk):
        part = urls[i:i + chunk]
        ok, msg = indexnow_submit(part, host=host)
        total += len(part)
        msgs.append('%d条→%s' % (len(part), msg))
        if not ok:
            ok_all = False
            break
    return ok_all, '；'.join(msgs), total


# ------------------------------------------------------------------ 收录量检查
def gsc_export_indexed_count():
    """Google 权威收录数：读取最新 GSC 导出 CSV（网页索引报告）的行数。
    Returns (count, update_date) or (None, None)."""
    import glob as _g, csv as _csv, re as _re
    exports = sorted(_g.glob(os.path.join(PLANS, 'gsc-export-*')))
    if not exports:
        return None, None
    latest = exports[-1]
    table = os.path.join(latest, '表格.csv')
    if not os.path.exists(table):
        return None, None
    n = 0
    try:
        with open(table, encoding='utf-8-sig') as f:
            rdr = _csv.reader(f)
            next(rdr, None)
            for r in rdr:
                if r and r[0].startswith('http'):
                    n += 1
    except Exception:
        return None, None
    m = _re.search(r'gsc-export-(\d{4}-\d{2}-\d{2})', latest)
    return n, (m.group(1) if m else None)


def site_index_check(engine, search_url, site='iplmanufacturer'):
    """真实浏览器 site: 检查单个引擎的收录情况。
    复用周报的浏览器驱动逻辑（Edge + 截图 + OCR）。
    site 参数为域名主体（不含 .com），如 'iplmanufacturer'。
    Returns (count_or_None, note)."""
    if dry_run_enabled():
        # 干跑不启动浏览器（Edge + 截图 + OCR 都会真实操作桌面）
        stage_note('site_index_check', '%s: 本应浏览器实测（已跳过）' % engine)
        return None, 'DRY-RUN 已跳过（未驱动浏览器）'
    sys.path.insert(0, HERE)
    import time as _t
    import wx_driver as wd
    import ctypes, ctypes.wintypes as wt
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
        return None, 'Edge 窗口未找到'
    # 统一约定：浏览器任务第一步先最大化窗口
    wd.maximize_window(hwnd)
    wd.combo('CTRL', 'T')
    _t.sleep(1.0)
    wd.paste_text(search_url)
    _t.sleep(0.5)
    wd.tap('ENTER')
    # 页面加载等待 + 重试截图（某些引擎渲染慢）
    shot = os.path.join(HERE, 'tmp_indexcheck_%s.png' % engine)
    texts = []
    for attempt in range(3):
        _t.sleep(12 if attempt == 0 else 8)
        # 确保窗口在前台再截屏（capture_screen 依赖前台渲染）
        wd.activate_window(hwnd)
        _t.sleep(0.6)
        r = wt.RECT()
        u.GetWindowRect(hwnd, ctypes.byref(r))
        wd.capture_screen((r.left, r.top, r.right, r.bottom), shot)
        texts = wd.ocr_texts(shot)
        probe = ' '.join(''.join(t.split()) for t in texts)
        if 'iplmanufacturer' in probe.lower() or 'site:' in probe.lower() or 'Therearenoresults' in probe or '검색결과가없' in probe:
            break
        if 'SmartCaptcha' in probe or 'robot' in probe.lower():
            break
    try:
        wd.combo('CTRL', 'W')
        _t.sleep(0.5)
    except Exception:
        pass
    joined = ' '.join(''.join(t.split()) for t in texts)
    if 'Therearenoresults' in joined or '没有搜索结果' in joined or '검색결과가없' in joined:
        return 0, '明确无结果'
    if 'SmartCaptcha' in joined or 'Areyounotarobot' in joined or 'robot' in joined.lower():
        return None, '反爬验证拦截'
    if 'blocked' in joined.lower() or 'Cloudflare' in joined:
        return None, 'Cloudflare 拦截'
    # count distinct site URLs visible in the RESULT area of the page.
    # OCR renders the domain in various forms, e.g.
    #   iplmanufacturer ℃ om/products/eirene     (℃→'.', 'om'→'com')
    #   ipl manufacturer ℃ om/blog               (space inside domain)
    #   https://iplmanufacturer.com/products/... (normal)
    # 注意：必须用带坐标的 ocr_image 并排除顶部查询框/地址栏区域（y<400），
    # 否则查询框里的 "site:iplmanufacturer.com" 会被误计为一条收录。
    import wx_driver as wd
    seen = set()
    for (_x, _y, _w, _h, t) in wd.ocr_image(shot):
        if _y < 400:  # 跳过地址栏/查询框/导航区
            continue
        tt = t.replace(' ', '').replace('℃', '.').replace('〇', '.').replace('•', '.')
        # 把 OCR 常见的 "iplmanufacturer.om"（丢 c）修正为 .com
        tt = re.sub(r'%s\.om(?=[/\w\-\.]|$)' % site, '%s.com' % site, tt)
        for m in re.finditer(r'(?:https?://)?(?:www\.)?%s\.(?:com|net|org|io|co)[/\w\-\.]*' % site, tt):
            u = m.group(0).rstrip('。，；、')
            key = u.replace('https://', '').replace('http://', '').replace('www.', '')
            seen.add(key)
    if seen:
        return len(seen), '实测可见 %d 条（结果区）' % len(seen)
    return 0, '结果区无可见 URL（未收录或页面未加载）'


def index_count_summary():
    """汇总各引擎收录量，供每日报告使用。
    Returns list of (engine, count_or_None, note)."""
    rows = []
    g_cnt, g_upd = gsc_export_indexed_count()
    if g_cnt is not None:
        rows.append(('Google', g_cnt, 'GSC 导出 %s（权威）' % g_upd))
    else:
        rows.append(('Google', None, 'GSC 导出缺失（待手动导出）'))
    # Bing / Naver / Seznam: real-browser site: check（Yandex 反爬频繁，不纳入每日实测）
    b_val, b_note = site_index_check('bing', 'https://www.bing.com/search?q=site%%3A%s&mkt=en-US' % SITE)
    rows.append(('Bing', b_val, b_note or '—'))
    nv_val, nv_note = site_index_check('naver', 'https://search.naver.com/search.naver?query=site%%3A%s' % SITE)
    rows.append(('Naver', nv_val, nv_note or '—'))
    sz_val, sz_note = site_index_check('seznam', 'https://search.seznam.cz/?q=site%%3A%s' % SITE)
    rows.append(('Seznam', sz_val, sz_note or '—'))
    return rows

def bing_batch_progress():
    """Bing 逐 URL 核验进度（由 bing_daily_batch.py 每日 08:30 累积）。

    GetUrlInfo 有 host 级日配额（ThrottleHost），故只能按天小额度推进；
    因此日报只需呈现"累计到哪了"，不必每天重跑。
    返回 None 表示尚无任何有效结论（或脚本/结果文件不存在）。
    """
    wb_dir = os.path.dirname(os.path.abspath(__file__))
    results = os.path.join(wb_dir, '_bing_valid_only.jsonl')
    state_f = os.path.join(wb_dir, '_bing_batch_state.json')
    if not os.path.exists(results):
        return None
    idx = unk = 0
    urls = set()
    for line in open(results, encoding='utf-8'):
        line = line.strip()
        if not line:
            continue
        try:
            r = json.loads(line)
        except Exception:
            continue
        v = r.get('verdict')
        if v == 'indexed_known':
            idx += 1
            urls.add(r.get('url'))
        elif v == 'unknown_url':
            unk += 1
            urls.add(r.get('url'))
    if not urls:
        return None
    quota_days = []
    if os.path.exists(state_f):
        try:
            quota_days = json.load(open(state_f, encoding='utf-8')).get('quota_exhausted_dates', [])
        except Exception:
            pass
    return {'valid': idx + unk, 'indexed': idx, 'not_indexed': unk,
            'quota_days': quota_days}


def main():
    preflight()   # 缺必需变量就在这里一次性报出并退出（不回落默认值）
    today = datetime.date.today().isoformat()

    # ---- 校准步骤：提交前把 URL 清单与线上 sitemap 对齐 ----
    print('== 校准 site-urls.txt ==')
    cal = calibrate_urls()
    urls = load_urls()
    state = load_state()
    en_pool, ru_pool = en_ru_pool(urls)

    # known-indexed URL sets (exclude from daily submission)
    google_indexed = load_known_indexed(os.path.join(PLANS, 'gsc-indexed-pages.txt'))
    yandex_indexed = load_known_indexed(os.path.join(PLANS, 'yandex-indexed.txt'))

    # ---- Google: 每日一次在 GSC 提交 sitemap.xml（浏览器驱动）----
    g_ok = None
    g_msg = '未执行（需要 --google-browser 参数）'
    if '--google-browser' in sys.argv:
        g_ok, g_msg = gsc_sitemap_submit()

    # ---- Yandex: 10/day = 5 EN + 5 RU (priority to English and Russian) ----
    en_pick = rotate_pick(en_pool, state.get('yandex_submitted', {}), YANDEX_PER_DAY // 2, exclude=yandex_indexed)
    ru_pick = rotate_pick(ru_pool, state.get('yandex_submitted', {}), YANDEX_PER_DAY - len(en_pick), exclude=yandex_indexed)
    y_pick = en_pick + ru_pick
    y_ok, y_msg = indexnow_submit(y_pick)
    for u in y_pick:
        state['yandex_submitted'][u] = today

    # ---- Naver: 50/day (IndexNow fans out to Naver) ----
    naver_pick = rotate_pick(urls, state.get('naver_submitted', {}), NAVER_PER_DAY)
    nv_ok, nv_msg = indexnow_submit(naver_pick)
    for u in naver_pick:
        state['naver_submitted'][u] = today

    # ---- Seznam: 10/day (IndexNow fans out to Seznam) ----
    seznam_pick = rotate_pick(en_pool, state.get('seznam_submitted', {}), SEZNAM_PER_DAY)
    sz_ok, sz_msg = indexnow_submit(seznam_pick)
    for u in seznam_pick:
        state['seznam_submitted'][u] = today

    # ---- Bing: 每日全量推送（≤10,000 URL/天，Bing Webmaster 配额；IndexNow 自动分片）----
    b_prev = state.get('bing_submitted', {})
    b_pick = rotate_pick(urls, b_prev, BING_PER_DAY)  # 先推从未提交的，再轮换刷新，填满每日配额
    b_mode = '全量推送（≤10,000/天）'
    b_ok, b_msg, b_cnt = indexnow_submit_batch(b_pick)
    for u in b_pick:
        state['bing_submitted'][u] = today

    # ---- report ----
    os.makedirs(write_path(os.path.join(REPORT_DIR, '_')), exist_ok=True)  # 干跑下建到暂存区
    rep = []
    rep.append('# SEO 每日工作报告 %s' % today)
    rep.append('')
    rep.append('站点: %s | 全站 URL: %d | 运行时间: %s 自动作业'
               % (SITE, len(urls), datetime.datetime.now().strftime('%H:%M')))
    rep.append('')
    if cal.get('skipped'):
        rep.append('> ⚠ URL 校准：线上 sitemap 抓取失败，本次沿用本地清单（%d 条），请检查网络/站点状态' % len(urls))
    elif cal['added'] or cal['removed']:
        rep.append('> URL 校准：提交前已与线上 sitemap 对齐 — 新增 %d 条，移除 %d 条（当前共 %d 条）'
                   % (cal['added'], cal['removed'], cal['total']))
    else:
        rep.append('> URL 校准：与线上 sitemap 一致（%d 条），无变化' % cal['total'])
    rep.append('')
    # ---- lastmod 覆盖（Bing 唯一认可的时效信号：changefreq/priority 被忽略）----
    _lm = cal.get('lastmod') or {}
    if _lm.get('total'):
        _pct = 100.0 * _lm['with_lm'] / _lm['total']
        _omit = _lm['total'] - _lm['with_lm']
        rep.append('> **Sitemap lastmod 覆盖**：%d/%d 条（%.1f%%）；省略 %d 条'
                   % (_lm['with_lm'], _lm['total'], _pct, _omit))
        rep.append('>')
        rep.append('> 省略项 = 博客分类聚合页（无独立内容文件，按 Bing 口径「宁可缺失不可编造」）。')
        rep.append('> lastmod 取值 = 内容的 git 提交时间（未提交文件以 mtime 兜底）；'
                   'Bing 用它决定「优先重抓 / 跳过」。')
        if _lm.get('oldest') and _lm.get('newest'):
            rep.append('> 区间：%s ～ %s' % (_lm['oldest'], _lm['newest']))
        if _pct < 80:
            rep.append('>')
            rep.append('> ⚠ 覆盖率低于 80%，请检查 generate-sitemap 的 lastmod 映射是否失效。')
    else:
        rep.append('> ⚠ Sitemap lastmod：无法统计（线上 sitemap 未取到或仍无 lastmod 标签）——'
                   'Bing 缺少时效信号，重抓优先级无法提升。')
    rep.append('')
    # ---- Bing 逐 URL 核验进度（由 bing_daily_batch.py 每日 08:30 累积）----
    _bp = bing_batch_progress()
    if _bp:
        rep.append('> **Bing 逐 URL 核验进度**：%d/%d 条取得有效结论（已发现 %d / 明确未收录 %d）'
                   % (_bp['valid'], len(urls), _bp['indexed'], _bp['not_indexed']))
        rep.append('>')
        rep.append('> GetUrlInfo 有 host 级**日配额**，按天小额度累积（每日 08:30；'
                   'Bing 配额按 UTC 00:00 重置）。限流一律不落盘，不计入结论。')
        if _bp['quota_days']:
            rep.append('> 已记录配额耗尽日：%s' % '、'.join(_bp['quota_days'][-5:]))
    rep.append('')
    rep.append('> 提交方式：Google = 每日一次在 GSC 站点地图页提交 sitemap.xml；'
               'Bing = IndexNow 每日全量推送（Bing Webmaster 配额 10,000 URL/天）；'
               'Yandex/Naver/Seznam = IndexNow API 推送')
    rep.append('')
    rep.append('## 今日提交')
    rep.append('')
    g_status = g_msg if g_ok is not None else '未执行（需 --google-browser）'
    g_note = 'GSC 站点地图提交（sitemap.xml）'
    rep.append('| 引擎 | 提交数量 | 状态 | 说明 |')
    rep.append('|---|---|---|---|')
    rep.append('| Google | sitemap.xml × 1 | %s | %s |' % (g_status, g_note))
    rep.append('| Bing | %d (%s) | %s | %s |' % (b_cnt, b_mode, '成功' if b_ok else '未执行', b_msg))
    rep.append('| Yandex | %d (EN+RU) | %s | %s |' % (len(y_pick), '成功' if y_ok else '未执行', y_msg))
    rep.append('| Naver | %d (韩语最大搜索引擎) | %s | %s |' % (len(naver_pick), '成功' if nv_ok else '未执行', nv_msg))
    rep.append('| Seznam | %d (捷克语搜索引擎) | %s | %s |' % (len(seznam_pick), '成功' if sz_ok else '未执行', sz_msg))
    rep.append('')
    rep.append('## 今日 Yandex 提交（EN/RU 优先，10 个）')
    rep.append('')
    for u in y_pick:
        rep.append('- %s' % u)
    rep.append('')
    rep.append('## 累计状态')
    rep.append('')
    rep.append('- Google sitemap 提交: 每日 1 次（GSC 站点地图页）')
    rep.append('- Bing 已提交: %d（每日全量，配额 10,000/天）' % len(state['bing_submitted']))
    rep.append('- Yandex 已提交: %d' % len(state['yandex_submitted']))
    rep.append('- Naver 已提交: %d' % len(state['naver_submitted']))
    rep.append('- Seznam 已提交: %d' % len(state['seznam_submitted']))
    rep.append('')
    rep.append('## 明日计划')
    rep.append('')
    rep.append('- Google: 每日 1 次 sitemap.xml 提交（GSC）')
    rep.append('- Bing: 每日全量推送全部 URL（≤10,000/天，IndexNow 分片）')
    rep.append('- Yandex: 从 EN+RU 池轮换推送 10 个')
    rep.append('- Naver: 轮换推送 50 个（IndexNow 扇出）')
    rep.append('- Seznam: 从 EN 池轮换推送 10 个（IndexNow 扇出）')
    rep.append('')
    rep.append('---')
    rep.append('本报告由 Harness AI 自主完成（每日 23:59 提交；邮件于次日北京时间 08:00 发送）')

    rep_text = '\n'.join(rep)
    report_file = os.path.join(REPORT_DIR, 'daily-report-%s.md' % today)
    with open(write_path(report_file), 'w', encoding='utf-8') as f:
        f.write(rep_text)
    state['last_run'] = today
    save_state(state)
    print(rep_text)
    print('\n[saved]', write_path(report_file))
    # 注意：此处只「起草」报告（生成文件），不发送邮件。
    # 邮件由计划任务 DSH_SEO_Email 在次日北京时间 08:00 发送。


if __name__ == '__main__':
    main()
