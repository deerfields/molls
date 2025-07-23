import crypto from 'crypto';
import axios, { AxiosRequestConfig } from 'axios';
import { IntegrationConfig, IntegrationLog } from '../../models/IntegrationConfig';

export abstract class IntegrationService {
  protected config: IntegrationConfig;
  protected logs: IntegrationLog[] = [];
  protected rateLimit: { max: number; windowMs: number; calls: number[] } = { max: 60, windowMs: 60000, calls: [] };

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  // --- OAUTH2 AUTHENTICATION ---
  async authenticateOAuth2(grantType: 'client_credentials' | 'authorization_code', options: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
    code?: string;
    redirectUri?: string;
    refreshToken?: string;
  }): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    try {
      let data: any;
      if (grantType === 'client_credentials') {
        data = {
          grant_type: 'client_credentials',
          client_id: options.clientId,
          client_secret: options.clientSecret,
          scope: options.scope,
        };
      } else if (grantType === 'authorization_code') {
        data = {
          grant_type: 'authorization_code',
          code: options.code,
          redirect_uri: options.redirectUri,
          client_id: options.clientId,
          client_secret: options.clientSecret,
        };
      } else if (grantType === 'refresh_token') {
        data = {
          grant_type: 'refresh_token',
          refresh_token: options.refreshToken,
          client_id: options.clientId,
          client_secret: options.clientSecret,
        };
      }
      const response = await axios.post(options.tokenUrl, new URLSearchParams(data), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      this.handleError(error, 'OAuth2 Authentication');
      throw error;
    }
  }

  async refreshTokenIfNeeded(): Promise<void> {
    if (!this.config.tokenExpiry || new Date() > this.config.tokenExpiry) {
      // Refresh token logic (assumes refresh token is present)
      const creds = this.getCredentials();
      if (!this.config.refreshToken) throw new Error('No refresh token available');
      const tokenData = await this.authenticateOAuth2('refresh_token', {
        tokenUrl: creds.tokenUrl,
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        refreshToken: this.config.refreshToken,
      });
      this.config.accessToken = tokenData.accessToken;
      this.config.refreshToken = tokenData.refreshToken;
      this.config.tokenExpiry = new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000);
      // TODO: Persist updated tokens to DB
      this.log('info', 'Refreshed OAuth2 token');
    }
  }

  // --- CREDENTIAL ENCRYPTION ---
  protected encryptCredential(value: string): string {
    const cipher = crypto.createCipher('aes-256-ctr', process.env.INTEGRATION_SECRET_KEY || 'integration-secret-key');
    let crypted = cipher.update(value, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }
  protected decryptCredential(value: string): string {
    const decipher = crypto.createDecipher('aes-256-ctr', process.env.INTEGRATION_SECRET_KEY || 'integration-secret-key');
    let dec = decipher.update(value, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }
  setCredentials(creds: Record<string, any>) {
    const str = JSON.stringify(creds);
    this.config['encryptedCredentials'] = this.encryptCredential(str);
  }
  getCredentials(): Record<string, any> {
    if (!this.config['encryptedCredentials']) return {};
    return JSON.parse(this.decryptCredential(this.config['encryptedCredentials']));
  }

  // --- API KEY MANAGEMENT ---
  setApiKey(key: string) {
    this.setCredentials({ ...this.getCredentials(), apiKey: this.encryptCredential(key) });
  }
  getApiKey(): string | undefined {
    const creds = this.getCredentials();
    return creds.apiKey ? this.decryptCredential(creds.apiKey) : undefined;
  }
  rotateApiKey(newKey: string) {
    this.setApiKey(newKey);
    this.log('info', 'API key rotated');
  }

  // --- CONNECTION HEALTH MONITORING ---
  async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();
      this.config.status = 'connected';
      this.log('info', 'Health check passed');
      return true;
    } catch (error) {
      this.config.status = 'error';
      this.handleError(error, 'Health check failed');
      return false;
    }
  }
  scheduleHealthChecks(intervalMs = 60000) {
    setInterval(() => this.healthCheck(), intervalMs);
  }

  // --- RATE LIMITING ---
  protected checkRateLimit() {
    const now = Date.now();
    this.rateLimit.calls = this.rateLimit.calls.filter(ts => now - ts < this.rateLimit.windowMs);
    if (this.rateLimit.calls.length >= this.rateLimit.max) {
      throw new Error('Rate limit exceeded');
    }
    this.rateLimit.calls.push(now);
  }

  // --- EXPONENTIAL BACKOFF & RETRY ---
  protected async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        this.checkRateLimit();
        return await fn();
      } catch (err) {
        lastError = err;
        this.log('warn', `Retry ${i + 1} failed`, err);
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
      }
    }
    this.handleError(lastError, 'Max retries reached');
    throw lastError;
  }

  // --- LOGGING & ERROR HANDLING ---
  protected log(level: 'info' | 'warn' | 'error', message: string, details?: any) {
    this.logs.push({ timestamp: new Date(), level, message, details });
    // TODO: Persist logs to DB or external logging service
    if (level === 'error') {
      console.error(`[Integration][${this.config.name}]`, message, details);
    } else {
      console.log(`[Integration][${this.config.name}]`, message, details);
    }
  }
  protected async handleError(error: any, context: string) {
    this.log('error', `${context}: ${error.message || error}`, error);
    // TODO: Add error tracking/reporting to IntegrationError model
    throw error;
  }

  // --- ABSTRACT METHODS ---
  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
} 