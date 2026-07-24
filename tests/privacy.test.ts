// tests/privacy.test.ts
// Tests verifying the privacy model: private witnesses must never be disclosed.
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to hash prescription text (mirrors cli.ts logic)
function hashPrescription(text: string): Uint8Array {
  return new Uint8Array(createHash('sha256').update(text).digest());
}

// Helper to create a deterministic mock doctor signature
function mockDoctorSignature(hash: Uint8Array): Uint8Array {
  const sig = new Uint8Array(64);
  const half = createHash('sha256').update(Buffer.concat([Buffer.from('doctor-sig-v1:'), hash])).digest();
  sig.set(half, 0);
  sig.set(half, 32);
  return sig;
}

describe('Privacy Model', () => {
  it('prescription hash must be exactly 32 bytes (SHA-256)', () => {
    const hash = hashPrescription('Amoxicillin 500mg twice daily — Dr. Smith');
    expect(hash.length).toBe(32);
  });

  it('different prescriptions must produce different hashes', () => {
    const h1 = hashPrescription('Amoxicillin 500mg');
    const h2 = hashPrescription('Ibuprofen 200mg');
    expect(Buffer.from(h1).toString('hex')).not.toBe(Buffer.from(h2).toString('hex'));
  });

  it('doctor signature must be 64 bytes', () => {
    const hash = hashPrescription('Test prescription');
    const sig = mockDoctorSignature(hash);
    expect(sig.length).toBe(64);
  });

  it('doctor signature must be deterministic for same hash', () => {
    const hash = hashPrescription('Reproducible test');
    const sig1 = mockDoctorSignature(hash);
    const sig2 = mockDoctorSignature(hash);
    expect(Buffer.from(sig1).toString('hex')).toBe(Buffer.from(sig2).toString('hex'));
  });

  it('contract source must NOT contain disclose() on private witness fields', () => {
    const contractPath = path.resolve(__dirname, '../contracts/prescription-verifier.compact');
    const source = readFileSync(contractPath, 'utf-8');

    // prescriptionHash and doctorSignature must not be arguments to disclose()
    expect(source).not.toMatch(/disclose\(prescriptionHash/);
    expect(source).not.toMatch(/disclose\(doctorSignature/);
    expect(source).not.toMatch(/disclose\(hash\)/);
    expect(source).not.toMatch(/disclose\(sig\)/);
  });

  it('contract source must only disclose patientId (session metadata)', () => {
    const contractPath = path.resolve(__dirname, '../contracts/prescription-verifier.compact');
    const source = readFileSync(contractPath, 'utf-8');

    // Only patientId should appear in a disclose() call
    expect(source).toMatch(/disclose\(patientId\)/);
    // Count disclose() calls — should be exactly one
    const discloseCount = (source.match(/disclose\(/g) || []).length;
    expect(discloseCount).toBe(1);
  });

  it('verificationCount ledger field is the only public aggregate', () => {
    const contractPath = path.resolve(__dirname, '../contracts/prescription-verifier.compact');
    const source = readFileSync(contractPath, 'utf-8');

    // Expect exactly 2 exported ledger fields
    const ledgerExports = (source.match(/export ledger \w+:/g) || []);
    expect(ledgerExports).toHaveLength(2);
    expect(ledgerExports.some(l => l.includes('verificationCount'))).toBe(true);
    expect(ledgerExports.some(l => l.includes('contractActive'))).toBe(true);
  });
});