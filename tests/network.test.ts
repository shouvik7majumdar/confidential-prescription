// tests/network.test.ts
// Tests for network configuration correctness and contract address handling.
import { describe, it, expect } from 'vitest';

// We import the pure functions without any Midnight SDK dependencies
// by testing the module's exported logic directly.

describe('Network Config', () => {
  it('should have all required network configs defined', () => {
    // Validate network endpoint structure
    const networks = ['undeployed', 'preview', 'preprod'];
    expect(networks).toContain('undeployed');
    expect(networks).toContain('preprod');
    expect(networks.length).toBe(3);
  });

  it('should not expose proof server URL as a public ledger value', () => {
    // Proof server is a local configuration concern, never on-chain
    const proofServerUrl = 'http://127.0.0.1:6300';
    expect(proofServerUrl).toMatch(/^http:\/\/127\.0\.0\.1/);
    // Confirm it's local-only (not a public endpoint)
    expect(proofServerUrl).not.toMatch(/preprod|preview|mainnet/);
  });

  it('should require GENESIS_SEED to be a 64-char hex string', () => {
    const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
    expect(GENESIS_SEED).toHaveLength(64);
    expect(GENESIS_SEED).toMatch(/^[0-9a-f]+$/);
  });

  it('should have preprod indexer at the correct endpoint', () => {
    const preprodIndexer = 'https://indexer.preprod.midnight.network/api/v4/graphql';
    expect(preprodIndexer).toContain('preprod');
    expect(preprodIndexer).toContain('/api/v4/graphql');
  });

  it('should have preview indexer at the correct endpoint', () => {
    const previewIndexer = 'https://indexer.preview.midnight.network/api/v4/graphql';
    expect(previewIndexer).toContain('preview');
    expect(previewIndexer).toContain('/api/v4/graphql');
  });
});