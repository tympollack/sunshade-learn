import type { CultivationEvent } from '../types';

/**
 * Web Crypto SHA-256 helper compatible with both Browsers and Cloudflare Workers
 */
export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface ChainVerificationResult {
  valid: boolean;
  totalEvents: number;
  verifiedAt: string;
  brokenIndex?: number;
  reason?: string;
  rootHash?: string;
}

/**
 * Deterministic SHA-256 preimage hash shared 1:1 with PostgreSQL learn.compute_event_hash()
 */
export async function computeEventHash(params: {
  seq_num: number;
  user_id: string;
  entry_id: string;
  stage: string;
  synthesis_notes?: string | null;
  artifact_uri?: string | null;
  attestation_kind: string;
  signer_did?: string | null;
  event_timestamp_ms: number;
  prev_event_hash: string;
}): Promise<string> {
  const preimage = [
    params.seq_num.toString(),
    params.user_id,
    params.entry_id,
    params.stage,
    params.synthesis_notes || '',
    params.artifact_uri || '',
    params.attestation_kind,
    params.signer_did || '',
    params.event_timestamp_ms.toString(),
    params.prev_event_hash,
  ].join('|');

  return sha256Hex(preimage);
}

/**
 * Verifies the integrity of a cultivation event hash-chain.
 * Matches learn._verify_user_chain in PostgreSQL.
 */
export async function verifyCultivationChain(
  events: CultivationEvent[]
): Promise<ChainVerificationResult> {
  const now = new Date().toISOString();
  if (!events || events.length === 0) {
    return { valid: true, totalEvents: 0, verifiedAt: now, rootHash: 'GENESIS' };
  }

  // Sort strictly ascending by seq_num
  const sorted = [...events].sort((a, b) => a.seq_num - b.seq_num);

  let expectedSeq = 0;
  let expectedPrev = 'GENESIS';

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];
    expectedSeq += 1;

    // 1. Verify sequence number is strictly monotonic
    if (event.seq_num !== expectedSeq) {
      return {
        valid: false,
        totalEvents: sorted.length,
        verifiedAt: now,
        brokenIndex: i,
        reason: `Non-sequential seq_num: expected ${expectedSeq}, got ${event.seq_num}`,
      };
    }

    // 2. Verify backward pointer matches previous event hash
    if (event.prev_event_hash !== expectedPrev) {
      return {
        valid: false,
        totalEvents: sorted.length,
        verifiedAt: now,
        brokenIndex: i,
        reason: `Broken chain pointer at seq_num ${event.seq_num}: expected prev_event_hash ${expectedPrev}, found ${event.prev_event_hash}`,
      };
    }

    // 3. Recompute deterministic preimage hash
    const recomputed = await computeEventHash({
      seq_num: event.seq_num,
      user_id: event.user_id,
      entry_id: event.entry_id,
      stage: event.stage,
      synthesis_notes: event.synthesis_notes,
      artifact_uri: event.artifact_uri,
      attestation_kind: event.attestation_kind,
      signer_did: event.signer_did,
      event_timestamp_ms: event.event_timestamp_ms,
      prev_event_hash: event.prev_event_hash,
    });

    if (recomputed !== event.event_hash) {
      return {
        valid: false,
        totalEvents: sorted.length,
        verifiedAt: now,
        brokenIndex: i,
        reason: `Cryptographic tamper detected at seq_num ${event.seq_num}: hash mismatch`,
      };
    }

    expectedPrev = event.event_hash;
  }

  return {
    valid: true,
    totalEvents: sorted.length,
    verifiedAt: now,
    rootHash: expectedPrev,
  };
}
