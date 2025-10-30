export function getRouterBasename(rawBaseUrl: string | undefined): string | undefined {
  if (!rawBaseUrl) {
    return undefined;
  }

  const trimmed = rawBaseUrl.trim();
  if (trimmed === '' || trimmed === '/' || trimmed === './') {
    return undefined;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (withoutTrailingSlash === '' || withoutTrailingSlash === '/') {
    return undefined;
  }

  const normalized = withoutTrailingSlash.startsWith('/')
    ? withoutTrailingSlash
    : `/${withoutTrailingSlash.replace(/^\/+/, '')}`;

  return normalized === '/' ? undefined : normalized;
}

