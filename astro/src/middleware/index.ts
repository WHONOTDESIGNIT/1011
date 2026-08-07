import { defineMiddleware } from "astro:middleware";

const GENERIC_LOCALE_PREFIX_REGEX = /^\/([a-z]{2})(\/|$)/i;

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    return next();
  }

  const { cookies, request } = context;
  const currentUrl = new URL(request.url);
  const currentPath = currentUrl.pathname;

  const genericMatch = currentPath.match(GENERIC_LOCALE_PREFIX_REGEX);
  if (genericMatch) {
    const genericLocale = genericMatch[1];
    const withoutPrefix = currentPath.replace(new RegExp(`^/${genericLocale}`, "i"), "") || "/";
    if (withoutPrefix !== currentPath) {
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
  }

  const cookieLang = cookies.get("language")?.value;
  if (cookieLang !== "en") {
    cookies.set("language", "en", {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }
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
