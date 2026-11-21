import { describe, it, expect } from 'vitest';
import { sha256Hex, computeEventHash, verifyCultivationChain } from './hash-chain';
import type { CultivationEvent } from '../types';

describe('Proof-of-Cultivation Cryptographic Hash Chaining', () => {
  it('computes consistent sha256 hashes', async () => {
    const hash1 = await sha256Hex('hello blueprint');
    const hash2 = await sha256Hex('hello blueprint');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('matches PostgreSQL learn.compute_event_hash deterministic preimage logic', async () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const entryId = '22222222-2222-2222-2222-222222222222';
    const timestampMs = 1795200000000;

    const hash = await computeEventHash({
      seq_num: 1,
      user_id: userId,
      entry_id: entryId,
      stage: 'seeded',
      synthesis_notes: 'Initial seed',
      artifact_uri: 'https://docs.sunshade.icu',
      attestation_kind: 'self_synthesis',
      signer_did: null,
      event_timestamp_ms: timestampMs,
      prev_event_hash: 'GENESIS',
    });

    // Check manual calculation of 1|userId|entryId|seeded|Initial seed|https://docs.sunshade.icu|self_synthesis||1795200000000|GENESIS
    const manualPreimage = `1|${userId}|${entryId}|seeded|Initial seed|https://docs.sunshade.icu|self_synthesis||${timestampMs}|GENESIS`;
    const expectedHash = await sha256Hex(manualPreimage);

    expect(hash).toBe(expectedHash);
  });

  it('validates a pristine sequential cultivation event chain', async () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const entryId = '22222222-2222-2222-2222-222222222222';

    const t0 = 1795200000000;
    const t1 = 1795200010000;
    const t2 = 1795200020000;

    const h0 = await computeEventHash({
      seq_num: 1,
      user_id: userId,
      entry_id: entryId,
      stage: 'seeded',
      synthesis_notes: 'Seeded Raft consensus',
      artifact_uri: null,
      attestation_kind: 'self_synthesis',
      signer_did: null,
      event_timestamp_ms: t0,
      prev_event_hash: 'GENESIS',
    });

    const h1 = await computeEventHash({
      seq_num: 2,
      user_id: userId,
      entry_id: entryId,
      stage: 'studied',
      synthesis_notes: 'Synthesized leader election, log replication, safety invariants',
      artifact_uri: null,
      attestation_kind: 'self_synthesis',
      signer_did: null,
      event_timestamp_ms: t1,
      prev_event_hash: h0,
    });

    const h2 = await computeEventHash({
      seq_num: 3,
      user_id: userId,
      entry_id: entryId,
      stage: 'cultivated',
      synthesis_notes: 'Evaluated consensus under network partition during Socratic check',
      artifact_uri: 'https://github.com/sunshade/raft-test',
      attestation_kind: 'ai_conversational_check',
      signer_did: null,
      event_timestamp_ms: t2,
      prev_event_hash: h1,
    });

    const events: CultivationEvent[] = [
      {
        id: 'e1',
        user_id: userId,
        entry_id: entryId,
        seq_num: 1,
        stage: 'seeded',
        synthesis_notes: 'Seeded Raft consensus',
        artifact_uri: null,
        attestation_kind: 'self_synthesis',
        payload_json: {},
        prev_event_hash: 'GENESIS',
        event_hash: h0,
        signer_did: null,
        event_timestamp_ms: t0,
        created_at: new Date(t0).toISOString(),
      },
      {
        id: 'e2',
        user_id: userId,
        entry_id: entryId,
        seq_num: 2,
        stage: 'studied',
        synthesis_notes: 'Synthesized leader election, log replication, safety invariants',
        artifact_uri: null,
        attestation_kind: 'self_synthesis',
        payload_json: {},
        prev_event_hash: h0,
        event_hash: h1,
        signer_did: null,
        event_timestamp_ms: t1,
        created_at: new Date(t1).toISOString(),
      },
      {
        id: 'e3',
        user_id: userId,
        entry_id: entryId,
        seq_num: 3,
        stage: 'cultivated',
        synthesis_notes: 'Evaluated consensus under network partition during Socratic check',
        artifact_uri: 'https://github.com/sunshade/raft-test',
        attestation_kind: 'ai_conversational_check',
        payload_json: {},
        prev_event_hash: h1,
        event_hash: h2,
        signer_did: null,
        event_timestamp_ms: t2,
        created_at: new Date(t2).toISOString(),
      },
    ];

    const result = await verifyCultivationChain(events);
    expect(result.valid).toBe(true);
    expect(result.totalEvents).toBe(3);
    expect(result.rootHash).toBe(h2);
  });

  it('detects tampering when payload or backward pointer is modified', async () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const entryId = '22222222-2222-2222-2222-222222222222';
    const t0 = 1795200000000;
    const t1 = 1795200010000;

    const h0 = await computeEventHash({
      seq_num: 1,
      user_id: userId,
      entry_id: entryId,
      stage: 'seeded',
      synthesis_notes: 'Original note',
      artifact_uri: null,
      attestation_kind: 'self_synthesis',
      signer_did: null,
      event_timestamp_ms: t0,
      prev_event_hash: 'GENESIS',
    });

    const h1 = await computeEventHash({
      seq_num: 2,
      user_id: userId,
      entry_id: entryId,
      stage: 'studied',
      synthesis_notes: 'Studied note',
      artifact_uri: null,
      attestation_kind: 'self_synthesis',
      signer_did: null,
      event_timestamp_ms: t1,
      prev_event_hash: h0,
    });

    const events: CultivationEvent[] = [
      {
        id: 'e1',
        user_id: userId,
        entry_id: entryId,
        seq_num: 1,
        stage: 'seeded',
        synthesis_notes: 'TAMPERED NOTE', // Tamper
        artifact_uri: null,
        attestation_kind: 'self_synthesis',
        payload_json: {},
        prev_event_hash: 'GENESIS',
        event_hash: h0,
        signer_did: null,
        event_timestamp_ms: t0,
        created_at: new Date(t0).toISOString(),
      },
      {
        id: 'e2',
        user_id: userId,
        entry_id: entryId,
        seq_num: 2,
        stage: 'studied',
        synthesis_notes: 'Studied note',
        artifact_uri: null,
        attestation_kind: 'self_synthesis',
        payload_json: {},
        prev_event_hash: h0,
        event_hash: h1,
        signer_did: null,
        event_timestamp_ms: t1,
        created_at: new Date(t1).toISOString(),
      },
    ];

    const result = await verifyCultivationChain(events);
    expect(result.valid).toBe(false);
    expect(result.brokenIndex).toBe(0);
    expect(result.reason).toMatch(/hash mismatch/);
  });

  it('verifies a complete Digital Backpack export archive object including chain_root_hash', async () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const entryId = '22222222-2222-2222-2222-222222222222';
    const t0 = 1795200000000;

    const h0 = await computeEventHash({
      seq_num: 1,
      user_id: userId,
      entry_id: entryId,
      stage: 'seeded',
      synthesis_notes: 'Backpack archive event',
      artifact_uri: null,
      attestation_kind: 'self_synthesis',
      signer_did: null,
      event_timestamp_ms: t0,
      prev_event_hash: 'GENESIS',
    });

    const events: CultivationEvent[] = [
      {
        id: 'e1',
        user_id: userId,
        entry_id: entryId,
        seq_num: 1,
        stage: 'seeded',
        synthesis_notes: 'Backpack archive event',
        artifact_uri: null,
        attestation_kind: 'self_synthesis',
        payload_json: {},
        prev_event_hash: 'GENESIS',
        event_hash: h0,
        signer_did: null,
        event_timestamp_ms: t0,
        created_at: new Date(t0).toISOString(),
      },
    ];

    const validExport = await verifyCultivationChain({
      cultivation_events: events,
      chain_root_hash: h0,
    });
    expect(validExport.valid).toBe(true);
    expect(validExport.rootHash).toBe(h0);

    const mismatchedRoot = await verifyCultivationChain({
      cultivation_events: events,
      chain_root_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    });
    expect(mismatchedRoot.valid).toBe(false);
    expect(mismatchedRoot.reason).toMatch(/Chain root hash mismatch/);
  });
});
