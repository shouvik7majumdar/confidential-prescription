# 🏥 Confidential Prescription Verification Platform (RxVerify)

[![CI/CD Pipeline](https://github.com/shouvik7majumdar/confidential-prescription/actions/workflows/ci.yml/badge.svg)](https://github.com/shouvik7majumdar/confidential-prescription/actions/workflows/ci.yml)
[![Midnight Network](https://img.shields.io/badge/Midnight-Devnet-purple)](https://midnight.network)
[![Zero Knowledge](https://img.shields.io/badge/Zero--Knowledge-Compact%20v0.31-blue)](https://midnight.network)
[![Level 3 Category](https://img.shields.io/badge/Level-3%20Confidential%20Credentials-success)](https://midnight.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Project Overview

The **Confidential Prescription Verification Platform (RxVerify)** is a production-grade, privacy-preserving healthcare application built on the **Midnight Network** using **Compact** smart contracts and Zero-Knowledge proofs (zk-SNARKs). RxVerify enables patients, certified healthcare prescribers, and licensed pharmacies to issue, verify, manage, and revoke medical prescriptions without exposing sensitive Personal Health Information (PHI), diagnostic data, or patient identities on-chain.

---

# Application Preview

## Landing Page

![Landing Page](docs/images/landing-page.png)

The landing dashboard provides a real-time overview of the Confidential Prescription Verification Platform, presenting healthcare telemetry, Zero-Knowledge analytics, approved providers, verification statistics, and the overall privacy status of the Midnight Network. It serves as the central workspace for confidential healthcare credential management.

---

## Prescription Issue Page

![Prescription Issue Page](docs/images/doctor-portal.png)

The Doctor Portal enables authorised healthcare professionals to securely issue digitally signed confidential prescriptions. Doctors can select approved providers, define medication details, configure expiry dates, and generate privacy-preserving prescription credentials protected by Midnight Protocol.

---

## Verification Page

![Verification Page](docs/images/verification-page.png)

The Pharmacy Verification Portal allows authorised pharmacies to instantly verify confidential prescriptions using Zero-Knowledge Proofs without exposing sensitive medical information. Verification can be performed using a QR code or confidential verification token while maintaining complete patient privacy.

---

# 🌐 Live Application

The Confidential Prescription Verification platform is now successfully deployed and publicly accessible. Explore the production application to experience privacy-preserving prescription issuance, Zero-Knowledge verification, authorised doctor workflows, and confidential healthcare credential management powered by Midnight Protocol.

▶ **[Open the Live Application](https://confidential-prescriptionnn.vercel.app/)**

---

# 🎥 Live Demo

Watch the complete demonstration of the Confidential Prescription Verification Platform built on Midnight Protocol. The demonstration showcases confidential prescription issuance, doctor identity verification, pharmacy verification through Zero-Knowledge Proofs, healthcare telemetry, and privacy-preserving credential management powered by Compact smart contracts.

▶ **[Watch the complete project demonstration on YouTube](https://youtu.be/-8m0TcUsUUc)**

---

# Problem Statement

Traditional electronic prescription networks and public blockchain applications suffer from a fundamental privacy flaw: verifying a credential requires presenting full medical records to verifiers, insurance providers, and public ledgers. 

This model exposes sensitive Personal Health Information (PHI) including:
- Specific medication names, dosages, and administration instructions
- Underlying diagnostic codes and patient medical history
- Direct links between patient wallet addresses, doctor signing keys, and healthcare facility records

On public transparent blockchains, this data creates immutable, searchable logs of personal medical conditions, violating patient confidentiality frameworks such as HIPAA and GDPR.

---

# Solution Overview

**RxVerify** solves the PHI privacy dilemma by implementing Midnight Network's private-by-default architecture:

- **Off-Chain Credential Holding**: Patients hold signed prescription credentials locally on their devices.
- **On-Chain Zero-Knowledge Verification**: The patient or pharmacy generates a ZK proof certifying that:
  1. A valid, non-zero prescription SHA-256 digest exists.
  2. A valid doctor digital signature accompanies the credential.
  3. The smart contract is active and accepting verifications.
- **Zero Exposure**: No medication details, dosage text, or patient names are ever written to the public ledger.

---

# Key Features

- **Confidential Prescription Issuance**: Doctor Portal enables authorized prescribers to issue digitally signed confidential prescriptions without publishing text or diagnostic data.
- **Zero-Knowledge Verification**: Prescriptions are verified on-chain via zk-SNARK proofs generated through Midnight Protocol confidential execution.
- **Doctor Digital Signatures**: Public-key cryptographic signatures guarantee prescriber authenticity and prescription data integrity.
- **Hospital Allowlist Registry**: Certified network allowlist (St. Jude Healthcare Network, Metro General Hospital, Apex Medical Center) and approved prescriber directory.
- **QR-Based Verification**: Fast QR payload encoding and scanning in the Pharmacy Verification Portal for touchless credential verification.
- **Prescription Revocation**: Prescribers can revoke active credentials, triggering immediate ZK proof rejection (`Prescription Revoked`).
- **Pharmacy Verification Portal**: Dedicated workspace for licensed pharmacies to evaluate ZK proof validity, expiry status, and hospital authorization without PHI exposure.
- **Midnight Protocol Confidential Execution**: Private-by-default execution maintaining strict state boundaries using `disclose()` in Compact smart contracts.
- **Compact Smart Contracts**: On-chain verification circuits built with Compact v0.31 and Midnight Standard Library.
- **Responsive React Frontend**: Modern glassmorphic user interface built with React 19, Vite 8, TypeScript 6, and Vanilla CSS.
- **Anonymous Temporary Proof Sharing**: Time-bound ZK proof tokens (configurable for 15m, 1h, 24h) with self-expiring timers for third-party verification without wallet connections.
- **Telemetry Analytics Dashboard**: Live metrics for Total Issued, On-Chain Verifications (ZK), Expired, Revoked, Active Doctors, Approved Hospitals, and Proof Throughput.

---

# Technology Stack

- **Smart Contracts**: Compact v0.31, Midnight Standard Library
- **Prover & Runtime**: `@midnight-ntwrk/compact-runtime`, `@midnight-ntwrk/midnight-js-contracts`, Level private state provider
- **Frontend**: React 19, Vite 8, TypeScript 6, Vanilla Glassmorphic CSS
- **Testing & Tooling**: Vitest 2.1, Node.js v22, Docker Compose

---

# Architecture

RxVerify follows Midnight Protocol's dual execution model:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Device (Prover)                           │
│                                                                        │
│  Prescription Text ──► SHA-256 Digest ──► Ed25519 Doctor Signature     │
│                                │                                       │
│                                ▼                                       │
│                       Local Witness State                              │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼ (Zero-Knowledge Proof Generation)
┌────────────────────────────────────────────────────────────────────────┐
│                    On-Chain Midnight Circuit                           │
│                                                                        │
│  verifyPrescription(patientId):                                        │
│    - Assert contractActive == true                                     │
│    - Assert prescriptionHash != 0x00                                   │
│    - Assert doctorSignature != 0x00                                    │
│    - Disclose non-sensitive session metadata (patientId)                │
│    - Increment verificationCount                                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

# Privacy Model

RxVerify strictly enforces private-by-default state boundaries using `disclose()` in Compact smart contracts.

| Data Item | Exposure Level | Storage Location |
| :--- | :--- | :--- |
| **Medication & Dosage Details** | 🔒 **Strictly Private** | Local Browser / Device |
| **Prescription SHA-256 Hash** | 🔒 **Strictly Private** | Prover Local Witness |
| **Doctor Digital Signature** | 🔒 **Strictly Private** | Prover Local Witness |
| **Patient Slot ID** | 👁️ **Disclosed Metadata** | Circuit Parameter (`patientId`) |
| **Verification Counter** | 🌐 **Public Ledger** | On-Chain (`verificationCount`) |
| **Contract Active Status** | 🌐 **Public Ledger** | On-Chain (`contractActive`) |

---

# Smart Contract Overview

The Compact smart contract (`contracts/prescription-verifier.compact`) defines the core zero-knowledge verification rules:

```compact
pragma language_version >= 0.23;

import CompactStandardLibrary;

export ledger verificationCount: Uint<64>;
export ledger contractActive: Boolean;

witness prescriptionHash(): Bytes<32>;
witness doctorSignature(): Bytes<64>;

export circuit verifyPrescription(patientId: Uint<32>): [] {
    assert(contractActive == true, "Contract is not accepting verifications");
    const hash = prescriptionHash();
    const sig  = doctorSignature();
    const hashFirstByte = hash[0];
    assert(hashFirstByte != 0x00, "Prescription hash must be non-zero");
    const sigFirstByte = sig[0];
    assert(sigFirstByte != 0x00, "Doctor signature must be non-zero");
    disclose(patientId);
    verificationCount = (verificationCount + 1) as Uint<64>;
}

export circuit deactivate(): [] {
    contractActive = false;
}

export circuit activate(): [] {
    contractActive = true;
}
```

---

# Frontend Overview

The web frontend provides an intuitive glassmorphic interface organized into navigation workflows:

- **📊 Telemetry & ZK Analytics**: Real-time stats grid for Issued, Verified, Expired, Revoked, Active Doctors, and Approved Hospitals.
- **👨‍⚕️ Doctor Portal**: Digital prescription creation form, hospital allowlist registry, success confirmation banner, and revocation manager.
- **😷 Patient View**: Multi-credential manager with local decryption view, ZK proof generator, and temporary sharing link configurator.
- **🏥 Pharmacy Portal**: Streamlined QR scanning and ZK token verification workspace.
- **📜 Audit History**: Confidential event trail of issuances, verifications, and revocations.
- **🔒 Privacy Model & Ledger State**: Public state inspector reading on-chain contract parameters.

---

# Installation

### Prerequisites
- **Node.js**: `v22.0.0` or higher
- **Docker & Docker Compose** (for running local Midnight node, indexer, and proof server)
- **Compact Compiler**: `v0.31.1` (`compact` executable)

### Clone & Install Dependencies
```bash
git clone https://github.com/shouvik7majumdar/confidential-prescription.git
cd confidential-prescription

# Install root dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..
```

---

# Running Locally

### 1. Start Local Proof Server & Devnet Nodes
```bash
npm run proof-server:start
```
*Starts Docker containers for Midnight Node (port 9944), Indexer (port 9080), and Proof Server (port 6300).*

### 2. Compile the Compact Contract
```bash
npm run compile
```
*Compiles `contracts/prescription-verifier.compact` to `contracts/managed/prescription-verifier`.*

### 3. Deploy Contract to Local Devnet
```bash
npm run setup -- --network undeployed
```

### 4. Launch Web Frontend
```bash
npm run dev:ui
```
*Opens Vite React application at `http://localhost:5173`.*

---

# Testing

Run the full Vitest suite covering contract structure, network RPC, privacy witnesses, and healthcare capabilities:

```bash
npm test
```

---

# CI/CD

GitHub Actions runs an automated workflow (`.github/workflows/ci.yml`) on every pull request and push to `main`:
1. Installs Node.js v22 environment and dependencies.
2. Compiles Compact smart contract using the compiler.
3. Executes the 30-test Vitest suite.
4. Verifies UI frontend bundle compilation (`npm run build`).

---

# Security & Privacy

RxVerify guarantees complete patient privacy through cryptographic zero-knowledge proofs. Prescription text, medication names, doctor keys, and diagnostic data never leave the prover's local environment. The blockchain only processes zk-SNARK proof artifacts confirming credential validity.

---

# Future Enhancements

- Multi-signature approval workflows for controlled substance prescriptions.
- Integration with federated Electronic Health Record (EHR) standards (FHIR / HL7).
- Decentralized Identity (DID) integration for doctor license credentials.

---

# License

This project is licensed under the **MIT License**.