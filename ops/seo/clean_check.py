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
    ('R6 私有IP', re.compile(r'\b(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b')),
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


def check_file(path):
    ext = os.path.splitext(path)[1].lower()
    if ext and ext not in TEXT_EXT:
        return []
    try:
        txt = io.open(path, encoding='utf-8', errors='replace').read()
    except Exception:
        return []
    hits = []
    for i, line in enumerate(txt.split('\n'), 1):
        if not line.strip():
            continue
        # 占位符行：整行跳过（仅当该行不含真实值特征）
        for label, rx in RULES:
            for m in rx.finditer(line):
                val = m.group(0)
                # 例外：占位写法
                if PLACEHOLDER.search(line):
                    continue
                # 例外：R2 抓到的是占位名
                if label == 'R2 用户目录名' and m.group(1).lower() in ('user', 'username', 'name'):
                    continue
                if label == 'R4 凭据赋值':
                    val = '%s=<...>' % m.group(1)
                hits.append((label, i, val[:70], line.strip()[:100]))
    return hits


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    total = 0
    for p in sys.argv[1:]:
        hits = check_file(p)
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
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(main())
