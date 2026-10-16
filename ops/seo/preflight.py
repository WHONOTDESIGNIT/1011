# -*- coding: utf-8 -*-
"""preflight.py — 运维脚本统一的「配置解析 + 只读干跑」层。

**这是模式定义文件。** 新增运维脚本请照抄这里的用法，不要各写各的
（本文件与其使用者放在同一目录，直接 import preflight 即可）：

    from preflight import require_env, optional_env, dry_run_enabled, write_path, stage_note

    REPO_ROOT = require_env('DSH_REPO_ROOT')          # 缺了直接退出，不猜默认值
    TIMEOUT   = optional_env('DSH_TIMEOUT', '30')     # 有默认值的才用 optional_env

    写入前：  with open(write_path(STATE_FILE), 'w') as f: ...
    跑网络前：if dry_run_enabled(): return (False, 'DRY-RUN 跳过', 0)

设计要点（每条都有具体理由）
------------------------------------------------------------------
1. **缺变量即失败，不回落默认值。**
   静默默认值会让脚本在错误目录上跑出"看起来正常"的结果——比直接报错危险得多。
   报错信息里必须给出**变量名与用途**，否则三个月后没人知道要配什么。

2. **干跑必须无副作用，且这件事要可验证。**
   `--dry-run` 只打印不落盘、不发网络请求。验证方式不是读代码，而是
   跑完比对该目录下文件的 mtime——见 verify_readonly()。

3. **状态文件与站点清单的写入在干跑下重定向到 .dry-run/。**
   干跑的价值之一是能检查"本来会写出什么"，所以不是简单地禁止写，
   而是把写入重定向到一个可检视的暂存目录，同时保证**真实文件零改动**。

4. **读取仍走真实路径。** 干跑要基于真实输入才有意义；只让"写"改道。

反面教材（不要照抄这个形状）
------------------------------------------------------------------
`seo_daily.py` 里有这么一行：

    INDEXNOW_KEY = os.environ.get('INDEXNOW_KEY', '') or _load_key()

这是**静默回落**：环境变量没有就去读同目录的 `indexnow_key.txt`。
本例安全，因为回落目标是**只读文件**、读不到就返回 `''`、而且 IndexNow key
按协议**本来就要求公开部署在站点 `/{key}.txt`**，不是秘密。

但同一个形状用在**凭据类**配置上就是隐患——它会掩盖"没配置"这个事实，
让脚本拿着一个来源不明的值继续跑。所以：

  · 路径类 / 开关类 → 回落到"本地文件或合理默认值"可以接受；
  · **凭据类 → 必须 require_env，或用直接下标读配置（缺了即 KeyError），
    绝不用 `or` 串一个备用来源。** 参照 `seo_email_smtp.py` 的
    `cfg['smtp_auth_code']`：刻意不留 fallback，缺配置就响亮地失败。
"""
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))

# 干跑标记必须**早于**任何写入发生，所以在 import 时就确定，而不是等解析 argv。
DRY_RUN = '--dry-run' in sys.argv
STAGE_DIR = os.path.join(HERE, '.dry-run', time.strftime('%Y%m%d-%H%M%S')) if DRY_RUN else None

_MISSING = []


def _log(msg):
    sys.stderr.write('[preflight] %s\n' % msg)


def require_env(name, purpose=''):
    """取必需环境变量；缺失则记录并在 preflight 汇总后退出。"""
    val = os.environ.get(name, '').strip()
    if not val:
        _MISSING.append((name, purpose))
    return val


def optional_env(name, default=''):
    return (os.environ.get(name, '') or default).strip()


def preflight(dry_run_hint=True):
    """在 main() 开头调用：汇总所有缺失的必需变量并一次性报出。"""
    if _MISSING:
        _log('缺少必需的环境变量（不提供默认值，避免在错误路径上产生"看起来正常"的结果）：')
        for name, purpose in _MISSING:
            _log('  %-24s %s' % (name, purpose or ''))
        _log('')
        _log('  配置说明见 ops/seo/CONFIG.example.env')
        _log('  干跑（不写入、不发请求）可加 --dry-run，但仍需变量齐备才能验证逻辑')
        sys.exit(2)
    if DRY_RUN and dry_run_hint:
        _log('== DRY-RUN 模式：不写入真实文件、不发任何网络请求 ==')
        _log('   写入（如有）重定向至：%s' % STAGE_DIR)


def dry_run_enabled():
    return DRY_RUN


def stage_path(path):
    """把绝对路径映射到暂存目录下同名位置（保持末段文件名，便于对照）。"""
    if not DRY_RUN:
        return path
    return os.path.join(STAGE_DIR, os.path.basename(path))


def write_path(path):
    """写入用的路径：干跑下改道暂存目录，并自动建父目录。

    读取不要用这个函数——读取要基于真实输入。
    """
    if not DRY_RUN:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        return path
    out = stage_path(path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    return out


def write_dir(path):
    """确保某文件的父目录存在，返回该文件路径。

    专治一类易漏的 bug：脚本里"先 makedirs(OUT_DIR) 再 open(state)"的隐含顺序，
    一旦 state 被 write_path 改道到别的目录，父目录就没人建了 —— 干跑时报
    FileNotFoundError，而真实运行却正常。冒烟测试的价值正在于把它逼出来。
    任何要写的文件，先过 this 再 open，就不依赖调用顺序。
    """
    p = write_path(path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def stage_note(what, detail=''):
    """记录"本来会发生什么"，供干跑后检视。"""
    if not DRY_RUN:
        return
    os.makedirs(STAGE_DIR, exist_ok=True)
    with open(os.path.join(STAGE_DIR, 'would-do.log'), 'a', encoding='utf-8') as f:
        f.write('%-28s %s\n' % (what, detail))


def verify_readonly(paths, label=''):
    """冒烟验证：比对这些文件/目录的 mtime，确认干跑没有改动它们。

    这比"读代码确认没有副作用点"可靠——它不依赖你有没有想到全部副作用点。

    Returns (ok, changed_list)
    """
    def snapshot(p):
        snap = {}
        if os.path.isfile(p):
            snap[p] = os.path.getmtime(p)
        elif os.path.isdir(p):
            for root, dirs, files in os.walk(p):
                dirs[:] = [d for d in dirs if d not in ('.dry-run', '__pycache__', '.git')]
                for f in files:
                    fp = os.path.join(root, f)
                    try:
                        snap[fp] = os.path.getmtime(fp)
                    except OSError:
                        pass
        return snap

    before = {}
    for p in paths:
        before.update(snapshot(p))

    class _Ctx:
        def __enter__(self_inner):
            return self_inner

        def __exit__(self_inner, *exc):
            after = {}
            for p in paths:
                after.update(snapshot(p))
            changed = []
            for k in set(before) | set(after):
                if before.get(k) != after.get(k):
                    changed.append(k)
            ok = not changed
            print('[verify_readonly] %s %s' % (label, '无改动 ✅' if ok else '发现改动 ❌'))
            for c in sorted(changed):
                print('    改动: %s' % c)
            self_inner.ok = ok
            self_inner.changed = changed
            return False
    return _Ctx()
