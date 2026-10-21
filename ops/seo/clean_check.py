# 可复验的「干净」定义（clean-check）
#
# 存在的理由：此前把"干净"等同于"上一次扫描碰巧没命中"。结果 _bing_verify.py
# 里的盘符路径 `D:\...` 因为不在扫描模式里被误判为干净（"5 个干净"实为 3 个）。
# 依赖"上次扫过什么"是不可复验的；规则必须写成**能重复执行、结果可判定**的检查。
#
# 用法：  python clean_check.py <文件或目录> [更多路径...]
#         python clean_check.py ops/seo            # 检查一个目录
#         python clean_check.py ops/seo/*.py      # 检查若干文件
# 退出码：0 = 全部通过；1 = 有命中
#
# 判定规则（任一命中即"不干净"）：
#   R1 绝对路径：盘符（C:\ / D:/）、UNC（\\server\share）、POSIX 根（/home/、/Users/）
#   R2 用户名占位：C:\Users\<name> 中的 <name>，排除 <user>/<用户名> 这类占位写法
#   R3 凭据形态：AWS AKIA、PEM 私钥、GitHub/Slack/OpenAI token、Bearer、JWT、长 base64
#   R4 凭据赋值：password/secret/token/api_key/auth_code = "实际值"
#   R5 联系信息：邮箱、中国手机号
#   R6 内网地址：10./172.16-31./192.168. 私有 IP
#
# 例外（明确白名单，避免假阳性）：
#   · 占位符 C:\Users\<user>、C:\Users\<用户名>
#   · 以 .example/.sample 结尾的配置文件
#   · 英文单词中的 mark（trademark / device mark / watermark）—— R2 用
#     `C:\Users\` 前缀或独立单词边界限定，不做裸词匹配
import io
import os
import re
import sys

PLACEHOLDER = re.compile(r'<\s*(user|username|用户名|name|占位)\s*>', re.I)
# RFC 2606 / RFC 6761 保留的示例域名：模板里用它当占位是标准做法，不是真实联系信息。
EXAMPLE_DOMAIN = re.compile(r'@(?:example\.(?:com|org|net)|example|invalid|test|localhost)$', re.I)

RULES = [
    ('R1 绝对路径',
     re.compile(r'(?<![A-Za-z0-9])(?:[A-Za-z]:[\\/][^\s"\')]*|\\\\[A-Za-z0-9._-]+\\[^\s"\')]*|/(?:home|Users)/[A-Za-z0-9._-]+[^\s"\')]*)')),
    ('R2 用户目录名',
     re.compile(r'(?i)C:[\\/]+Users[\\/]+([A-Za-z0-9._-]+)')),
    ('R3 凭据形态-AWS', re.compile(r'AKIA[0-9A-Z]{16}')),
    ('R3 凭据形态-PEM', re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----')),
    ('R3 凭据形态-GitHub', re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}')),
    ('R3 凭据形态-Slack', re.compile(r'\bxox[baprs]-[A-Za-z0-9-]{10,}')),
    ('R3 凭据形态-OpenAI', re.compile(r'\bsk-[A-Za-z0-9]{20,}')),
    ('R3 凭据形态-Bearer', re.compile(r'(?i)\bBearer\s+[A-Za-z0-9._\-]{12,}')),
    ('R3 凭据形态-JWT', re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}')),
    ('R3 长base64', re.compile(r'["\']([A-Za-z0-9+/]{40,}={0,2})["\']')),
    ('R4 凭据赋值',
     re.compile(r'(?i)\b(password|passwd|secret|token|api[_-]?key|apikey|auth[_-]?code)\b\s*[:=]\s*["\']([^"\']{6,})["\']')),
    ('R5 邮箱', re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')),
    ('R5 手机号', re.compile(r'(?<!\d)1[3-9]\d{9}(?!\d)')),
    # 修正（2026-10-20）：原正则的 10 分支只有 3 段（\b10\.\d{1,3}\.\d{1,3}\b 的等效写法），
    # 于是 package.json 里的版本号 "^10.7.6" 被当成私有 IP 拦截 —— 任何改 package.json 的提交
    # 都会被自己的规则挡住。真实 10/8 地址是 4 段，改为统一 4 段匹配：10.0.0.1 仍被抓，
    # 10.7.6 这类语义化版本不再误伤。
    ('R6 私有IP', re.compile(r'\b(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b')),
]

TEXT_EXT = {'.py', '.mjs', '.js', '.ps1', '.ts', '.md', '.txt', '.json', '.yml', '.yaml',
            '.toml', '.env', '.example', '.cfg', '.ini', '.sh', '.bat'}


def iter_files(paths):
    for p in paths:
        if os.path.isfile(p):
            yield p
        elif os.path.isdir(p):
            for root, dirs, files in os.walk(p):
                dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '__pycache__')]
                for f in files:
                    yield os.path.join(root, f)


