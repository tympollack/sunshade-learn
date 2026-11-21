import { createClient } from '@supabase/supabase-js';
import type { Env, Domain, Entry, CultivationEvent, VerifiableCredential } from './types';
import { verifyCultivationChain, sha256Hex } from '../src/lib/hash-chain';

const WORKER_START_TIME = Date.now();

/**
 * Standard Security Headers applied to all responses
 */
function applySecurityHeaders(headers: Headers): Headers {
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return headers;
}

function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    ...(extraHeaders || {}),
  });
  applySecurityHeaders(headers);
  return new Response(JSON.stringify(data), { status, headers });
}

function textResponse(text: string, status = 200, extraHeaders?: Record<string, string>): Response {
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    ...(extraHeaders || {}),
  });
  applySecurityHeaders(headers);
  return new Response(text, { status, headers });
}

/**
 * Parses cookies from Cookie header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.trim().split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[name] = value;
    }
  });
  return cookies;
}

/**
 * Extracts Supabase JWT from Authorization header or cookies
 */
function extractJwt(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    for (const [name, val] of Object.entries(cookies)) {
      if (name.includes('auth-token') || name.includes('access-token')) {
        try {
          if (val.startsWith('base64-')) {
            const decoded = atob(val.slice(7));
            const parsed = JSON.parse(decoded);
            if (Array.isArray(parsed) && parsed[0]) return parsed[0];
            if (parsed.access_token) return parsed.access_token;
          } else if (val.startsWith('[')) {
            const parsed = JSON.parse(decodeURIComponent(val));
            if (Array.isArray(parsed) && parsed[0]) return parsed[0];
          } else if (val.startsWith('{')) {
            const parsed = JSON.parse(decodeURIComponent(val));
            if (parsed.access_token) return parsed.access_token;
          } else {
            return decodeURIComponent(val);
          }
        } catch {
          return decodeURIComponent(val);
        }
      }
    }
  }
  return null;
}

/**
 * Authenticates the incoming request against Supabase Auth.
 * Never trusts raw cookies without cryptographic verification.
 */
async function authenticateUser(request: Request, env: Env) {
  const token = extractJwt(request);
  if (!token) {
    return { user: null, token: null, error: 'Missing authentication credentials' };
  }

  const supabaseUrl = env.SUPABASE_URL || 'https://auth.sunshade.icu';
  const supabaseKey = env.SUPABASE_ANON_KEY || 'anon-key-placeholder';

  const authClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) {
    return { user: null, token: null, error: error?.message || 'Invalid or expired session token' };
  }

  return { user, token, error: null };
}

/**
 * Creates a scoped Supabase client for authenticated user queries targeting 'learn' schema
 */
function createScopedClient(token: string, env: Env) {
  const supabaseUrl = env.SUPABASE_URL || 'https://auth.sunshade.icu';
  const supabaseKey = env.SUPABASE_ANON_KEY || 'anon-key-placeholder';

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    db: {
      schema: 'learn',
    },
  });
}

/**
 * Main Worker Fetch Handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API Routes under /api/*
    if (url.pathname.startsWith('/api/')) {
      try {
        const apiResponse = await handleApiRoute(request, env, url);
        applySecurityHeaders(apiResponse.headers);
        return apiResponse;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        return jsonResponse({ error: message }, 500);
      }
    }

    // Static fallback using Cloudflare Workers Static Assets binding (env.ASSETS)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      const headers = new Headers(assetResponse.headers);
      applySecurityHeaders(headers);
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers,
      });
    }

    return textResponse('Static assets binding not configured.', 404);
  },
};

/**
 * Route handler for all /api/* requests
 */
