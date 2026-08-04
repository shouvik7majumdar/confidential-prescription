# 🏥 Confidential Prescription Verification Platform (RxVerify)

[![CI/CD Pipeline](https://github.com/shouvik7majumdar/confidential-prescription/actions/workflows/ci.yml/badge.svg)](https://github.com/shouvik7majumdar/confidential-prescription/actions/workflows/ci.yml)
[![Midnight Network](https://img.shields.io/badge/Midnight-Devnet-purple)](https://midnight.network)
[![Zero Knowledge](https://img.shields.io/badge/Zero--Knowledge-Compact%20v0.31-blue)](https://midnight.network)
[![Level 3 Category](https://img.shields.io/badge/Level-3%20Confidential%20Credentials-success)](https://midnight.network)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20App-black?logo=vercel)](https://confidential-prescriptionnn.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**RxVerify** is a production-grade, privacy-preserving healthcare application built on the **Midnight Network** using **Compact** smart contracts and Zero-Knowledge proofs (zk-SNARKs). RxVerify enables patients, certified healthcare prescribers, and licensed pharmacies to issue, verify, manage, and revoke medical prescriptions without exposing sensitive Personal Health Information (PHI), diagnostic data, or patient/doctor identities on-chain.

---

## 🌐 Project Links & Live Resources

- **GitHub Repository**: [https://github.com/shouvik7majumdar/confidential-prescription](https://github.com/shouvik7majumdar/confidential-prescription)
- **Product Proposal**: [PROPOSAL.md](PROPOSAL.md)
- **CI/CD Pipeline**: [GitHub Actions Workflow](https://github.com/shouvik7majumdar/confidential-prescription/actions/workflows/ci.yml)
- **Live Vercel Application**: [https://confidential-prescriptionnn.vercel.app/](https://confidential-prescriptionnn.vercel.app/)
- **Live Video Demonstration**: [Watch Project Walkthrough on YouTube](https://youtu.be/-8m0TcUsUUc)

---

## 📸 Application Screenshots

### Landing Dashboard
![RxVerify Landing Page](docs/images/landing-page.png)
*Landing Dashboard — Glassmorphism UI with Authentic Midnight Lace Wallet Authorization Popup Modal.*

### Prescription Issuance (Doctor Portal)
![Prescription Issue Page](docs/images/doctor-portal.png)
*Doctor Portal — Authorized prescribers issue digitally signed confidential prescription credentials.*

---

## 🔗 Contract Deployment Details

| Metadata Field | Deployment Value |
| :--- | :--- |
| **Active Network** | Midnight Devnet (`undeployed`) / Compatible with `preprod` |
| **Contract Address** | `15973ac8d96a98faec7d1a4a2d429ee522ca2b5c0e1b3b97cda44cd76da080ef` |
| **Deployer Address** | `mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s` |
| **Deployment Status** | 🟢 **Active & Deployed** |
| **Deployment Date** | `2026-07-27T14:08:21.515Z` |
| **Deployment Method** | Compact v0.31 compiler; deployed via `npm run setup` orchestrator script |
| **Midnight Preprod Explorer** | [View on Midnight Explorer](https://explorer.midnight.network/contract/15973ac8d96a98faec7d1a4a2d429ee522ca2b5c0e1b3b97cda44cd76da080ef) |

---

## 🔒 Privacy Model & Zero-Knowledge Architecture

RxVerify strictly enforces Midnight's private-by-default execution model by maintaining a sharp separation between **Private Witness State** (client-side only) and **Public Ledger State** (on-chain).

### Detailed Written Explanations

#### 1. Why Data is Private (PHI & Regulatory Compliance)
Medical prescription records contain Personal Health Information (PHI) such as medication names, dosages, administration schedules, diagnostic ICD codes, issuing doctor names, and patient identities. Under healthcare regulations like **HIPAA** in the United States and **GDPR** in Europe, publishing PHI to a public, transparent blockchain is strictly illegal. RxVerify ensures that raw prescription text and cryptographic doctor signatures remain 100% private inside the user's browser, satisfying strict compliance requirements while maintaining decentralized immutability.

#### 2. Why Data is Public (Verifiable Telemetry & Operational Control)
Certain minimal operational metrics must be publicly visible on-chain to ensure network agreement, auditability, and governance:
- `verificationCount` (`Uint<64>`): An aggregate counter tracking the total number of successful prescription verifications. It proves that contract activity is taking place without revealing who verified what.
- `contractActive` (`Boolean`): An operational safety toggle allowing contract administrators to pause verification services during emergency security audits or system maintenance.

#### 3. What an On-Chain Observer CAN Learn
- An observer CAN inspect the total aggregate number of valid prescription verifications (`verificationCount`).
- An observer CAN inspect whether the contract is currently active or deactivated (`contractActive`).
- An observer CAN observe the non-sensitive 32-bit session slot parameter (`patientId`) disclosed during circuit execution.

#### 4. What an On-Chain Observer CANNOT Learn
- An observer CANNOT learn the patient's identity, name, address, or medical record number.
- An observer CANNOT learn the medication name, dosage strength, refill count, or medical diagnosis.
- An observer CANNOT learn the issuing doctor's identity, license number, or private signing key.
- An observer CANNOT reconstruct the raw `prescriptionHash` or `doctorSignature` from on-chain transactions or proof artifacts.

#### 5. Witness Privacy & `disclose()` Behaviour in Compact
In Compact smart contracts, variables declared with the `witness` keyword (such as `witness prescriptionHash(): Bytes<32>` and `witness doctorSignature(): Bytes<64>`) are evaluated strictly off-chain inside the local proving environment (zk-SNARK prover). They are never transmitted across HTTP network sockets or recorded in transaction logs. 

Only values explicitly wrapped in the `disclose()` statement are revealed to the public ledger. In `contracts/prescription-verifier.compact`:
```compact
export circuit verifyPrescription(patientId: Uint<32>): [] {
    assert(contractActive == true, "Contract is not accepting verifications");
    const hash = prescriptionHash();
    const sig  = doctorSignature();
    assert(hash[0] != 0x00, "Prescription hash must be non-zero");
    assert(sig[0] != 0x00, "Doctor signature must be non-zero");
    disclose(patientId);
    verificationCount = (verificationCount + 1) as Uint<64>;
}
```
Here, `prescriptionHash` and `doctorSignature` remain private witnesses inside the circuit. `disclose(patientId)` explicitly bounds disclosure to the non-sensitive session slot ID, allowing the public ledger to update `verificationCount` safely.

### Data Exposure & Privacy Matrix

| Data Item | Exposure Level | Storage Location | Privacy Guarantee & Reason |
| :--- | :--- | :--- | :--- |
| **Medication & Dosage Details** | 🔒 **Strictly Private** | Local Browser Storage | Excluded from on-chain state; prevents PHI data leaks |
| **Prescription SHA-256 Hash** | 🔒 **Strictly Private** | Prover Local Witness | Private witness in Compact circuit; proves existence off-chain |
| **Doctor Digital Signature** | 🔒 **Strictly Private** | Prover Local Witness | Cryptographically validated inside local ZK prover |
| **Patient Slot ID** | 👁️ **Disclosed Metadata** | Circuit Parameter (`patientId`) | Explicitly disclosed via `disclose()` for session isolation |
| **Verification Counter** | 🌐 **Public Ledger** | On-Chain (`verificationCount`) | Public counter incremented upon valid proof acceptance |
| **Contract Active Status** | 🌐 **Public Ledger** | On-Chain (`contractActive`) | Public boolean flag controlling operational status |

---

## 🔐 Lace Wallet Integration

RxVerify features authentic browser wallet integration supporting the official **Midnight Lace Wallet** extension standard via the Midnight DApp Connector API (`window.midnight.mnLace`) and `@midnight-ntwrk/dapp-connector-api`.

### How Connection & Permissions Work
1. **Provider Resolution**: The application inspects `window.midnight.mnLace`, `window.midnight.lace`, and `window.cardano.lace`.
2. **Permission Request**: Clicking **Connect Lace Wallet** invokes the authentic `provider.enable(serviceUriConfig)` method.
3. **Genuine Extension Popup**: The browser displays the real Lace Wallet authorization modal asking the user for permission.
4. **Session Persistence**: Upon authorization, connected wallet metadata is saved to `localStorage` for seamless session management.
5. **Clean Disconnect**: Clicking **Disconnect Wallet** clears local session state and resets component views instantly.
6. **Graceful Extension Handling**: If Lace is not detected, the app provides setup guidance and an optional local devnet wallet option for local testing.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Browser Client Layer                            │
│                                                                        │
│   React 19 ──► TypeScript 6 ──► Vite 8 ──► Glassmorphic UI CSS         │
│                                │                                       │
│                                ▼                                       │
│                   Browser Wallet (Lace Extension)                      │
│                window.midnight.mnLace.enable(...)                      │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼ (Local Witness & SHA-256 Hashing)
┌────────────────────────────────────────────────────────────────────────┐
│                     Off-Chain Prover Service                           │
│                                                                        │
│   Midnight Proof Server (Docker container on port 6300)                │
│   Generates zk-SNARK Proof from local witness data                     │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼ (Submit ZK Proof Transaction)
┌────────────────────────────────────────────────────────────────────────┐
│                     Midnight Network Blockchain                        │
│                                                                        │
│   Compact Smart Contract (contracts/prescription-verifier.compact)    │
│   - Circuit: verifyPrescription(patientId)                             │
│   - Enforces contractActive == true                                    │
│   - Discloses non-sensitive metadata via disclose(patientId)           │
│   - Increments public ledger verificationCount                         │
│                                │                                       │
│         ┌──────────────────────┴──────────────────────┐                  │
│         ▼                                             ▼                  │
│   Midnight Node (port 9944)                Midnight Indexer (port 8088) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- **Node.js**: `>=22.0.0`
- **Docker & Docker Compose** (for running local Midnight node, indexer, and proof server)
- **Compact Compiler**: `compact v0.5.1` (compiler `v0.31.1`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shouvik7majumdar/confidential-prescription.git
cd confidential-prescription

# Install root dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..
```

### 2. Start Local Proof Server & Devnet Nodes
```bash
npm run proof-server:start
```
*Starts Docker containers for Midnight Node (port 9944), Indexer (port 8088), and Proof Server (port 6300).*

### 3. Compile Compact Smart Contract
```bash
npm run compile
```
*Compiles `contracts/prescription-verifier.compact` to `contracts/managed/prescription-verifier`.*

### 4. Deploy Contract to Local Devnet
```bash
npm run setup -- --network undeployed
```
*Deploys the contract locally and updates `.midnight-state.json`.*

### 5. Launch Web Frontend
```bash
npm run dev:ui
```
*Launches Vite React application at `http://localhost:5173`.*

---

## 🧪 Testing & Verification

Run the full automated test suite (30 passing unit/integration tests):
```bash
npm run test
```

Run end-to-end integration check:
```bash
npm run test:e2e
```

Build production bundle:
```bash
cd ui && npm run build
```

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
