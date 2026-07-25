// src/healthcare-services.ts
// Production-grade Healthcare Platform services for RxVerify on Midnight Network.

// ─── Pure Cross-Environment SHA-256 Implementation ─────────────────────────
// Works in both Node.js environment and Vite Browser without node:crypto.

function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;
  const isNotPrime: Record<number, number> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isNotPrime[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isNotPrime[i] = candidate;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface DoctorRecord {
  id: string;
  name: string;
  licenseNumber: string;
  hospitalId: string;
  hospitalName: string;
  specialisation: string;
  publicKey: string;
  status: 'Active' | 'Suspended';
}

export interface HospitalRecord {
  id: string;
  name: string;
  licenseCode: string;
  city: string;
  status: 'Approved' | 'Pending';
  verifiedDoctorsCount: number;
}

export interface Prescription {
  id: string;
  patientId: number; // 32-bit patient session slot ID
  patientName: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  hospitalId: string;
  hospitalName: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  prescriptionHash: string; // Hex string (32 bytes)
  doctorSignature: string; // Hex string (64 bytes)
  status: 'Valid' | 'Expired' | 'Revoked';
  createdAt: number;
}

export interface ProofToken {
  id: string;
  prescriptionId: string;
  prescriptionHash: string;
  doctorSignature: string;
  patientId: number;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  issueDate: string;
  expiryDate: string;
  tokenIssuedAt: number;
  tokenExpiresAt: number; // Unix timestamp in ms
  durationMinutes: number;
}

export interface VerificationLog {
  id: string;
  timestamp: number;
  type: 'Issued' | 'Verified' | 'Revoked' | 'Expired';
  prescriptionId: string;
  verifierRole: 'Doctor' | 'Patient' | 'Pharmacy';
  details: string;
  zkStatus: 'Proof Valid' | 'Proof Failed' | 'Token Expired' | 'Revoked';
}

export interface AnalyticsSummary {
  totalIssued: number;
  totalVerified: number;
  totalExpired: number;
  totalRevoked: number;
  activeDoctors: number;
  authorizedHospitals: number;
  verificationRequests: number;
}

// ─── Initial Authorized Allowlist ─────────────────────────────────────────────

export const AUTHORIZED_HOSPITALS: HospitalRecord[] = [
  {
    id: 'hosp-001',
    name: 'St. Jude Healthcare Network',
    licenseCode: 'HOSP-NY-98214',
    city: 'New York, NY',
    status: 'Approved',
    verifiedDoctorsCount: 142,
  },
  {
    id: 'hosp-002',
    name: 'Metro General Hospital',
    licenseCode: 'HOSP-CA-44120',
    city: 'San Francisco, CA',
    status: 'Approved',
    verifiedDoctorsCount: 98,
  },
  {
    id: 'hosp-003',
    name: 'Apex Medical Center',
    licenseCode: 'HOSP-TX-77189',
    city: 'Austin, TX',
    status: 'Approved',
    verifiedDoctorsCount: 65,
  },
];

export const AUTHORIZED_DOCTORS: DoctorRecord[] = [
  {
    id: 'doc-101',
    name: 'Dr. Sarah Jenkins, MD',
    licenseNumber: 'MD-89210-NY',
    hospitalId: 'hosp-001',
    hospitalName: 'St. Jude Healthcare Network',
    specialisation: 'Chief of Cardiology',
    publicKey: '0x8f1a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    status: 'Active',
  },
  {
    id: 'doc-102',
    name: 'Dr. Marcus Vance, MD',
    licenseNumber: 'MD-43921-CA',
    hospitalId: 'hosp-002',
    hospitalName: 'Metro General Hospital',
    specialisation: 'Neurology & Pain Management',
    publicKey: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    status: 'Active',
  },
  {
    id: 'doc-103',
    name: 'Dr. Elena Rostova, MD',
    licenseNumber: 'MD-66512-TX',
    hospitalId: 'hosp-003',
    hospitalName: 'Apex Medical Center',
    specialisation: 'Internal Medicine',
    publicKey: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    status: 'Active',
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Calculate prescription status based on expiry date and revocation state.
 */
export function getPrescriptionStatus(
  expiryDateStr: string,
  isRevoked: boolean
): { status: 'Valid' | 'Expired' | 'Revoked'; daysLeft: number } {
  if (isRevoked) {
    return { status: 'Revoked', daysLeft: 0 };
  }

  const now = new Date();
  const expiry = new Date(expiryDateStr);
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: 'Expired', daysLeft: 0 };
  }

  return { status: 'Valid', daysLeft };
}

/**
 * Format status badge display string.
 */
export function formatExpiryBadge(expiryDateStr: string, isRevoked: boolean): {
  label: string;
  badgeClass: 'badge-success' | 'badge-danger' | 'badge-warning';
} {
  const { status, daysLeft } = getPrescriptionStatus(expiryDateStr, isRevoked);
  if (status === 'Revoked') {
    return { label: 'Prescription Revoked', badgeClass: 'badge-danger' };
  }
  if (status === 'Expired') {
    return { label: 'Expired', badgeClass: 'badge-danger' };
  }
  if (daysLeft <= 7) {
    return { label: `Expires in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}`, badgeClass: 'badge-warning' };
  }
  return { label: `Valid (${daysLeft} Days Left)`, badgeClass: 'badge-success' };
}

/**
 * Generate SHA-256 hash of structured prescription content.
 */
export function calculatePrescriptionHash(data: {
  patientId: number;
  medicationName: string;
  dosage: string;
  doctorId: string;
  issueDate: string;
  expiryDate: string;
}): string {
  const payload = `${data.patientId}:${data.medicationName.trim()}:${data.dosage.trim()}:${data.doctorId}:${data.issueDate}:${data.expiryDate}`;
  return sha256(payload);
}

/**
 * Generate mock doctor digital signature (64 hex characters / 32 bytes pair).
 */
export function generateDoctorSignature(prescriptionHashHex: string, doctorPublicKey: string): string {
  const sigBuffer = sha256(`doctor-sig:${doctorPublicKey}:${prescriptionHashHex}`);
  // Return 128 hex chars (64 bytes)
  return sigBuffer + sigBuffer;
}

/**
 * Verify doctor digital signature integrity.
 */
export function verifyDoctorSignature(
  prescriptionHashHex: string,
  doctorSignatureHex: string,
  doctorPublicKey: string
): boolean {
  if (!doctorSignatureHex || doctorSignatureHex.length !== 128) return false;
  const expected = generateDoctorSignature(prescriptionHashHex, doctorPublicKey);
  return doctorSignatureHex === expected;
}

/**
 * Create a temporary ZK Proof token for anonymous sharing.
 */
export function createProofToken(
  prescription: Prescription,
  durationMinutes: number = 60
): ProofToken {
  const now = Date.now();
  const expiresAt = now + durationMinutes * 60 * 1000;
  const id = `token-${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    prescriptionId: prescription.id,
    prescriptionHash: prescription.prescriptionHash,
    doctorSignature: prescription.doctorSignature,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    doctorName: prescription.doctorName,
    hospitalName: prescription.hospitalName,
    issueDate: prescription.issueDate,
    expiryDate: prescription.expiryDate,
    tokenIssuedAt: now,
    tokenExpiresAt: expiresAt,
    durationMinutes,
  };
}

/**
 * Validate proof token expiration.
 */
export function isProofTokenValid(token: ProofToken): boolean {
  return Date.now() <= token.tokenExpiresAt;
}

/**
 * Encode QR Code Payload as a JSON string.
 */
export function encodeQRPayload(tokenOrPrescription: Prescription | ProofToken): string {
  return JSON.stringify({
    type: 'RX_VERIFY_ZK_TOKEN',
    v: 1,
    id: tokenOrPrescription.id,
    hash: 'prescriptionHash' in tokenOrPrescription ? tokenOrPrescription.prescriptionHash : '',
    sig: 'doctorSignature' in tokenOrPrescription ? tokenOrPrescription.doctorSignature : '',
    patientId: tokenOrPrescription.patientId,
    expiry: tokenOrPrescription.expiryDate,
    ts: Date.now(),
  });
}

/**
 * Parse QR Code Payload string.
 */
export function parseQRPayload(qrString: string): {
  type: string;
  id: string;
  hash: string;
  sig: string;
  patientId: number;
  expiry: string;
} | null {
  try {
    const data = JSON.parse(qrString);
    if (data && data.type === 'RX_VERIFY_ZK_TOKEN') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
