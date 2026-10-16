# -*- coding: utf-8 -*-
"""seo_email_smtp.py — send the latest SEO daily report via SMTP (smtp.exmail.qq.com).

Replaces the WeMail desktop-client UI automation with a pure-script sender.
Run daily at 08:00 (Beijing) by Task Scheduler DSH_SEO_Email: sends the
latest daily report (drafted by the 23:59 DSH_SEO_Daily task the day before).

Config: reads seo_smtp_config.json next to this file (never commit it).
Usage:
  python seo_email_smtp.py            # send latest daily report
  python seo_email_smtp.py --test     # send to the configured sender itself, subject prefixed [测试]
  python seo_email_smtp.py --to x@y.z # override recipient (comma separated allowed)
"""
import sys, os, json, glob, re, html, datetime
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── 统一配置 / 干跑层（模式见同目录 preflight.py；本目录其余脚本照抄此段）──────
from preflight import optional_env, preflight, dry_run_enabled, write_path, stage_note

_HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(_HERE, 'seo_smtp_config.json')
# 日报由 seo_daily.py 写进应用目录（.wx-bridge）的 plans/daily-reports。
# 本脚本现位于 ops/seo，不能再按自己的目录去找——否则永远找不到报告。
# DSH_WORKSPACE 语义与其他脚本一致：就是 .wx-bridge 本身。
_APP = optional_env('DSH_WORKSPACE', _HERE)
REPORT_DIR = os.path.join(_APP, 'plans', 'daily-reports')


# ---------------------------------------------------------------- markdown→HTML
def md_to_html(md: str) -> str:
    """Tiny converter for the daily-report format (headings, tables, lists, bold, hr)."""
    out = []
    lines = md.splitlines()
    i, n = 0, len(lines)
    while i < n:
        line = lines[i].rstrip()
        s = line.strip()

        # fenced code (skip, not used in reports)
        if s.startswith('```'):
            i += 1
            while i < n and not lines[i].strip().startswith('```'):
                i += 1
            i += 1
            continue

        # horizontal rule
        if re.fullmatch(r'-{3,}|\*{3,}|_{3,}', s):
            out.append('<hr/>')
            i += 1
            continue

        # headings
        m = re.match(r'^(#{1,4})\s+(.*)$', s)
        if m:
            level = len(m.group(1))
            out.append('<h%d>%s</h%d>' % (level, esc_inline(m.group(2)), level))
            i += 1
            continue

        # table block: | a | b | then |---|---| then rows
        if s.startswith('|') and s.endswith('|') and i + 1 < n \
           and re.match(r'^\s*\|[\s:|-]+\|\s*$', lines[i + 1]):
            header = split_row(s)
            i += 2
            rows = []
            while i < n:
                rs = lines[i].strip()
                if not (rs.startswith('|') and rs.endswith('|')):
                    break
                rows.append(split_row(rs))
                i += 1
            out.append('<table border="1" cellspacing="0" cellpadding="6" '
                       'style="border-collapse:collapse;font-size:13px">')
            out.append('<thead><tr>' + ''.join('<th bgcolor="#f2f2f2">%s</th>' % esc_inline(c) for c in header) + '</tr></thead>')
            out.append('<tbody>')
            for r in rows:
                out.append('<tr>' + ''.join('<td>%s</td>' % esc_inline(c) for c in r) + '</tr>')
            out.append('</tbody></table>')
            continue

        # unordered list
        m = re.match(r'^\s*[-*]\s+(.*)$', s)
        if m:
            if not out or not out[-1].startswith('<li>'):
                out.append('<ul>')
            out.append('<li>%s</li>' % esc_inline(m.group(1)))
            i += 1
            continue

        # blank line: close any open <ul>
        if not s:
            if out and out[-1].startswith('<li>'):
                out.append('</ul>')
            i += 1
            continue

        # end of a list block -> close <ul>
        if out and out[-1].startswith('<li>'):
            out.append('</ul>')

        out.append('<p>%s</p>' % esc_inline(s))
        i += 1

    if out and out[-1].startswith('<li>'):
        out.append('</ul>')
    body = '\n'.join(out)
    return body


def split_row(row: str):
    cells = row.strip().strip('|').split('|')
    return [c.strip() for c in cells]


def esc_inline(s: str) -> str:
    s = html.escape(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'`(.+?)`', r'<code>\1</code>', s)
    return s


