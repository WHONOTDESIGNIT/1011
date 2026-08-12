import { defineMiddleware } from 'astro:middleware';

// 自定义逻辑（扩展点）：记录当前语言偏好 cookie。
// 为将来接入 Edge Function 地理检测（COUNTRY_LANGUAGE_MAP）预留位置。
//
// 注意：这里不使用 astro:i18n 的 `middleware()` —— 它仅在
// `i18n.routing.strategy = 'manual'` 时可用。当前采用默认策略，
// Astro 会自动把内置 i18n 中间件前置，负责语言 URL 校验、
// prefixDefaultLocale 与 fallback 处理；本文件只需做额外逻辑。
//
// 旧版「剥除 /xx/ 语言前缀 + 强制 language=en」的逻辑已移除——
// 2 位语言码（如 /tr/）的路由由官方 i18n 中间件接管。
const languagePreference = defineMiddleware(async (context, next) => {
  const response = await next();

  const currentLocale = context.currentLocale;
  if (currentLocale) {
    context.cookies.set('language', currentLocale, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  return response;
});

export const onRequest = languagePreference;
