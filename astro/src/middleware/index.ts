import { defineMiddleware } from "astro:middleware";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../config/i18n.ts";
import { getCurrentLanguage } from "../utils/i18n.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies } = context;
  const currentLanguage = cookies.get("language")?.value as SupportedLanguage;

  const currentUrl = new URL(context.request.url);
  const currentPath = currentUrl.pathname;
  const pathLanguage = getCurrentLanguage(currentPath);

  if (currentLanguage && (!pathLanguage || pathLanguage !== currentLanguage)) {
    const cleanPath = currentPath.replace(
      new RegExp(`^/(${SUPPORTED_LANGUAGES.join("|")})?`),
      ""
    );
    currentUrl.pathname = `/${currentLanguage}${cleanPath}`;
    return Response.redirect(currentUrl.toString(), 302);
  }

  if (!currentLanguage && !pathLanguage) {
    currentUrl.pathname = `/en${currentPath}`;
    return Response.redirect(currentUrl.toString(), 302);
  }

  return next();
});
