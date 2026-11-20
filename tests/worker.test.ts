import { describe, it, expect } from 'vitest';
import worker from '../worker/index';
import type { Env } from '../worker/types';

describe('Cloudflare Worker API Routes (worker/index.ts)', () => {
  const mockEnv: Env = {
    APP_ID: 'sunshade-learn',
    APP_NAME: 'Blueprint Academy',
    INTERNAL_HEALTH_TOKEN: 'secret-health-token-999',
    ASSETS: {
      fetch: async (_req: Request) => new Response('mock-static-asset', { status: 200 }),
    },
  };

  const mockCtx = {} as ExecutionContext;

  it('GET /api/health returns 200 OK with standardized discovery payload and security headers', async () => {
    const request = new Request('https://learn.sunshade.icu/api/health', {
      method: 'GET',
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(200);

    // Verify standardized health contract
    const data = await response.json() as { status: string; appId: string; uptime: number };
    expect(data.status).toBe('ok');
    expect(data.appId).toBe('sunshade-learn');
    expect(typeof data.uptime).toBe('number');

    // Verify mandatory security headers
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('GET /api/health includes detailed metrics when internal token is provided', async () => {
    const request = new Request('https://learn.sunshade.icu/api/health', {
      method: 'GET',
      headers: {
        'x-internal-health-token': 'secret-health-token-999',
      },
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(200);

    const data = await response.json() as Record<string, unknown>;
    expect(data.status).toBe('ok');
    expect(data.appName).toBe('Blueprint Academy');
    expect(data.environment).toBe('production');
    expect(data.nodeCompat).toBe(true);
  });

  it('GET /api/learn/export blocks unauthenticated calls with 401', async () => {
    const request = new Request('https://learn.sunshade.icu/api/learn/export', {
      method: 'GET',
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(401);

    const data = await response.json() as { error: string };
    expect(data.error).toMatch(/Unauthorized/);
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
  });

  it('POST /api/learn/check blocks unauthenticated calls with 401', async () => {
    const request = new Request('https://learn.sunshade.icu/api/learn/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', itemId: 'fake-id' }),
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(401);
  });

  it('DELETE /api/learn/ledger blocks unauthenticated calls with 401', async () => {
    const request = new Request('https://learn.sunshade.icu/api/learn/ledger', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE_MY_LEDGER' }),
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(401);
  });

  it('Delegates static requests to env.ASSETS with security headers', async () => {
    const request = new Request('https://learn.sunshade.icu/', {
      method: 'GET',
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('mock-static-asset');
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
  });
});
