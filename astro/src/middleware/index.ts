import { defineMiddleware } from "astro:middleware";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../config/i18n.ts";

const LOCALE_PREFIX_REGEX = new RegExp(`^/(${SUPPORTED_LANGUAGES.join("|")})(/|$)`);

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, request } = context;
  const currentUrl = new URL(request.url);
  const currentPath = currentUrl.pathname;

  // Check if path has a locale prefix by examining the actual URL
  const localeMatch = currentPath.match(LOCALE_PREFIX_REGEX);
  const pathLocale = localeMatch ? localeMatch[1] as SupportedLanguage : null;

  if (pathLocale) {
    // URL has a locale prefix → set cookie if missing, then pass through
    const cookieLang = cookies.get("language")?.value as SupportedLanguage | undefined;
    if (!cookieLang) {
      cookies.set("language", pathLocale, {
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }
    return next();
  }

  // URL has NO locale prefix → detect language and redirect
  const cookieLang = cookies.get("language")?.value as SupportedLanguage | undefined;

  if (cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang)) {
    if (cookieLang === "en") {
      // English cookie → redirect to /en/...
      currentUrl.pathname = `/en${currentPath === "/" ? "" : currentPath}`;
    } else {
      currentUrl.pathname = `/${cookieLang}${currentPath === "/" ? "" : currentPath}`;
    }
    return Response.redirect(currentUrl.toString(), 302);
  }

  // No cookie → check Accept-Language
  const acceptLanguage = request.headers.get("accept-language") || "";
  if (acceptLanguage) {
    const preferred = parseAcceptLanguage(acceptLanguage);
    for (const lang of preferred) {
      const match = SUPPORTED_LANGUAGES.find((l) => lang.startsWith(l));
      if (match) {
        currentUrl.pathname = `/${match}${currentPath === "/" ? "" : currentPath}`;
        return Response.redirect(currentUrl.toString(), 302);
      }
    }
  }

  // Default → redirect to /en
  currentUrl.pathname = `/en${currentPath === "/" ? "" : currentPath}`;
  return Response.redirect(currentUrl.toString(), 302);
});

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((entry) => {
      const [lang, q = "q=1"] = entry.trim().split(";");
      const quality = parseFloat(q.split("=")[1] || "1");
      return { lang: lang.trim(), quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.lang);
}
