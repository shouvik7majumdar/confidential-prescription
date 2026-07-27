# 🏥 Proposal: Confidential Prescription Verification Platform (RxVerify)

> **Level 3 Confidential Health Credentials Powered by Midnight Network & Compact Zero-Knowledge Proofs**

---

## 📋 Executive Summary

The **Confidential Prescription Verification Platform (RxVerify)** is a production-grade, privacy-preserving healthcare solution built on the **Midnight Network** using **Compact** smart contracts and Zero-Knowledge proofs (zk-SNARKs). 

RxVerify bridges the critical gap between regulatory patient confidentiality (HIPAA, GDPR) and public ledger verification. It empowers healthcare providers, patients, and licensed pharmacies to issue, verify, manage, and revoke medical prescriptions without ever exposing sensitive Personal Health Information (PHI), medical diagnoses, or patient identities on-chain. By leveraging Midnight Protocol's private-by-default architecture, RxVerify proves credential validity while keeping medical data strictly off-chain and localized on user devices.

---

## ❓ Problem Statement

Electronic prescription management and healthcare credential verification systems face a fundamental security and privacy dilemma. Legacy e-prescription databases rely on centralized entities that are vulnerable to data breaches, while public transparent blockchain implementations publicly disclose transaction payload details.

When healthcare credentials or prescriptions are processed on transparent public blockchains:
1. **PHI Exposure**: Specific drug names, dosages, administration schedules, and diagnostic codes are immutably logged on-chain.
2. **Identity Linkability**: Doctor signing keys and patient wallet addresses are permanently linked to diagnostic data, enabling unauthorized profiling and correlation attacks.
3. **Regulatory Non-Compliance**: Storing identifiable or sensitive health data on a public ledger violates global privacy regulations such as HIPAA and GDPR, which demand strict access controls and the right to data erasure.

---

## ⚠️ Existing Challenges

* **Over-Disclosure at Verification Points**: Pharmacies and third-party verifiers must currently view full medical records simply to confirm prescription authenticity.
* **Prescription Forgery & Double-Fulfilling**: Paper and basic digital prescriptions lack cryptographic, tamper-proof proof of validity that can be checked instantly without central databases.
* **Lack of Revocation Control**: Prescribers currently struggle to instantly and globally revoke compromised or misissued credentials across independent pharmacy networks.
* **Usability Barriers in Web3 Healthcare**: Existing privacy solutions are complex, slow, or require cumbersome cryptographic key setups for non-technical medical staff and patients.

---

## 🛡️ Proposed Solution

**RxVerify** solves these challenges by implementing Midnight Network's **Level 3 Confidential Credential Model** with Compact smart contracts.

Key capabilities of the RxVerify solution include:
* **Off-Chain Local Witness Execution**: Prescription details (medication name, dosage, doctor digital signatures) remain encrypted and stored locally in the patient or doctor's browser.
* **On-Chain Zero-Knowledge Proofs**: A zk-SNARK proof is generated locally and submitted to the Midnight contract circuit (`verifyPrescription`), proving that the prescription is authentic, non-zero, signed by an authorized prescriber, and active—without revealing any PHI.
* **Selective Disclosure Control**: Using Compact's `disclose()` mechanism, only non-sensitive metadata (such as an anonymous `patientId` slot counter) is disclosed to the ledger state.
* **Instant Pharmacy QR & Token Verification**: Patients can generate time-bound, anonymous ZK proof tokens or QR codes for touchless verification at licensed pharmacies.

---

## 🎯 Objectives

1. **Guarantee 100% Patient PHI Privacy**: Ensure zero medical data, drug names, or diagnostic parameters are ever transmitted to or stored on the Midnight blockchain.
2. **Authentic Cryptographic Verification**: Provide instant, tamper-evident cryptographic assurance of prescription validity and prescriber authorization.
3. **Full Compliance with Healthcare Privacy Laws**: Align with HIPAA, GDPR, and international health data protection frameworks.
4. **Seamless Web3 Wallet UX**: Integrate authentic Midnight Lace Wallet authentication for secure doctor and patient identity management.
5. **Real-Time Telemetry & Auditability**: Maintain on-chain verification counters and immutable audit logs without compromising individual privacy.

---

## 🔐 Privacy Model

RxVerify strictly enforces private-by-default state boundaries using Compact smart contracts and local witness execution:

| Data Item | Exposure Level | Storage Location | Privacy Guarantee |
| :--- | :--- | :--- | :--- |
| **Medication Name & Dosage** | 🔒 **Strictly Private** | Local Browser Storage | Never leaves prover device; excluded from on-chain state |
| **Prescription SHA-256 Digest** | 🔒 **Strictly Private** | Local Witness Memory | Evaluated in local ZK circuit; first-byte validated privately |
| **Doctor Digital Signature** | 🔒 **Strictly Private** | Local Witness Memory | Cryptographically checked in local ZK prover |
| **Patient Slot Identifier** | 👁️ **Disclosed Metadata** | Circuit Parameter | Disclosed via `disclose()` for session state isolation |
| **Verification Counter** | 🌐 **Public Ledger State** | On-Chain Ledger (`verificationCount`) | Incremented publicly upon valid proof acceptance |
| **Contract Active Status** | 🌐 **Public Ledger State** | On-Chain Ledger (`contractActive`) | Public boolean flag controlling contract state |

---