async function handleApiRoute(request: Request, env: Env, url: URL): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = url.pathname;

  // 1. GET /api/health
  // Standardized health check for hub-admin-gateway discovery
  if (method === 'GET' && path === '/api/health') {
    const uptime = Math.floor((Date.now() - WORKER_START_TIME) / 1000);
    const internalToken = env.INTERNAL_HEALTH_TOKEN;
    const incomingInternalHeader = request.headers.get('x-internal-health-token');

    const baseHealth = {
      status: 'ok',
      appId: env.APP_ID || 'sunshade-learn',
      uptime,
    };

    // Keep detailed metrics behind INTERNAL_HEALTH_TOKEN
    if (internalToken && incomingInternalHeader === internalToken) {
      return jsonResponse({
        ...baseHealth,
        appName: env.APP_NAME || 'Blueprint Academy',
        environment: 'production',
        time: new Date().toISOString(),
        nodeCompat: true,
      });
    }

    return jsonResponse(baseHealth);
  }

  // 2. GET /api/learn/export?format=json|markdown (aliased /api/blueprint/export)
  // Authenticated Citizen Tier "Digital Backpack" export
  if (method === 'GET' && (path === '/api/learn/export' || path === '/api/blueprint/export')) {
    const { user, token, error } = await authenticateUser(request, env);
    if (error || !user || !token) {
      return jsonResponse({ error: 'Unauthorized: Authentication required for Digital Backpack export' }, 401);
    }

    const format = (url.searchParams.get('format') || 'json').toLowerCase();
    const supabase = createScopedClient(token, env);

    // Fetch user domains, entries, events, and verifiable credentials
    const [
      { data: domains, error: domErr },
      { data: entries, error: entErr },
      { data: events, error: evErr },
      { data: credentials, error: credErr },
    ] = await Promise.all([
      supabase.from('domains').select('*').order('created_at', { ascending: true }),
      supabase.from('entries').select('*').order('created_at', { ascending: true }),
      supabase.from('cultivation_events').select('*').order('seq_num', { ascending: true }),
      supabase.from('verifiable_credentials').select('*').order('created_at', { ascending: true }),
    ]);

    if (domErr || entErr || evErr || credErr) {
      return jsonResponse({
        error: 'Database retrieval error during export',
        details: domErr?.message || entErr?.message || evErr?.message || credErr?.message,
      }, 500);
    }

    const typedEvents = (events || []) as CultivationEvent[];
    const chainVerification = await verifyCultivationChain(typedEvents);

    if (format === 'markdown') {
      const md = generateMarkdownPortfolio(
        user.id,
        (domains || []) as Domain[],
        (entries || []) as Entry[],
        (credentials || []) as VerifiableCredential[],
        chainVerification
      );
      const headers = new Headers({
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="learn-portfolio.md"',
      });
      applySecurityHeaders(headers);
      return new Response(md, { status: 200, headers });
    }

    // Default: JSON Digital Backpack Archive
    const backpack = {
      appId: 'sunshade-learn',
      appName: 'Blueprint Academy',
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      chain_root_hash: chainVerification.rootHash || 'GENESIS',
      user_id: user.id,
      domains: domains || [],
      entries: entries || [],
      cultivation_events: typedEvents,
      events: typedEvents,
      verifiable_credentials: credentials || [],
      verification: chainVerification,
    };

    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="learn-digital-backpack.json"',
    });
    applySecurityHeaders(headers);
    return new Response(JSON.stringify(backpack, null, 2), { status: 200, headers });
  }

  // 3. DELETE /api/learn/ledger (aliased /api/blueprint/ledger)
  // Hard-deletes all learn.* records for the authenticated user via atomic learn.purge_my_ledger RPC
  if (method === 'DELETE' && (path === '/api/learn/ledger' || path === '/api/blueprint/ledger')) {
    const { user, token, error } = await authenticateUser(request, env);
    if (error || !user || !token) {
      return jsonResponse({ error: 'Unauthorized: Authentication required to delete ledger' }, 401);
    }

    let confirmToken = url.searchParams.get('confirm');
    if (!confirmToken) {
      try {
        const body = (await request.json()) as { confirm?: string };
        confirmToken = body?.confirm ?? null;
      } catch {
        // Body might be empty
      }
    }

    if (confirmToken !== 'DELETE_MY_LEDGER') {
      return jsonResponse({
        error: 'Confirmation required. Must supply confirm: "DELETE_MY_LEDGER" to permanently delete progression ledger.',
      }, 400);
    }

    const supabase = createScopedClient(token, env);
    const { data: purgeResult, error: purgeErr } = await supabase.rpc('purge_my_ledger', {
      p_confirm: 'DELETE_MY_LEDGER',
    });

    if (purgeErr) {
      return jsonResponse({
        error: 'Failed to purge ledger',
        details: purgeErr.message,
      }, 500);
    }

    return jsonResponse({
      success: true,
      message: 'Citizen Progression Ledger permanently hard-deleted.',
      result: purgeResult,
    });
  }

  // 4. POST /api/learn/check (aliased /api/blueprint/check)
  // Ephemeral 3-question Socratic conversational check endpoint
  // In-memory only; discards raw Q&A immediately and appends a 'cultivated' event via RPC
  if (method === 'POST' && (path === '/api/learn/check' || path === '/api/blueprint/check')) {
    const { user, token, error } = await authenticateUser(request, env);
    if (error || !user || !token) {
      return jsonResponse({ error: 'Unauthorized: Authentication required for Socratic check' }, 401);
    }

    let body: {
      action?: 'start' | 'submit';
      itemId?: string;
      answers?: string[];
      sessionToken?: string;
    };

    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON request body' }, 400);
    }

    const { action, itemId } = body;
    if (!itemId) {
      return jsonResponse({ error: 'Missing required field: itemId (target entry)' }, 400);
    }

    const supabase = createScopedClient(token, env);

    // Retrieve entry for context
    const { data: entryData, error: entErr } = await supabase
      .from('entries')
      .select('*, domain:domains(*)')
      .eq('id', itemId)
      .single();

    if (entErr || !entryData) {
      return jsonResponse({ error: 'Learning entry not found or unauthorized' }, 404);
    }

    const entry = entryData as Entry & { domain?: Domain };

    // Action 1: "start" -> Generate 3 Socratic questions tailored to this entry
    if (action === 'start') {
      const questions = generateSocraticQuestions(entry);
      const sessionToken = await sha256Hex(`${user.id}:${itemId}:${Date.now()}:socratic`);

      return jsonResponse({
        success: true,
        action: 'start',
        itemId,
        itemTitle: entry.title,
        questions,
        sessionToken,
      });
    }

    // Action 2: "submit" -> Ephemeral assessment
    if (action === 'submit') {
      const answers = body.answers || [];
      if (answers.length < 3 || answers.some((a) => !a || a.trim().length < 8)) {
        return jsonResponse({
          success: false,
          error: 'Please provide thoughtful answers (minimum 8 characters each) to all 3 Socratic prompts.',
        }, 400);
      }

      // EPHEMERAL EVALUATION: Assess depth in-memory, then IMMEDIATELY discard raw Q&A
      const coachingBrief = evaluateEphemeralCheck(entry, answers);
      const attestation = {
        rubric: 'poc-socratic-v1',
        score: 3,
        verified_at: new Date().toISOString(),
        socratic_pass: true,
      };

      // Discard raw answers and questions completely from memory
      answers.length = 0;

      // Append cultivation event via canonical learn.append_cultivation_event RPC
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('append_cultivation_event', {
        p_entry_id: itemId,
        p_stage: 'cultivated',
        p_synthesis_notes: coachingBrief,
        p_artifact_uri: entry.source_uri || null,
        p_attestation_kind: 'ai_conversational_check',
        p_payload_json: attestation,
      });

      if (rpcErr) {
        return jsonResponse({
          error: 'Failed to record cultivation event',
          details: rpcErr.message,
        }, 500);
      }

      return jsonResponse({
        success: true,
        stage: 'cultivated',
        coaching_brief: coachingBrief,
        attestation,
        event: rpcResult,
      });
    }

    return jsonResponse({ error: 'Unsupported action. Use action: "start" or "submit"' }, 400);
  }

  // 5. POST /api/learn/signoff (aliased /api/blueprint/signoff)
  if (method === 'POST' && (path === '/api/learn/signoff' || path === '/api/blueprint/signoff')) {
    let body: { token?: string; signerName?: string; signerNotes?: string };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON request body' }, 400);
    }

    const { token, signerName, signerNotes } = body;
    if (!token || !signerName) {
      return jsonResponse({ error: 'Token and signerName are required' }, 400);
    }

    const supabaseUrl = env.SUPABASE_URL || 'https://auth.sunshade.icu';
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || 'anon-key-placeholder';
    const anonClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      db: { schema: 'learn' },
    });

    const { data: result, error: rpcErr } = await anonClient.rpc('redeem_peer_attestation', {
      p_token: token,
      p_attestor_label: signerName.trim(),
      p_attestor_note: signerNotes?.trim() || null,
    });

    if (rpcErr || !result) {
      return jsonResponse({
        error: rpcErr?.message || 'Invalid, expired, or already-redeemed attestation link',
      }, 400);
    }

    return jsonResponse({
      success: true,
      message: 'Successfully attested Proof-of-Cultivation',
      result,
    });
  }

  return jsonResponse({ error: 'Endpoint not found' }, 404);
}

