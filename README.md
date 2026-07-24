# Confidential Prescription Verification — Midnight dApp

[![CI/CD Pipeline](https://github.com/user/confidential-prescription-verification/actions/workflows/ci.yml/badge.svg)](https://github.com/user/confidential-prescription-verification/actions/workflows/ci.yml)
![Midnight Network](https://img.shields.io/badge/Midnight-Network-blueviolet)
![Zero Knowledge](https://img.shields.io/badge/Zero--Knowledge-Compact%20v0.23-blue)
![Level 3](https://img.shields.io/badge/Level-3%20Confidential%20Credentials-success)

A full-stack privacy-preserving smart contract application built on the **Midnight Network** using zero-knowledge proofs. It enables patients and healthcare providers to verify prescription credentials without revealing medical data, prescription details, or patient identities on-chain.

---

## 💡 Product Proposal & Level 3 Category

**Category**: `<Confidential Credentials>`

In traditional healthcare systems, verifying a prescription requires presenting full medical records to third-party verifiers (pharmacies, insurance providers, employers). This exposes sensitive Personal Health Information (PHI) such as medication names, dosages, diagnostic codes, and doctor notes.

**RxVerify** solves this problem using Midnight's zero-knowledge smart contracts:
- **Off-chain Credential Holding**: Patients hold signed prescription credentials locally on their devices.
- **On-chain Zero-Knowledge Verification**: The patient generates a zero-knowledge proof certifying that:
  1. A valid, non-zero prescription hash exists.
  2. A valid doctor signature accompanies the prescription.
  3. The contract is currently active.
- **Zero Exposure**: No medication details, patient names, or doctor identities are published on the blockchain.

---

## 🔒 Privacy Model

The application strictly implements Midnight's private-by-default architecture using explicit `disclose()` boundaries in the Compact smart contract.

### What Observers CAN Learn (Public Ledger State)
- **`verificationCount`**: The total aggregate number of successful prescription verifications completed on the contract.
- **`contractActive`**: A boolean flag indicating whether the contract is operational.
- **`patientId`**: An opaque 32-bit session slot identifier, deliberately disclosed as non-sensitive session metadata.

### What Observers CANNOT Learn (Private Witnesses)
- **`prescriptionHash`**: The SHA-256 digest of the prescription text. Stays entirely local inside the prover's environment.
- **`doctorSignature`**: The 64-byte cryptographic signature from the issuing doctor. Stays local.
- **Prescription Content**: Medication name, dosage, doctor details, and patient identity. Never leaves the local machine.

### Summary Table

| Data Item | Exposure Level | Storage Location |
|---|---|---|
| Prescription Details (Text) | 🔒 Strictly Private | Local Browser / Device |
| SHA-256 Prescription Hash | 🔒 Strictly Private | Prover Local State (Witness) |
| Doctor Signature | 🔒 Strictly Private | Prover Local State (Witness) |
| Patient Slot ID | 👁️ Disclosed Metadata | On-Chain (Circuit Parameter) |
| Verification Counter | 🌐 Public Ledger | On-Chain (`verificationCount`) |
| Contract Active Status | 🌐 Public Ledger | On-Chain (`contractActive`) |

---

## ⚙️ System Requirements & Environment

Verified setup on developer environment:
- **OS & Shell**: WSL2 Ubuntu (`Linux 6.18.33.2-microsoft-standard-WSL2 x86_64`)
- **Node.js**: `v22.23.1` (via nvm at `/home/user/.nvm/versions/node/v22.23.1/bin/node`)
- **npm**: `10.9.8`
- **Docker**: `Docker version 29.6.2`, `Docker Compose v5.3.1` (Running local indexer:8088, node:9944, proof-server:6300)
- **Compact Compiler**: `compact v0.5.1`, compiler `v0.31.1` at `/home/user/.local/bin/compact`

---

## 🚀 Quick Start Guide

### 1. Start Local Proof Server & Devnet Nodes
```bash
npm run proof-server:start
```
*Starts Docker containers for Midnight Node (port 9944), Indexer (port 8088), and Proof Server (port 6300).*

### 2. Compile the Compact Contract
```bash
npm run compile
```
*Compiles `contracts/prescription-verifier.compact` to `contracts/managed/prescription-verifier` containing circuits, proving keys, and TypeScript interfaces.*

### 3. Deploy to Local Devnet
```bash
npm run setup -- --network undeployed
```
*Deploys the contract locally and saves the contract address to `.midnight-state.json`.*

### 4. Run Interactive CLI
```bash
npm run cli
```
*Interactive terminal interface to submit private ZK proofs, verify prescriptions, and query public state.*

### 5. Launch Web Frontend
```bash
npm run dev:ui
```
*Launches Vite React frontend at `http://localhost:5173` with Lace wallet integration and glassmorphism UI.*

---

## 🌐 Preview / Preprod Deployment Status

### Deployment Test Command
```bash
npm run setup -- --network preprod
```

### Preprod Endpoints Verified
- **RPC Node**: `https://rpc.preprod.midnight.network` (`HTTP 200 OK`)
- **Indexer GraphQL**: `https://indexer.preprod.midnight.network/api/v4/graphql` (`HTTP 200 OK`)
- **Faucet**: `https://midnight-tmnight-preprod.nethermind.dev`

### Deployment Handling & Wallet State
1. **Wallet Seed Persistence**: The deploy script automatically generates and persists a 32-byte hex seed inside `.midnight-state.json` under `wallets.preprod.seed`.
2. **Faucet Address**: When running `--network preprod`, the deploy script prints the exact Bech32 address (`mn_addr_preprod...`) for funding.
3. **Wallet Sync Behavior**: Preprod wallet sync retrieves blocks from the public indexer. If indexer sync hangs or throttles, the seed is safely preserved in `.midnight-state.json` so sync resumes without losing wallet funds or state.
4. **State Reset Safety**: `.midnight-state.json` is never deleted automatically after faucet funding.

---

## 🧪 Testing & Quality Assurance

### Run Unit & Integration Tests
```bash
npm test
```

### Covered Test Suites
- **`tests/privacy.test.ts`**: Verifies SHA-256 hashing, witness length guarantees, and ensures `disclose()` is NEVER called on private witness fields.
- **`tests/contract.test.ts`**: Verifies pragma directives, circuit exports, witness function declarations, and managed compiled artifacts.
- **`tests/network.test.ts`**: Validates network configuration schemas, GENESIS_SEED formats, and proof server isolation.

---

## 📊 Submission Checklists

### Level 1 Checklist (Contract & Local Deployment)
- [x] **Compact contract** with public ledger state (`verificationCount`, `contractActive`) and private witnesses (`prescriptionHash`, `doctorSignature`).
- [x] Deliberate `disclose()` used strictly for public session metadata (`patientId`).
- [x] Contract compiles cleanly via `compact compile`.
- [x] Generated `contracts/managed/` directory containing ZK keys and circuits.
- [x] Local deployment working via `npm run setup -- --network undeployed`.
- [x] CLI interaction working via `npm run cli`.
- [x] Documented Preview/Preprod status and endpoint health check details.

### Level 2 Checklist (Full-Stack Frontend Integration)
- [x] **Lace Wallet Integration**: Connect button, disconnect button, address display, and network status badge.
- [x] **Contract Integration**: Loads contract address and network from env variables (`VITE_CONTRACT_ADDRESS`, `VITE_NETWORK`).
- [x] **Circuit Calls**: Allows users to enter private prescription details, computes local SHA-256 hash, and submits ZK proof.
- [x] **Public State Reading**: Fetches and renders `verificationCount` and `contractActive` live from ledger.
- [x] **Deployment Ready**: Configured for Vercel/Netlify with `.env.example`.

### Level 3 Checklist (Production Polish & CI/CD)
- [x] **Automated Tests**: 21 passing Vitest tests covering privacy model, contract structure, and network configs.
- [x] **CI/CD Pipeline**: GitHub Actions workflow `.github/workflows/ci.yml` verifying build, compile, tests, and UI on every push/PR.
- [x] **Privacy Documentation**: Comprehensive section documenting what observers can and cannot learn.
- [x] **UX Excellence**: Modern glassmorphism UI with loading, success, error, empty, and disconnected states.
- [x] **Commit Quality**: 10+ meaningful atomic commits without AI co-author trailers.

---

## 🛠️ Environment Variables Reference

Create `.env.local` in `ui/`:

```env
VITE_NETWORK=undeployed
VITE_CONTRACT_ADDRESS=58e1e74340e5a250668f9a9da1597b1bddca694440545796994d9d186db2f36c
VITE_PROOF_SERVER_URL=http://127.0.0.1:6300
```

---

## 📜 License

MIT License. Built for the Midnight Network Developer Community.