# 路径级例外：收窄到「文件 + 规则 + 具体值」三级，不是给整个文件开通行证。
#
# 背景：astro/public/llms.txt 的职责之一就是公开联系方式（维护者、访客预约、正式联系），
# R5 邮箱规则在这个文件上必然命中，结果是任何触碰该文件的提交都只能 --no-verify ——
# 而一条总被绕过的规则比没有规则更糟（本仓库 pre-commit 头部的原话）。
#
# 为什么不给整个文件放行：那会放过将来往同一文件里夹带的其他邮箱。
# 为什么不按规则放行：那会让 llms.txt 里的机器路径、凭据等其余规则一起失效。
# 因此只放行**已声明的这个值**，其余规则与其余邮箱照常检查。
PATH_VALUE_ALLOW = {
    'astro/public/llms.txt': {
        'R5 邮箱': {'service@ishineco.com'},
    },
    # 本规则文件自身：白名单必须把要放行的值原样写在代码里，否则无法匹配。
    # 只放行这一个值，本文件里的其他内容（路径、凭据等）照常受其余规则约束。
    'ops/seo/clean_check.py': {
        'R5 邮箱': {'service@ishineco.com', 'john@company.com', 'mario@azienda.com'},
    },
    # 翻译文件同理（2026-10-20 增）：站点公示的联系邮箱本就出现在产品与联系文案里，
    # 每次改 messages/*.json 都会被 R5 拦住 —— 结果只能是 --no-verify，规则形同虚设。
    # 键以 '/' 结尾表示目录前缀匹配；仍只放行这一个值，其余邮箱与规则照常检查。
    'astro/messages/': {
        # service@：站点公示联系邮箱；john@company.com：联系表单的输入占位符（非真实地址，
        # 也不在 RFC 2606 的 example.com 豁免名单内，故显式声明）。
        # mario@azienda.com（2026-10-21 增）：意大利语版联系表单的输入占位符，同一用途，
        # 此前未声明，导致任何触碰 it.json 的提交都会被拦（改保修期的那次就是这样撞上的）。
        'R5 邮箱': {'service@ishineco.com', 'john@company.com', 'mario@azienda.com'},
    },
}


def check_file(path, rules=None):
    ext = os.path.splitext(path)[1].lower()
    if ext and ext not in TEXT_EXT:
        return []
    try:
        txt = io.open(path, encoding='utf-8', errors='replace').read()
    except Exception:
        return []
    rules = rules if rules is not None else RULES
    rel_path = path.replace('\\', '/')
    allow_by_rule = None
    for allowed_rel, mapping in PATH_VALUE_ALLOW.items():
        # 以 '/' 结尾的键按目录前缀匹配（如 'messages/'），其余按文件精确匹配
        if allowed_rel.endswith('/'):
            matched = rel_path.startswith(allowed_rel)
        else:
            matched = rel_path == allowed_rel or rel_path.endswith('/' + allowed_rel)
        if matched:
            allow_by_rule = mapping
            break
    # 自我引用豁免：本文件的注释里必然列出规则本身的字面量，否则无法说明规则内容。
    # 只豁免"定义规则用的注释行"（含 R1/R2… 编号或规则术语），不笼统豁免所有注释——
    # 代码注释里出现的真实绝对路径仍应被抓到。
    RULE_DOC = re.compile(r'#\s*R\d|规则|占位|裸词匹配|盘符|UNC')
    hits = []
    for i, line in enumerate(txt.split('\n'), 1):
        if not line.strip():
            continue
        if line.lstrip().startswith('#') and RULE_DOC.search(line):
            continue
        # 占位符行：整行跳过（仅当该行不含真实值特征）
        for label, rx in rules:
            for m in rx.finditer(line):
                val = m.group(0)
                # 例外：路径级放行（文件 + 规则 + 具体值）。只跳过声明的那个值。
                if allow_by_rule:
                    allowed_vals = allow_by_rule.get(label)
                    if allowed_vals and val in allowed_vals:
                        continue
                # 例外：占位写法
                if PLACEHOLDER.search(line):
                    continue
                # 例外：R2 抓到的是占位名
                if label == 'R2 用户目录名' and m.group(1).lower() in ('user', 'username', 'name'):
                    continue
                # 例外：R5 邮箱命中 RFC 2606 保留的示例域名（模板占位）
                if label.startswith('R5 邮箱') and EXAMPLE_DOMAIN.search(val):
                    continue
                if label == 'R4 凭据赋值':
                    val = '%s=<...>' % m.group(1)
                hits.append((label, i, val[:70], line.strip()[:100]))
    return hits


def git_files(args):
    """git 取文件列表，用于增量扫描。

    只扫改动文件是刻意的：全量扫描会拖慢每次提交，最终结果是大家开始加
    --no-verify，规则形同虚设。
    """
    import subprocess
    try:
        if '--staged' in args:
            out = subprocess.run(['git', 'diff', '--cached', '--name-only', '--diff-filter=ACM'],
                                 capture_output=True, text=True, encoding='utf-8').stdout
        else:
            base = args[args.index('--changed') + 1]
            out = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=ACM', base],
                                 capture_output=True, text=True, encoding='utf-8').stdout
    except Exception as e:
        print('git 取文件失败: %r' % (e,))
        return []
    return [l.strip() for l in out.splitlines() if l.strip()]


def main():
    argv = sys.argv[1:]
    allow_emails = '--allow-emails' in argv
    argv = [a for a in argv if a != '--allow-emails']

    paths = []
    if '--staged' in argv or '--changed' in argv:
        paths = git_files(argv)
        # 增量模式：没有改动就算通过
        if not paths:
            print('无改动文件，通过。')
            return 0
    else:
        paths = [a for a in argv if not a.startswith('--')]

    if not paths:
        print(__doc__)
        return 2

    # R5 邮箱例外：某些公开商务邮箱（如官网已列出的联系邮箱）本就允许出现在代码里。
    # 不默认放行——需要显式 --allow-emails，避免"顺手把所有邮箱都放过"。
    rules = [(l, rx) for (l, rx) in RULES if not (allow_emails and l.startswith('R5 邮箱'))]

    total = 0
    for p in paths:
        hits = check_file(p, rules)
        if hits:
            total += len(hits)
            print('--- %s : %d 处命中 ---' % (p, len(hits)))
            for label, ln, val, ctx in hits:
                print('  [%-16s] L%-5d %s' % (label, ln, val))
                print('        │ %s' % ctx)
        else:
            print('%-56s 通过' % os.path.basename(p))
    print()
    print('合计命中: %d' % total)
    if allow_emails:
        print('（注意：本次已放行 R5 邮箱规则）')
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(main())
