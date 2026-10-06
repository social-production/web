/** The API sets the refresh cookie on `/auth`. Through the `/api` proxy that path is `/api/auth`. */
export function rewriteProxiedSetCookie(cookie: string): string {
  return cookie.replace(/(^|;\s*)Path=\/auth(?=;|$)/gi, '$1Path=/api/auth');
}
