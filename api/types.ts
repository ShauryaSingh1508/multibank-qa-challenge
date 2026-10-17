/** Shapes of the public, unauthenticated endpoints the marketing site consumes. Only fields the suite relies on are typed. */

export interface WidgetCategory {
  id: string;
  name: string;
  highlighted: string[];
  items: string[];
}

export interface Instrument {
  code: string;
  displayName: string;
  symbol: string;
  type: string;
  image: string;
  tradeEnabled: boolean;
}

export interface PriceTick {
  timestamp: number;
  base: string;
  quote: string;
  close: number;
  changePercent: number;
  changePercentFormatted: string;
}

export interface MarketingBanner {
  type: string;
  imageUrl: string;
  cta: { action: string };
}

export interface BannersResponse {
  marketing: MarketingBanner[];
}
