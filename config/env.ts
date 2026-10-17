import 'dotenv/config';

/**
 * Single source of truth for environment-specific values.
 * Every value can be overridden with an env var (or a local `.env` file) so the same
 * suite can point at staging, a different locale, or a mock server without code changes.
 */
export const env = {
  /** Public marketing site. `trade.multibank.io` now redirects to a login wall (see README > Assumptions). */
  baseUrl: process.env.BASE_URL ?? 'https://mb.io',
  /** Content is geo/locale dependent, so the locale is pinned rather than left to the server redirect. */
  locale: process.env.LOCALE ?? 'en-AE',
  coreApiUrl: process.env.CORE_API_URL ?? 'https://core-api.mb.io',
  marketDataApiUrl: process.env.MARKET_DATA_API_URL ?? 'https://mbg-market-data-service.mb.io',
  appSmartLink: process.env.APP_SMART_LINK ?? 'https://mbio.go.link/6OW91',
  tradeAppUrl: process.env.TRADE_APP_URL ?? 'https://trade.mb.io',
  legacyTradeUrl: process.env.LEGACY_TRADE_URL ?? 'https://trade.multibank.io',
  isCI: !!process.env.CI,
} as const;

/** Builds a locale-prefixed site path, e.g. `localePath('/explore')` -> `/en-AE/explore`. */
export function localePath(path = ''): string {
  const clean = path === '/' ? '' : path;
  return `/${env.locale}${clean}`;
}

/**
 * Locale-agnostic matcher for a site path. Lets assertions pass for `/en-AE/explore`,
 * `/en/explore` or `/ar-AE/explore`, so a runner in a different region does not fail on locale alone.
 */
export function localePathPattern(path = ''): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^/[a-z]{2}(-[A-Z]{2})?${escaped}/?$`);
}
