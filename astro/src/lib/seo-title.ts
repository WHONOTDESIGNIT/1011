// seo-title — 全站统一 <title> 规范化（SEO 审计整改，2026-09-04）
//
// 目标：避免“单一单词 / 过短”标题。页面上层（pages / MDX / i18n 文案）仍只提供
// 页面专属标题，SeoHead 在最终渲染前调用 buildFinalTitle() 自动补全品牌尾缀，
// 统一收敛为「页面标题 | iShine」，并遵守 50–60 字符（含端点）目标区间：
//   - 标题已含品牌词（iShine，不区分大小写）→ 原样返回，防止重复补尾；
//   - 拼接后 ≤ TITLE_MAX(60) → 补 " | iShine"；
//   - 拼接后会超过 60 → 不补，保持原样（超长由 audit-titles 脚本标记，人工压缩）；
//   - 内部工具页（admin/upload）通过 SeoHead 的 appendBrand=false 关闭。
// 品牌尾缀不做本地化，全语言统一 "| iShine"（品牌词惯例不翻译）。
//
// 注意：scripts/audit-titles.mjs 不 import 本模块（Node 无法直接跑 TS），
// 改为扫描构建产物 dist/*.html 的 <title> 实测输出 + --preview 模式读取
// messages/MDX 源文本计算预期结果，判定阈值（TITLE_MIN/TITLE_MAX）与下方常量保持一致。

export const BRAND_SUFFIX = '| iShine';
/** 目标标题长度下限（含端点）：低于此值虽已带品牌，仍建议做关键词富化（需人工逐条确认文案） */
export const TITLE_MIN = 50;
/** 目标标题长度上限（含端点）：拼接结果不得超过该值，超出则放弃补尾避免被 SERP 截断 */
export const TITLE_MAX = 60;

const BRAND_RE = /ishine/i;

/**
 * 规范化页面标题。返回最终应写入 <title>/og:title/twitter:title 的字符串。
 * 永不返回 null/undefined（空输入返回 ''）。
 */
export function buildFinalTitle(title?: string | null): string {
  if (!title) return '';
  const cleaned = title.replace(/\s+/g, ' ').trim();
  // 已含品牌词（任意位置）→ 跳过，避免 “… | iShine | iShine”
  if (BRAND_RE.test(cleaned)) return cleaned;
  const candidate = `${cleaned} ${BRAND_SUFFIX}`;
  // 长度保护：补尾后仍在 TITLE_MAX 内才补
  if (candidate.length <= TITLE_MAX) return candidate;
  return cleaned;
}