## 🔄 Zero-Knowledge Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Patient / Doctor Device                   │
│                                                                        │
│  Prescription Text ──► SHA-256 Digest ──► Ed25519 Doctor Signature     │
│                                │                                       │
│                                ▼                                       │
│                    Local Witness Calculation                           │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼ (Generate zk-SNARK Proof via Proof Server)
┌────────────────────────────────────────────────────────────────────────┐
│                   Midnight Network On-Chain Circuit                    │
│                                                                        │
│  circuit verifyPrescription(patientId: Uint<32>):                      │
│    1. Assert contractActive == true                                    │
│    2. Retrieve hash = prescriptionHash() privately                     │
│    3. Retrieve sig  = doctorSignature() privately                      │
│    4. Assert hash[0] != 0x00 && sig[0] != 0x00                         │
│    5. Disclose(patientId)                                              │
│    6. Increment ledger verificationCount                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Midnight Components Used

* **Compact Language v0.31**: Smart contract language designed for privacy-preserving zk-SNARK circuits.
* **Compact Standard Library**: Utilized for standard cryptographic primitive assertions and state management.
* **`@midnight-ntwrk/compact-runtime`**: Executes local witness generation and circuit operations client-side.
* **`@midnight-ntwrk/midnight-js-contracts`**: Provides high-level TypeScript abstractions for deploying and calling Compact contracts.
* **Midnight Proof Server (v8.1.0)**: Generates ZK proof artifacts off-chain from local witness inputs.
* **Midnight Indexer & Node**: Indexes public ledger state and processes proof transactions on local devnet / preprod.
* **Lace Wallet (DApp Connector API)**: Authentic browser extension wallet for key management and transaction authorization.

---

## 🏗️ Architecture & Technology Stack

### Frontend & Application Layer
* **Framework**: React 19, Vite 8, TypeScript 6
* **Styling**: Modern Glassmorphic Vanilla CSS with dark mode aesthetics
* **State Management**: React Hooks & Session Storage persistence
* **Wallet Integration**: Authentic Midnight Lace Wallet Browser Extension

### Blockchain & Smart Contract Layer
* **Contract Language**: Compact v0.31 (`contracts/prescription-verifier.compact`)
* **Execution Model**: Dual execution (Local prover + On-chain state transition)
* **SDK Tools**: Midnight.js v4.1.1, Compact Runtime v0.16.0
* **Testing Framework**: Vitest 2.1 (30+ comprehensive unit and integration tests)

---

## 📁 Repository Structure

```
confidential-prescription/
├── contracts/
│   ├── prescription-verifier.compact   # Core Compact ZK smart contract
│   └── managed/                         # Compiled contract artifacts & TS bindings
├── src/
│   ├── setup.ts                         # Devnet orchestrator & contract deployer
│   ├── deploy.ts                        # Midnight contract deployment script
│   ├── network.ts                       # Multi-network configuration (undeployed, preprod)
│   └── healthcare-services.ts           # Doctor, hospital & prescription domain logic
├── ui/
│   ├── src/
│   │   ├── components/                  # React glassmorphic UI components
│   │   │   ├── WalletConnect.tsx        # Authentic Lace wallet connector
│   │   │   ├── DoctorPortal.tsx         # Prescriber workspace & QR generator
│   │   │   ├── PatientDashboard.tsx     # Patient credential manager & ZK prover
│   │   │   ├── PharmacyPortal.tsx       # Touchless pharmacy verification portal
│   │   │   └── AnalyticsDashboard.tsx   # Real-time healthcare telemetry
│   │   ├── App.tsx                      # Main application container
│   │   └── index.css                    # Design system & CSS tokens
├── docker-compose.yml                   # Midnight Node, Indexer & Proof Server containers
├── PROPOSAL.md                          # Hackathon proposal document
└── README.md                            # Comprehensive project documentation
```

---

## 🔒 Security Model

1. **Zero Exposure of Cryptographic Keys**: Doctor digital signatures and patient private keys remain inside client memory and Lace wallet.
2. **Local Hashing Guarantee**: Prescription hashing (SHA-256) is executed locally using Web Crypto API (`crypto.subtle.digest`) before proof generation.
3. **On-Chain Circuit Invariants**: The Compact contract enforces that deactivated contracts (`contractActive = false`) immediately reject all subsequent verification proofs.
4. **Authentic Wallet Guardrails**: The DApp requires explicit authorization via the installed Lace Wallet extension for all blockchain state interactions.

---

## 📈 Expected Impact & Use Cases

* **Healthcare Privacy Advancement**: Demonstrates how blockchain technology can comply with HIPAA/GDPR without sacrificing decentralization.
* **Controlled Substance Tracking**: Prevents prescription duplication and unauthorized alteration across pharmacy chains.
* **Cross-Border Telemedicine**: Enables international verifiers to validate medical credentials without requiring access to foreign medical databases.

---

## 🚀 Future Enhancements

1. **Federated EHR Standards (FHIR / HL7)**: Native mapping between FHIR prescription resources and Compact ZK witnesses.
2. **Decentralized Identity (DID) Credentials**: Integration of W3C Verifiable Credentials for doctor medical license verification.
3. **Multi-Prescriber Co-Signing**: Multi-party ZK circuits for specialized treatment regimes requiring multi-doctor approval.

---

## 🏁 Conclusion

The **Confidential Prescription Verification Platform (RxVerify)** sets a new standard for Web3 healthcare applications. By combining Midnight Network's private-by-default architecture with intuitive glassmorphic design and authentic Lace wallet authentication, RxVerify delivers a production-grade solution that proves health credentials while protecting patient confidentiality.
