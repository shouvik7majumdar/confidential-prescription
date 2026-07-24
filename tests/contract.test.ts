// tests/contract.test.ts
// Tests verifying contract structure assumptions and initial state.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Contract Structure', () => {
  it('contract source must have the pragma version directive', () => {
    const src = readFileSync(path.resolve(__dirname, '../contracts/prescription-verifier.compact'), 'utf-8');
    expect(src).toMatch(/pragma language_version >= 0\.23/);
  });

  it('must export verifyPrescription circuit', () => {
    const src = readFileSync(path.resolve(__dirname, '../contracts/prescription-verifier.compact'), 'utf-8');
    expect(src).toMatch(/export circuit verifyPrescription/);
  });

  it('must declare prescriptionHash as a witness function', () => {
    const src = readFileSync(path.resolve(__dirname, '../contracts/prescription-verifier.compact'), 'utf-8');
    expect(src).toMatch(/witness prescriptionHash\(\)/);
  });

  it('must declare doctorSignature as a witness function', () => {
    const src = readFileSync(path.resolve(__dirname, '../contracts/prescription-verifier.compact'), 'utf-8');
    expect(src).toMatch(/witness doctorSignature\(\)/);
  });

  it('must export activate and deactivate admin circuits', () => {
    const src = readFileSync(path.resolve(__dirname, '../contracts/prescription-verifier.compact'), 'utf-8');
    expect(src).toMatch(/export circuit deactivate\(\)/);
    expect(src).toMatch(/export circuit activate\(\)/);
  });

  it('compiled contract index.js must exist after compilation', () => {
    const compiledPath = path.resolve(__dirname, '../contracts/managed/prescription-verifier/contract/index.js');
    let exists = false;
    try {
      readFileSync(compiledPath);
      exists = true;
    } catch { /* file not found */ }
    expect(exists).toBe(true);
  });
});

describe('Package Config', () => {
  it('package.json must have correct name', () => {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
    expect(pkg.name).toBe('confidential-prescription-verification');
  });

  it('package.json must have vitest as a dev dependency', () => {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
    expect(pkg.devDependencies).toHaveProperty('vitest');
  });

  it('package.json compile script must use full compact path', () => {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
    expect(pkg.scripts.compile).toContain('/home/user/.local/bin/compact');
  });
});