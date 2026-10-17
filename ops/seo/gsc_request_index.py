# -*- coding: utf-8 -*-
"""通过 Google URL Inspection API 提交"请求编入索引"。

为什么需要这条路：GSC 浏览器 UI 的网址检查配额**未公开且极小**，实测一天
跑 104 条后就返回"您已超出资源的网址检查配额"。而 URL Inspection API 的额度是
官方公开的 2000 QPD / 600 QPM —— 数量级完全不同。

前置条件（一次性，需要在 GCP 控制台点几下）：
  1. 在项目 my-page20261016 里启用 Search Console API
  2. 创建服务账号并下载 JSON 密钥
  3. 在 GSC 里把服务账号邮箱加为**所有者/完全权限**用户
  4. 把密钥存为 ops/seo/gsc-service-account.json（已被 .gitignore 排除）

用法：
  python gsc_request_index.py --urls-file urls.txt
  python gsc_request_index.py --url https://iplmanufacturer.com/products/xxx
  python gsc_request_index.py --urls-file urls.txt --dry-run

注意：URL Inspection API 是**只读**接口。官方并不提供"提交后立即重抓"的写接口；
`urlInspection.index.inspect` 返回该 URL 的索引状态。真正的"请求编入索引"动作只在
UI 里有按钮。所以本脚本的定位是：
  · 用 API 的 2000/天 额度**批量获取真实索引状态**（替代被卡死的 UI 路径）
  · 对确认 not_indexed 的高价值页面，输出一份清单供人工在 UI 里逐条点提交
     （UI 的"请求编入索引"按钮每天可用次数仍受配额限制，但需要人工点的是少数高价值页）

这个区分很重要：不要把它当成"自动提交收录"的工具，它做不到。
"""
import argparse
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(HERE, 'gsc-service-account.json')
SITE_URL = 'https://iplmanufacturer.com/'
SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']


def load_key():
    env = os.environ.get('GSC_SERVICE_ACCOUNT_JSON', '').strip()
    if env and os.path.exists(env):
        return env
    if os.path.exists(KEY_FILE):
        return KEY_FILE
    return ''


def build_service(key_path):
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        print('❌ 缺少 Google 客户端库。安装：')
        print('   "<python>" -m pip install google-api-python-client google-auth')
        sys.exit(2)
    creds = service_account.Credentials.from_service_account_file(key_path, scopes=SCOPES)
    return build('searchconsole', 'v1', credentials=creds, cache_discovery=False)


def inspect_one(svc, url):
    body = {'inspectionUrl': url, 'siteUrl': SITE_URL}
    try:
        resp = svc.urlInspection().index().inspect(body=body).execute()
        r = resp.get('inspectionResult', {})
        idx = r.get('indexStatusResult', {}) or {}
        return {
            'url': url,
            'verdict': idx.get('verdict'),
            'coverageState': idx.get('coverageState'),
            'robotsTxtState': idx.get('robotsTxtState'),
            'indexingState': idx.get('indexingState'),
            'lastCrawlTime': idx.get('lastCrawlTime'),
            'pageFetchState': idx.get('pageFetchState'),
            'googleCanonical': idx.get('googleCanonical'),
            'userCanonical': idx.get('userCanonical'),
            'crawledAs': idx.get('crawledAs'),
        }
    except Exception as e:
        msg = str(e)
        if 'quota' in msg.lower() or '429' in msg:
            return {'url': url, 'error': 'QUOTA_EXCEEDED', 'raw': msg[:200]}
        if '403' in msg or 'permission' in msg.lower():
            return {'url': url, 'error': 'NO_ACCESS', 'raw': msg[:200]}
        return {'url': url, 'error': 'ERROR', 'raw': msg[:200]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', action='append', default=[])
    ap.add_argument('--urls-file')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--out', default='_gsc_api_results.jsonl')
    args = ap.parse_args()

    urls = list(args.url)
    if args.urls_file:
        urls += [l.strip() for l in io.open(args.urls_file, encoding='utf-8')
                 if l.strip().startswith('http')]
    # 去重保序
    seen, uniq = set(), []
    for u in urls:
        k = u.rstrip('/')
        if k not in seen:
            seen.add(k)
            uniq.append(k)
    urls = uniq

    if not urls:
        print('❌ 没有要检查的 URL（用 --url 或 --urls-file）')
        sys.exit(2)

    key = load_key()
    if not key:
        print('❌ 未找到服务账号密钥。')
        print('   期望位置: %s' % KEY_FILE)
        print('   或环境变量 GSC_SERVICE_ACCOUNT_JSON 指向该文件')
        print()
        print('   一次性设置步骤（需在浏览器里完成，无法由脚本代做）：')
        print('   1. https://console.cloud.google.com/apis/library/searchconsole.googleapis.com?project=my-page20261016')
        print('      点「启用」')
        print('   2. https://console.cloud.google.com/apis/credentials/serviceaccountkey?project=my-page20261016')
        print('      创建服务账号 → 密钥类型 JSON → 下载')
        print('   3. 打开下载的 JSON，复制其中的 client_email')
        print('   4. GSC → 设置 → 用户和权限 → 添加用户 → 粘贴该邮箱 → 权限选「完全」')
        print('   5. 把 JSON 存为 %s' % KEY_FILE)
        sys.exit(2)

    if args.dry_run:
        print('[dry-run] 将检查 %d 个 URL，不调用 API' % len(urls))
        for u in urls[:20]:
            print('   ' + u)
        if len(urls) > 20:
            print('   …共 %d 条' % len(urls))
        print('[dry-run] 密钥文件: %s' % key)
        return

    svc = build_service(key)
    print('  开始检查 %d 个 URL（API 额度 2000/天）' % len(urls))
    out = io.open(args.out, 'a', encoding='utf-8')
    stats = {'indexed': 0, 'not_indexed': 0, 'error': 0}
    not_indexed = []
    for i, u in enumerate(urls, 1):
        r = inspect_one(svc, u)
        out.write(json.dumps(r, ensure_ascii=False) + '\n')
        out.flush()
        if r.get('error') == 'QUOTA_EXCEEDED':
            print('  ⛔ 第 %d 条命中 API 配额，停止' % i)
            break
        if r.get('error'):
            stats['error'] += 1
            print('  [%d/%d] 错误 %-10s %s' % (i, len(urls), r['error'],
                                              u.replace('https://iplmanufacturer.com', '')))
            continue
        v = r.get('verdict')
        if v == 'PASS':
            stats['indexed'] += 1
            mark = '已收录'
        else:
            stats['not_indexed'] += 1
            not_indexed.append(r)
            mark = '未收录'
        print('  [%d/%d] %-6s %-46s %s' % (
            i, len(urls), mark, u.replace('https://iplmanufacturer.com', '')[:46],
            (r.get('coverageState') or '')[:24]))
    out.close()

    print()
    print('  已收录 %d / 未收录 %d / 错误 %d' % (
        stats['indexed'], stats['not_indexed'], stats['error']))
    if not_indexed:
        print()
        print('  需要人工在 GSC UI 里点"请求编入索引"的高价值页面:')
        for r in not_indexed[:20]:
            print('    %-54s %s' % (r['url'].replace('https://iplmanufacturer.com', ''),
                                    (r.get('coverageState') or '')[:30]))
    print()
    print('  结果已写入 %s' % args.out)


if __name__ == '__main__':
    main()
