import { defineMiddleware } from "astro:middleware";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../config/i18n.ts";
import { getCurrentLanguage } from "../utils/i18n.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies } = context;
  const currentLanguage = cookies.get("language")?.value as SupportedLanguage | undefined;

  const currentUrl = new URL(context.request.url);
  const currentPath = currentUrl.pathname;
  const pathLanguage = getCurrentLanguage(currentPath);

  // No cookie and no path language → root English page, just pass through
  if (!currentLanguage && !pathLanguage) {
    return next();
  }

  // Cookie exists but path has no language prefix
  if (currentLanguage && !pathLanguage) {
    // If cookie says English and no prefix → that's correct, pass through
    if (currentLanguage === "en") {
      return next();
    }
    // Non-English cookie, no prefix → redirect to add prefix
    currentUrl.pathname = `/${currentLanguage}${currentPath}`;
    return Response.redirect(currentUrl.toString(), 302);
  }

  // Both cookie and path language exist but mismatch
  if (currentLanguage && pathLanguage && currentLanguage !== pathLanguage) {
    if (pathLanguage === "en") {
      // Path has English but cookie says non-English → redirect to non-English prefix
      const cleanPath = currentPath.replace(/^\/en(\/|$)/, "/");
      currentUrl.pathname = `/${currentLanguage}${cleanPath}`;
    } else if (currentLanguage === "en") {
      // Cookie says English but path has non-English prefix → strip prefix
      const cleanPath = currentPath.replace(
        new RegExp(`^/(${SUPPORTED_LANGUAGES.join("|")})`),
        ""
      );
      currentUrl.pathname = cleanPath || "/";
    } else {
      // Both non-English but different → replace prefix
      const cleanPath = currentPath.replace(/^\/[^\/]+/, "");
      currentUrl.pathname = `/${currentLanguage}${cleanPath}`;
    }
    return Response.redirect(currentUrl.toString(), 302);
  }

  // Path has non-English prefix but no cookie yet → set cookie and pass through
  if (pathLanguage && !currentLanguage && pathLanguage !== "en") {
    cookies.set("language", pathLanguage, {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  return next();
});
