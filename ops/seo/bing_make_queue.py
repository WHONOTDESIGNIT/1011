# -*- coding: utf-8 -*-
"""生成 Bing 核验队列：高价值优先，其余抽样。

为什么不再"全量清账"
--------------------
GetUrlInfo 是令牌桶限流，约 2 条/分钟可持续，所以按 25 条/天算全量 3117 条要
126 天 —— 追不上内容增长。逐条核验的定位应该是**监控**，不是清账。

队列构成
--------
  第 1 段（优先，必查）  ：产品页 + 各语种枢纽页（首页 / 博客 / 产品 / 服务 / about）
                           这些是转化页与语种入口，值不值得收录直接影响业务
  第 2 段（抽样，监控用）：其余 URL 按固定步长抽样
                           目的是持续观测"剩下那一大片"有没有系统性恶化，
                           而不是逐条确认

抽样用**固定步长**而非随机：可复现（每次生成的队列一致），
且均匀覆盖各语种与各页面类型，避免随机抽样在小样本下漏掉整个语种。

输出：DSH_DATA_DIR/_bing_queue.json（有序数组，可人工检视/调整）。
已取得结论的 URL 不进入队列。
"""
import argparse
import io
import json
import os
import re

SITE = 'https://iplmanufacturer.com'
LANG_RE = re.compile(r'^/([a-z]{2}(?:-[a-z]{2})?)(/|$)')
HUBS = {'', '/', '/blog', '/products', '/services', '/about', '/catalogue',
        '/clients', '/components', '/contact', '/marketplace'}

# 站点仓库根目录：从环境变量取，不写死本机路径。缺了响亮失败并说明用途。
REPO = os.environ.get('DSH_REPO_ROOT', '').strip()
if not REPO:
    print('❌ 需要 DSH_REPO_ROOT 指向站点仓库（含 site-urls.txt）')
    raise SystemExit(2)


def split_path(u):
    p = u.replace(SITE, '')
    m = LANG_RE.match(p)
    lang = m.group(1) if m else 'en'
    rest = p
    if lang != 'en':
        # +1 跳过前导斜杠：'/tr/products/x' 的 rest 应是 '/products/x'
        rest = p[len(lang) + 1:] or '/'
    return lang, (rest if rest.startswith('/') else '/' + rest)


def classify(u):
    """返回 (档位, 类型名)"""
    lang, p = split_path(u)
    if re.match(r'^/products/[^/]+$', p):
        return 1, 'product'
    if p in HUBS:
        return 2, 'hub'
    if '/blog/category/' in p:
        return 6, 'blog-category'
    if '/blog/' in p:
        return 4, 'blog'
    if re.match(r'^/(services|about)/[^/]+$', p):
        return 3, 'service-about'
    return 5, 'other'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data-dir', required=False)
    ap.add_argument('--sample-ratio', type=float, default=0.2,
                    help='第 2 段抽样比例（默认 0.2 即每 5 条取 1 条）')
    ap.add_argument('--out', default='_bing_queue.json')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    data = (args.data_dir or os.environ.get('DSH_DATA_DIR')
            or os.environ.get('DSH_WORKSPACE'))
    if not data:
        print('❌ 需要 --data-dir 或 DSH_DATA_DIR / DSH_WORKSPACE')
        raise SystemExit(2)
    data = data.strip('"')

    src = os.path.join(REPO, 'site-urls.txt')
    if not os.path.exists(src):
        print('❌ 找不到 %s（需要 DSH_REPO_ROOT 指向站点仓库）' % src)
        raise SystemExit(2)

    done = set()
    vf = os.path.join(data, '_bing_valid_only.jsonl')
    if os.path.exists(vf):
        for line in io.open(vf, encoding='utf-8'):
            line = line.strip()
            if not line:
                continue
            try:
                done.add(json.loads(line)['url'].rstrip('/'))
            except Exception:
                pass

    urls = [l.strip().rstrip('/') for l in io.open(src, encoding='utf-8') if l.strip()]
    todo = [u for u in urls if u not in done]

    tiered = {}
    for u in todo:
        t, name = classify(u)
        tiered.setdefault(t, []).append(u)

    # 第 1 段：档 1（产品）+ 档 2（枢纽），保持语种轮转以免英文连成一片
    def rotate(seq):
        by_lang = {}
        order = []
        for u in seq:
            lang, _ = split_path(u)
            if lang not in by_lang:
                by_lang[lang] = []
                order.append(lang)
            by_lang[lang].append(u)
        out = []
        while any(by_lang.values()):
            for l in order:
                if by_lang[l]:
                    out.append(by_lang[l].pop(0))
        return out

    priority = rotate(tiered.get(1, [])) + rotate(tiered.get(2, []))

    # 第 2 段：其余按固定步长抽样（可复现，且跨语种/类型均匀）
    rest = []
    for t in (3, 4, 5, 6):
        rest += rotate(tiered.get(t, []))
    step = max(1, int(round(1.0 / args.sample_ratio))) if args.sample_ratio > 0 else 0
    sampled = rest[::step] if step else []

    queue = priority + sampled

    print('  全站清单        : %d' % len(urls))
    print('  已有结论（排除）: %d' % len(done))
    print('  待查            : %d' % len(todo))
    print()
    print('  第 1 段 优先必查:')
    print('    产品页   %4d' % len(tiered.get(1, [])))
    print('    枢纽页   %4d' % len(tiered.get(2, [])))
    print('    小计     %4d  → 约 %.0f 天 @25/天' % (len(priority), len(priority) / 25))
    print()
    print('  第 2 段 抽样监控（其余 %d 条中按 1/%d 抽取）:' % (len(rest), step))
    print('    抽样     %4d  → 约 %.0f 天 @25/天' % (len(sampled), len(sampled) / 25))
    print()
    print('  队列合计 %4d 条  → 约 %.0f 天 @25/天' % (len(queue), len(queue) / 25))
    print()
    print('  队列前 8 条:')
    for u in queue[:8]:
        t, name = classify(u)
        print('    档%d %-12s %s' % (t, name, u.replace(SITE, '')))

    if args.dry_run:
        print()
        print('  [dry-run] 未写文件')
        return

    out = os.path.join(data, args.out)
    io.open(out, 'w', encoding='utf-8', newline='').write(
        json.dumps(queue, ensure_ascii=False))
    print()
    print('  已写出: %s' % out)
    back = json.load(io.open(out, encoding='utf-8'))
    print('  复验: 解析回来 %d 条，单行 JSON: %s' % (
        len(back), len(io.open(out, encoding='utf-8').read().split('\n')) == 1))


if __name__ == '__main__':
    main()
