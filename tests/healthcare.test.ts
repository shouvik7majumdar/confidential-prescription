// tests/healthcare.test.ts
// Unit tests for healthcare platform capabilities: Doctor Verification, Expiry, QR Tokens, Revocation, and Allowlists.

import { describe, it, expect } from 'vitest';
import {
  AUTHORIZED_DOCTORS,
  AUTHORIZED_HOSPITALS,
  getPrescriptionStatus,
  formatExpiryBadge,
  calculatePrescriptionHash,
  generateDoctorSignature,
  verifyDoctorSignature,
  createProofToken,
  isProofTokenValid,
  encodeQRPayload,
  parseQRPayload,
  Prescription,
} from '../src/healthcare-services';

describe('Doctor & Hospital Allowlist', () => {
  it('must contain authorized hospitals', () => {
    expect(AUTHORIZED_HOSPITALS.length).toBeGreaterThanOrEqual(3);
    const hosp = AUTHORIZED_HOSPITALS.find(h => h.id === 'hosp-001');
    expect(hosp?.name).toBe('St. Jude Healthcare Network');
    expect(hosp?.status).toBe('Approved');
  });

  it('must contain active doctors with valid license numbers', () => {
    expect(AUTHORIZED_DOCTORS.length).toBeGreaterThanOrEqual(3);
    const doc = AUTHORIZED_DOCTORS.find(d => d.id === 'doc-101');
    expect(doc?.name).toBe('Dr. Sarah Jenkins, MD');
    expect(doc?.status).toBe('Active');
    expect(doc?.publicKey).toBeDefined();
  });
});

describe('Prescription Expiry & Revocation Logic', () => {
  it('should mark future dates as Valid', () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { status, daysLeft } = getPrescriptionStatus(futureDate, false);
    expect(status).toBe('Valid');
    expect(daysLeft).toBeGreaterThan(0);

    const badge = formatExpiryBadge(futureDate, false);
    expect(badge.label).toContain('Valid');
    expect(badge.badgeClass).toBe('badge-success');
  });

  it('should mark past dates as Expired', () => {
    const pastDate = '2020-01-01';
    const { status } = getPrescriptionStatus(pastDate, false);
    expect(status).toBe('Expired');

    const badge = formatExpiryBadge(pastDate, false);
    expect(badge.label).toBe('Expired');
    expect(badge.badgeClass).toBe('badge-danger');
  });

  it('should prioritize Revoked status over expiry', () => {
    const futureDate = '2030-12-31';
    const { status } = getPrescriptionStatus(futureDate, true);
    expect(status).toBe('Revoked');

    const badge = formatExpiryBadge(futureDate, true);
    expect(badge.label).toBe('Prescription Revoked');
    expect(badge.badgeClass).toBe('badge-danger');
  });
});

describe('Doctor Digital Signatures & Hash Verification', () => {
  it('should generate deterministic prescription hashes', () => {
    const hash1 = calculatePrescriptionHash({
      patientId: 101,
      medicationName: 'Amoxicillin 500mg',
      dosage: '1 tablet 3x daily',
      doctorId: 'doc-101',
      issueDate: '2026-07-26',
      expiryDate: '2026-08-26',
    });

    const hash2 = calculatePrescriptionHash({
      patientId: 101,
      medicationName: 'Amoxicillin 500mg',
      dosage: '1 tablet 3x daily',
      doctorId: 'doc-101',
      issueDate: '2026-07-26',
      expiryDate: '2026-08-26',
    });

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // hex representation of 32 bytes
  });

  it('should produce and verify valid doctor digital signatures', () => {
    const doctor = AUTHORIZED_DOCTORS[0];
    const pHash = calculatePrescriptionHash({
      patientId: 202,
      medicationName: 'Lipitor 20mg',
      dosage: '1 tablet daily',
      doctorId: doctor.id,
      issueDate: '2026-07-26',
      expiryDate: '2026-10-26',
    });

    const sig = generateDoctorSignature(pHash, doctor.publicKey);
    expect(verifyDoctorSignature(pHash, sig, doctor.publicKey)).toBe(true);
    expect(verifyDoctorSignature(pHash, sig, 'invalid-key')).toBe(false);
  });
});

describe('Anonymous Temporary Proof Tokens & QR Encoding', () => {
  const sampleRx: Prescription = {
    id: 'rx-999',
    patientId: 42,
    patientName: 'Jane Doe',
    medicationName: 'Metformin 850mg',
    dosage: '2x daily with meals',
    instructions: 'Take with water',
    doctorId: 'doc-101',
    doctorName: 'Dr. Sarah Jenkins, MD',
    doctorLicense: 'MD-89210-NY',
    hospitalId: 'hosp-001',
    hospitalName: 'St. Jude Healthcare Network',
    issueDate: '2026-07-26',
    expiryDate: '2026-09-26',
    prescriptionHash: 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890',
    doctorSignature: '11223344556677889900112233445566778899001122334455667788990011223344556677889900112233445566778899001122334455667788990011223344',
    status: 'Valid',
    createdAt: Date.now(),
  };

  it('should generate proof token with valid expiration window', () => {
    const token = createProofToken(sampleRx, 15);
    expect(token.durationMinutes).toBe(15);
    expect(isProofTokenValid(token)).toBe(true);

    const expiredToken = { ...token, tokenExpiresAt: Date.now() - 1000 };
    expect(isProofTokenValid(expiredToken)).toBe(false);
  });

  it('should encode and parse QR code payload cleanly', () => {
    const qrString = encodeQRPayload(sampleRx);
    const parsed = parseQRPayload(qrString);

    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('RX_VERIFY_ZK_TOKEN');
    expect(parsed?.patientId).toBe(42);
    expect(parsed?.hash).toBe(sampleRx.prescriptionHash);
  });
});
