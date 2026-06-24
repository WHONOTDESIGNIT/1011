import { defineMiddleware } from "astro:middleware";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../config/i18n.ts";

const ROUTE_LANGUAGES = ["en", "es"] as const satisfies ReadonlyArray<SupportedLanguage>;
const ROUTE_LOCALE_PREFIX_REGEX = new RegExp(`^/(${ROUTE_LANGUAGES.join("|")})(/|$)`);
const SUPPORTED_LOCALE_PREFIX_REGEX = new RegExp(`^/(${SUPPORTED_LANGUAGES.join("|")})(/|$)`);

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, request } = context;
  const currentUrl = new URL(request.url);
  const currentPath = currentUrl.pathname;

  const anyLocaleMatch = currentPath.match(SUPPORTED_LOCALE_PREFIX_REGEX);
  const anyPathLocale = anyLocaleMatch ? (anyLocaleMatch[1] as SupportedLanguage) : null;
  if (anyPathLocale && !ROUTE_LANGUAGES.includes(anyPathLocale)) {
    const withoutPrefix = currentPath.replace(new RegExp(`^/${anyPathLocale}`), "") || "/";
    currentUrl.pathname = withoutPrefix;
    cookies.set("language", "en", {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    return redirectWithStatus(currentUrl.toString(), 302);
  }

  // Check if URL has a locale prefix
  const localeMatch = currentPath.match(ROUTE_LOCALE_PREFIX_REGEX);
  const pathLocale = localeMatch ? localeMatch[1] as SupportedLanguage : null;

  if (pathLocale) {
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

  if (cookieLang && ROUTE_LANGUAGES.includes(cookieLang) && cookieLang !== "en") {
    // Non-English cookie → redirect to prefixed path
    currentUrl.pathname = `/${cookieLang}${currentPath}`;
    return redirectWithStatus(currentUrl.toString(), 302);
  }

  // Check Accept-Language
  const acceptLanguage = request.headers.get("accept-language") || "";
  if (acceptLanguage) {
    const preferred = parseAcceptLanguage(acceptLanguage);
    for (const lang of preferred) {
      if (lang.startsWith("en")) break; // English → stay on root
      const match = SUPPORTED_LANGUAGES.find((l) => lang.startsWith(l));
      if (match && match !== "en" && ROUTE_LANGUAGES.includes(match)) {
        currentUrl.pathname = `/${match}${currentPath}`;
        cookies.set("language", match, {
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        return redirectWithStatus(currentUrl.toString(), 302);
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
  return next();
});

function redirectWithStatus(location: string, status: 301 | 302 | 307 | 308) {
  return new Response(null, {
    status,
    headers: {
      Location: location,
    },
  });
}

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
