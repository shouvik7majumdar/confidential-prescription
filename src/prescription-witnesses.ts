// src/prescription-witnesses.ts
// Witness implementations for the prescription-verifier contract.
//
// Witnesses are pure functions that run locally (off-chain) to provide
// private data to circuits. They NEVER transmit data to the blockchain.
// The ZK proof proves the data satisfies circuit constraints without
// revealing the data itself.

import { createHash } from 'node:crypto';

// ─── Private State Shape ──────────────────────────────────────────────────────
// This is the local private state stored by the level-db private state provider.
// It is encrypted at rest and never transmitted to the network.

export interface PrescriptionPrivateState {
  // SHA-256 hash of the prescription document (32 bytes)
  prescriptionHash: Uint8Array;
  // Doctor's signature over the prescription hash (64 bytes)
  doctorSignature: Uint8Array;
}

// ─── Default empty private state ─────────────────────────────────────────────
// Used when initializing the contract before any verification

export const emptyPrivateState: PrescriptionPrivateState = {
  prescriptionHash: new Uint8Array(32), // all zeros = invalid, will fail circuit assertion
  doctorSignature: new Uint8Array(64),  // all zeros = invalid, will fail circuit assertion
};

// ─── Witness functions ────────────────────────────────────────────────────────
// Each function: (context) => [updatedPrivateState, returnValue]
// The contract circuit calls these to read private data.

export const prescriptionWitnesses = {
  prescriptionHash(context: { privateState: PrescriptionPrivateState }): [PrescriptionPrivateState, Uint8Array] {
    return [context.privateState, context.privateState.prescriptionHash];
  },

  doctorSignature(context: { privateState: PrescriptionPrivateState }): [PrescriptionPrivateState, Uint8Array] {
    return [context.privateState, context.privateState.doctorSignature];
  },
};

// ─── Helpers for building private state ──────────────────────────────────────

/**
 * Hash prescription text to a 32-byte SHA-256 digest.
 * This is the private witness value — only the hash goes into the circuit,
 * never the original text.
 */
export function hashPrescription(prescriptionText: string): Uint8Array {
  return new Uint8Array(createHash('sha256').update(prescriptionText).digest());
}

/**
 * Create a deterministic mock doctor signature for local development.
 * In production this would be a real Ed25519/secp256k1 signature from
 * the doctor's signing key.
 */
export function mockDoctorSignature(prescriptionHash: Uint8Array): Uint8Array {
  const sig = new Uint8Array(64);
  const half = createHash('sha256')
    .update(Buffer.concat([Buffer.from('doctor-sig-v1:'), prescriptionHash]))
    .digest();
  sig.set(half, 0);
  sig.set(half, 32);
  return sig;
}

/**
 * Build a full private state from raw prescription text.
 * This is called before invoking the verifyPrescription circuit.
 */
export function buildPrivateState(prescriptionText: string): PrescriptionPrivateState {
  const hash = hashPrescription(prescriptionText);
  return {
    prescriptionHash: hash,
    doctorSignature: mockDoctorSignature(hash),
  };
}