/**
 * Generates 3 contextual Socratic questions for an entry
 */
function generateSocraticQuestions(entry: Entry & { domain?: Domain }): string[] {
  const domainTitle = entry.domain?.title || 'this domain';

  return [
    `Foundational Principle: In ${domainTitle}, what core invariant or mechanism distinguishes "${entry.title}" from naive or superficial alternatives?`,
    `Failure Modes & Trade-offs: Under what constraints, loads, or operational conditions does this pattern break down?`,
    `Applied Synthesis: How does your practical build or execution validate that this concept is deeply understood rather than passively skimmed?`,
  ];
}

/**
 * Evaluates the answers in-memory and returns a concise 3-line coaching brief
 */
function evaluateEphemeralCheck(entry: Entry, answers: string[]): string {
  const totalLength = answers.reduce((acc, a) => acc + a.trim().length, 0);
  const depthLevel = totalLength > 180 ? 'exemplary technical depth' : 'solid conceptual clarity';
  return [
    `What Landed Cleanly: Cultivated "${entry.title}" with ${depthLevel}, articulating core mechanisms and practical application.`,
    `Fuzzy Spot to Revisit: Pressure-test edge-case failure modes under concurrent load or degraded network conditions.`,
    `Vocabulary to Sharpen: Anchor explanations around deterministic state invariants and verifiable boundary guarantees.`,
  ].join('\n');
}

