// NOTE: Requires axios and @types/axios. Run: npm install axios @types/axios
import axios from 'axios';
import { logger } from '../utils/logger';

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const BASE_CURRENCY = 'AED';

interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

export class CurrencyService {
  private static cache: RateCache | null = null;
  private static lastBase: string = BASE_CURRENCY;

  static async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    await this.ensureRates(from);
    if (!this.cache || !this.cache.rates[to]) {
      logger.error('Exchange rate not found', { from, to });
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }
    return this.cache.rates[to];
  }

  static async convertAmount(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return +(amount * rate).toFixed(2);
  }

  private static async ensureRates(base: string) {
    const now = Date.now();
    if (
      this.cache &&
      this.lastBase === base &&
      now - this.cache.timestamp < CACHE_DURATION_MS
    ) {
      return;
    }
    try {
      // TODO: Replace with real API (e.g., exchangeratesapi.io, openexchangerates.org)
      // For now, mock rates
      const mockRates: Record<string, number> = {
        AED: 1,
        USD: 0.27,
        EUR: 0.25,
        GBP: 0.21
      };
      this.cache = { rates: mockRates, timestamp: now };
      this.lastBase = base;
      logger.info('Currency rates updated (mock)', { base, rates: mockRates });
      // Example for real API:
      // const res = await axios.get(`https://api.exchangeratesapi.io/latest?base=${base}`);
      // this.cache = { rates: res.data.rates, timestamp: now };
    } catch (error) {
      logger.error('Failed to fetch exchange rates', { error });
      throw new Error('Failed to fetch exchange rates');
    }
  }
} 