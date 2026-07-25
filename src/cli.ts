// cli.ts — Interactive CLI for the Confidential Prescription Verification dApp.

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveNetwork, parseNetworkFlag, getDeployment, GENESIS_SEED, getOrCreateSeed } from './network.js';
import { createWallet, persistWalletState, unshieldedToken } from './wallet.js';
import { prescriptionWitnesses, emptyPrivateState, buildPrivateState } from './prescription-witnesses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv;
const { network, config: networkConfig } = resolveNetwork({ argv });
const SEED = network === 'undeployed' ? GENESIS_SEED : getOrCreateSeed(network);
const PRIVATE_STATE_ID = 'prescription-verifier-state';
const zkConfigPath = path.resolve(__dirname, '../contracts/managed/prescription-verifier');

const { Contract, ledger: getLedger } = await import(path.join(zkConfigPath, 'contract/index.js')) as any;

const compiledContract = (CompiledContract as any).withCompiledFileAssets(
  (CompiledContract as any).withWitnesses((CompiledContract as any).make('prescription-verifier', Contract), prescriptionWitnesses),
  zkConfigPath,
);

async function createProviders(walletCtx: any) {
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Prescription-1';
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: PRIVATE_STATE_ID,
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Confidential Prescription Verification — Midnight dApp       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const rl = createInterface({ input: stdin, output: stdout });
  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`  ❌ No deployment for network "${network}". Run: npm run setup -- --network ${network}\n`);
    process.exit(1);
  }
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Network:  ${network}\n`);

  try {
    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
    const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
    if (restoredCount > 0) console.log(`  Restored ${restoredCount}/3 wallets from state.`);

    console.log('  Syncing with network...');
    const syncStart = Date.now();
    const si = setInterval(() => process.stdout.write(`\r  ⏳ Syncing... (${Math.round((Date.now() - syncStart) / 1000)}s)   `), 5000);
    const state = await walletCtx.wallet.waitForSyncedState();
    clearInterval(si);
    console.log('\r  ✓ Synced!                                           \n');
    await persistWalletState(network, walletCtx);
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    console.log('  Connecting to contract...');
    const providers = await createProviders(walletCtx);
    const deployed: any = await findDeployedContract(providers, {
      compiledContract,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: emptyPrivateState,
    });
    console.log('  ✅ Connected!\n');

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Verify a prescription (private ZK proof)');
      console.log('  2. Read public verification count');
      console.log('  3. Check wallet balance');
      console.log('  4. Exit\n');
      const choice = await rl.question('  Your choice: ');

      switch (choice.trim()) {
        case '1': {
          console.log('\n  ── Private Prescription Verification ──');
          console.log('  ℹ  Your prescription details stay LOCAL. Only a ZK proof is sent on-chain.\n');
          const prescriptionText = await rl.question('  Enter prescription details (stays private): ');
          const patientSlot = await rl.question('  Enter patient slot ID (1-9999): ');
          const slotId = parseInt(patientSlot.trim(), 10) || 1;

          const privateState = buildPrivateState(prescriptionText.trim());
          const hashHex = Buffer.from(privateState.prescriptionHash).toString('hex').substring(0, 16);
          console.log(`\n  Prescription hash: ${hashHex}... (private)`);
          console.log('  Generating ZK proof (30-90 seconds)...\n');

          try {
            await (providers.privateStateProvider as any).set(deployment.address, PRIVATE_STATE_ID, privateState);
            const tx = await deployed.callTx.verifyPrescription(BigInt(slotId));
            console.log(`  ✅ Prescription verified!`);
            console.log(`  Transaction ID: ${tx.public.txId}`);
            console.log(`  Block height:   ${tx.public.blockHeight}`);
            console.log('  Private data:   NOT disclosed on-chain ✓\n');
          } catch (error) {
            console.error('  ❌ Verification failed:', error instanceof Error ? error.message : error);
          }
          break;
        }
        case '2': {
          console.log('\n  Reading public ledger state...');
          try {
            const cs = await providers.publicDataProvider.queryContractState(deployment.address);
            if (cs) {
              const ledger = getLedger(cs.data);
              console.log(`\n  📊 Total verifications: ${ledger.verificationCount}`);
              console.log(`  🟢 Contract active: ${ledger.contractActive}\n`);
            } else {
              console.log('\n  📊 No state available yet\n');
            }
          } catch (e) { console.error('  ❌', e instanceof Error ? e.message : e); }
          break;
        }
        case '3': {
          const s = await walletCtx.wallet.waitForSyncedState();
          const tn = s.unshielded.balances[unshieldedToken().raw] ?? 0n;
          console.log(`\n  tNight: ${tn.toLocaleString()}\n  DUST:   ${s.dust.balance(new Date()).toLocaleString()}\n`);
          break;
        }
        case '4':
          running = false;
          console.log('\n  👋 Goodbye!\n');
          break;
        default:
          console.log('\n  ❌ Invalid choice.\n');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);