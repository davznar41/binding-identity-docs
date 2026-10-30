/** Prefix a site-local path with Astro's configured base; keep root URLs unchanged. */
export function joinBase(base: string, path: string): string {
  const prefix = base.replace(/^\/+|\/+$/g, '');
  return `${prefix ? `/${prefix}` : ''}/${path.replace(/^\/+/, '')}`;
}

export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}
