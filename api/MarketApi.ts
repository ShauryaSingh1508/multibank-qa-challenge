import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';
import type { BannersResponse, Instrument, PriceTick, WidgetCategory } from './types';

/** URL fragments shared with UI specs that intercept or wait for the same calls. */
export const MarketEndpoints = {
  widget: '/api/io/v1/market/widget',
  instruments: '/api/io/v1/market/instruments',
  banners: '/api/io/v1/resource/banners',
  prices: '/api/io/v1/marketdata/prices',
} as const;

/** Thin client for the public market-data APIs: the API-layer counterpart of a page object. */
export class MarketApi {
  constructor(private readonly request: APIRequestContext) {}

  widget(): Promise<APIResponse> {
    return this.request.get(`${env.coreApiUrl}${MarketEndpoints.widget}`);
  }

  instruments(): Promise<APIResponse> {
    return this.request.get(`${env.coreApiUrl}${MarketEndpoints.instruments}`);
  }

  banners(): Promise<APIResponse> {
    return this.request.get(`${env.coreApiUrl}${MarketEndpoints.banners}`);
  }

  prices(quote = 'USD'): Promise<APIResponse> {
    return this.request.get(`${env.marketDataApiUrl}${MarketEndpoints.prices}`, { params: { quote } });
  }

  async widgetJson(): Promise<WidgetCategory[]> {
    return (await this.widget()).json();
  }

  async instrumentsJson(): Promise<Instrument[]> {
    return (await this.instruments()).json();
  }

  async bannersJson(): Promise<BannersResponse> {
    return (await this.banners()).json();
  }

  async pricesJson(quote = 'USD'): Promise<PriceTick[]> {
    return (await this.prices(quote)).json();
  }
}