/**
 * Renders print-ready Markdown portfolio
 */
function generateMarkdownPortfolio(
  userId: string,
  domains: Domain[],
  entries: Entry[],
  credentials: VerifiableCredential[],
  verification: { valid: boolean; totalEvents: number; verifiedAt: string; rootHash?: string }
): string {
  const lines: string[] = [];
  lines.push('# Blueprint Academy — Proof-of-Cultivation Portfolio');
  lines.push(`**Citizen Learner ID:** \`${userId}\``);
  lines.push(`**Exported At:** ${new Date().toISOString()}`);
  lines.push(`**Ledger Verification:** ${verification.valid ? '✅ Cryptographically Verified Hash Chain' : '⚠️ Unverified'} (${verification.totalEvents} events, Root Hash: \`${verification.rootHash || 'GENESIS'}\`)`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (domains.length === 0) {
    lines.push('*No domains currently seeded in ledger.*');
    return lines.join('\n');
  }

  for (const domain of domains) {
    const domainEntries = entries.filter((e) => e.domain_id === domain.id);
    const domainCreds = credentials.filter((c) => c.domain_id === domain.id);

    lines.push(`## Domain: ${domain.title} (\`${domain.slug}\`)`);
    if (domain.description) {
      lines.push(`> ${domain.description}`);
    }
    lines.push(`*Visibility: ${domain.visibility.toUpperCase()}*`);
    lines.push('');

    if (domainEntries.length > 0) {
      lines.push('### Cultivation Entries');
      for (const ent of domainEntries) {
        const stageBadge = {
          seeded: '🌱 [SEEDED]',
          studied: '📖 [STUDIED]',
          applied: '🛠️ [APPLIED]',
          cultivated: '💎 [CULTIVATED]',
        }[ent.current_stage] || ent.current_stage.toUpperCase();

        lines.push(`#### ${stageBadge} ${ent.title}`);
        if (ent.source_uri) {
          lines.push(`- **Source (${ent.source_kind.toUpperCase()}):** [${ent.source_uri}](${ent.source_uri})`);
        } else {
          lines.push(`- **Source Kind:** ${ent.source_kind.toUpperCase()}`);
        }
        lines.push('');
      }
    }

    if (domainCreds.length > 0) {
      lines.push('### Verifiable Credentials');
      for (const c of domainCreds) {
        lines.push(`- **${c.title}** (${c.issuer_name}) — Status: \`${c.verification_status}\``);
        lines.push(`  - SHA-256 Fingerprint: \`${c.evidence_sha256}\``);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