def build_html(subject: str, md_body: str) -> str:
    inner = md_to_html(md_body)
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;color:#222;line-height:1.55">
{inner}
<p style="color:#888;font-size:12px;margin-top:18px">— 本邮件由 Harness AI 自主完成（每日 23:59 提交、次日北京时间 08:00 发送）</p>
</body></html>"""


# ------------------------------------------------------------------- send
def latest_report():
    files = sorted(glob.glob(os.path.join(REPORT_DIR, 'daily-report-*.md')))
    return files[-1] if files else None


def send(subject: str, html_body: str, text_body: str, to_addrs, cfg):
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.header import Header
    from email.utils import formataddr

    msg = MIMEMultipart('alternative')
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = formataddr((str(Header(cfg.get('mail_from_name', ''), 'utf-8')), cfg['smtp_user']))
    msg['To'] = ', '.join(to_addrs)
    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    ctx = __import__('ssl').create_default_context()
    with smtplib.SMTP_SSL(cfg['smtp_host'], int(cfg.get('smtp_port', 465)), context=ctx, timeout=60) as s:
        s.login(cfg['smtp_user'], cfg['smtp_auth_code'])
        if dry_run_enabled():
            # 干跑刻意停在 sendmail 之前，但**保留连接与登录**：
            # 这样 SMTP host / 端口 / 账号 / 授权码的有效性都被真实验证，
            # 唯一被跳过的就是"投递"这个不可撤销的动作。
            stage_note('send', '本应向 %s 投递（已跳过）' % ', '.join(to_addrs))
            print('  [dry-run] SMTP 连接与登录成功，已跳过 sendmail')
            return False
        s.sendmail(cfg['smtp_user'], to_addrs, msg.as_string())
    return True


def main():
    preflight()   # 缺必需变量就在这里一次性报出并退出（不回落默认值）
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--test', action='store_true', help='send to sender itself with [测试] prefix')
    # --dry-run 由 preflight 层识别（它读 sys.argv）；脚本这里必须也声明，
    # 否则 argparse 会以 "unrecognized arguments: --dry-run" 直接报错退出。
    ap.add_argument('--dry-run', action='store_true',
                    help='连接并登录 SMTP 以验证配置，但不投递、不写 email_sent')
    ap.add_argument('--to', help='override recipient(s), comma separated')
    ap.add_argument('--report', help='specific report file')
    ap.add_argument('--force', action='store_true', help='send even if today already sent')
    args = ap.parse_args()

    with open(CONFIG_PATH, encoding='utf-8') as f:
        cfg = json.load(f)

    report = args.report or latest_report()
    if not report:
        print('no daily report found; nothing to send')
        sys.exit(1)

    date = os.path.basename(report).replace('daily-report-', '').replace('.md', '')
    today = datetime.date.today().isoformat()

    # 防重：该报告日期已发送过则跳过（23:59 任务只起草；次日 08:00 任务发送。
    # 注意：手动 --force 发送不写 email_sent，因此不会污染次日计划任务的判断）
    if not args.force:
        try:
            with open(os.path.join(_HERE, 'plans', 'seo-state.json'), encoding='utf-8') as f:
                st = json.load(f)
            if st.get('email_sent') == date:
                print('SKIP: %s 已发送过（email_sent=%s）' % (date, st.get('email_sent')))
                sys.exit(0)
        except Exception:
            pass

    md_body = open(report, encoding='utf-8').read()
    text_body = md_body + '\n\n— 本邮件由 Harness AI 自主完成'

    subject = '【SEO日报】%s 提交清单（Harness 自主完成）' % date

    if args.test:
        to_addrs = [cfg['smtp_user']]
        subject = '[测试] ' + subject
    elif args.to:
        to_addrs = [a.strip() for a in args.to.split(',') if a.strip()]
    else:
        to_addrs = [cfg['mail_to']]

    print('sending...')
    print('  to      :', to_addrs)
    print('  subject :', subject)
    print('  report  :', report)
    sent = send(subject, build_html(subject, md_body), text_body, to_addrs, cfg)
    if not sent:
        # 干跑：未投递，也不得写 email_sent（否则会骗过次日 08:00 的防重判断）
        print('[dry-run] 未投递，未写 email_sent。')
        return
    print('EMAIL SENT OK ✅')

    # 记录已发送日期（仅供次日 08:00 计划任务防重）。
    # --force / --test 为手动操作，不写入，避免污染自动任务状态。
    if not args.force:
        try:
            state_path = os.path.join(_HERE, 'plans', 'seo-state.json')
            with open(state_path, encoding='utf-8') as f:
                st = json.load(f)
            st['email_sent'] = date
            with open(write_path(state_path), 'w', encoding='utf-8') as f:
                json.dump(st, f, ensure_ascii=False, indent=2)
        except Exception:
            pass


if __name__ == '__main__':
    main()
