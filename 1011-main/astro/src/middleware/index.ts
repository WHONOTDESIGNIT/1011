import { defineMiddleware } from "astro:middleware";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../config/i18n.ts";
import { ensureTrailingSlash, needsTrailingSlash } from "../lib/url";

const LOCALE_PREFIX_REGEX = new RegExp(`^/(${SUPPORTED_LANGUAGES.join("|")})(/|$)`);

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, request } = context;
  const currentUrl = new URL(request.url);
  const currentPath = currentUrl.pathname;
  const normalizedPath = ensureTrailingSlash(currentPath);

  // Check if URL has a locale prefix
  const localeMatch = currentPath.match(LOCALE_PREFIX_REGEX);
  const pathLocale = localeMatch ? localeMatch[1] as SupportedLanguage : null;

  if (pathLocale) {
    if (needsTrailingSlash(currentPath)) {
      currentUrl.pathname = normalizedPath;
      return Response.redirect(currentUrl.toString(), 301);
    }

    // Has prefix → set cookie if missing, then pass through
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

  // No prefix → check cookie or Accept-Language
  const cookieLang = cookies.get("language")?.value as SupportedLanguage | undefined;

  if (cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang) && cookieLang !== "en") {
    // Non-English cookie → redirect to prefixed path
    currentUrl.pathname = ensureTrailingSlash(`/${cookieLang}${currentPath}`);
    return Response.redirect(currentUrl.toString(), 302);
  }

  // Check Accept-Language
  const acceptLanguage = request.headers.get("accept-language") || "";
  if (acceptLanguage) {
    const preferred = parseAcceptLanguage(acceptLanguage);
    for (const lang of preferred) {
      if (lang.startsWith("en")) break; // English → stay on root
      const match = SUPPORTED_LANGUAGES.find((l) => lang.startsWith(l));
      if (match && match !== "en") {
        currentUrl.pathname = ensureTrailingSlash(`/${match}${currentPath}`);
        cookies.set("language", match, {
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        return Response.redirect(currentUrl.toString(), 302);
      }
    }
  }

  // Default → pass through (root English page)
  cookies.set("language", "en", {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });

  if (needsTrailingSlash(currentPath)) {
    currentUrl.pathname = normalizedPath;
    return Response.redirect(currentUrl.toString(), 301);
  }

  return next();
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
