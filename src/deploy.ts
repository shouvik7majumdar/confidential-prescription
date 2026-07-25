// deploy.ts — Deploy the confidential-prescription-verifier contract.

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Rx from 'rxjs';
import {
  resolveNetwork, parseNetworkFlag, setActiveNetwork,
  getOrCreateSeed, recordDeployment, GENESIS_SEED,
} from './network.js';
import { createWallet, persistWalletState, unshieldedToken } from './wallet.js';
import { prescriptionWitnesses, emptyPrivateState } from './prescription-witnesses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '../contracts/managed/prescription-verifier');

const { Contract } = await import(path.join(zkConfigPath, 'contract/index.js')) as any;

const compiledContract = (CompiledContract as any).withCompiledFileAssets(
  (CompiledContract as any).withWitnesses((CompiledContract as any).make('prescription-verifier', Contract), prescriptionWitnesses),
  zkConfigPath,
);

const PRIVATE_STATE_ID = 'prescription-verifier-state';

async function waitForProofServer(url: string, timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(`${url}/provingKey`).catch(() => null);
      if (resp) return true;
    } catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

async function createProviders(walletCtx: any, networkConfig: any) {
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

async function main(): Promise<void> {
  const argv = process.argv;
  const flag = parseNetworkFlag(argv);
  if (flag) setActiveNetwork(flag);
  const { network, config: networkConfig } = resolveNetwork({ argv });

  console.log('\n─── Confidential Prescription Verifier — Deploy ──────────────────\n');
  console.log(`  Network: ${network}`);
  console.log(`  Node:    ${networkConfig.node}`);
  console.log(`  Indexer: ${networkConfig.indexer}\n`);

  const SEED = network === 'undeployed' ? GENESIS_SEED : getOrCreateSeed(network);
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });

  console.log('─── Wallet Setup ─────────────────────────────────────────────\n');
  console.log('  Syncing wallet...');
  const syncStart = Date.now();
  const si = setInterval(() => process.stdout.write(`\r  ⏳ Syncing... (${Math.round((Date.now() - syncStart) / 1000)}s)`), 3000);
  const state = await walletCtx.wallet.waitForSyncedState();
  clearInterval(si);
  console.log('\n  ✓ Synced!\n');

  await persistWalletState(network, walletCtx);

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  Address: ${address}`);
  console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

  if (network !== 'undeployed' && balance === 0n && networkConfig.faucet) {
    console.log('  ⚠ Wallet has no tNight. Fund it:');
    console.log(`     ${networkConfig.faucet}`);
    console.log(`     Address: ${address}\n`);
    const fundStart = Date.now();
    while (true) {
      await new Promise(r => setTimeout(r, 10_000));
      const s = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((x: any) => x.isSynced)));
      const tn = s.unshielded.balances[unshieldedToken().raw] ?? 0n;
      if (tn > 0n) { console.log(`\n  Funded! tNIGHT: ${tn.toLocaleString()}\n`); break; }
      if (Date.now() - fundStart > 10 * 60 * 1000) {
        console.log('\n  ❌ Funding timeout.'); await walletCtx.wallet.stop(); process.exit(1);
      }
      process.stdout.write(`\r  Waiting... (${Math.round((Date.now() - fundStart) / 1000)}s)`);
    }
  }

  // DUST
  console.log('─── DUST Token Setup ─────────────────────────────────────────\n');
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)));
  const unregisteredUtxos = dustState.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
  if (unregisteredUtxos.length > 0) {
    console.log(`  Registering ${unregisteredUtxos.length} UTXOs for DUST...`);
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregisteredUtxos,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload: any) => walletCtx.unshieldedKeystore.signData(payload),
    );
    await walletCtx.wallet.submitTransaction(await walletCtx.wallet.finalizeRecipe(recipe));
  }
  if (dustState.dust.balance(new Date()) === 0n) {
    console.log('  Waiting for DUST...');
    await Rx.firstValueFrom(walletCtx.wallet.state().pipe(
      Rx.throttleTime(5000), Rx.filter((s: any) => s.isSynced), Rx.filter((s: any) => s.dust.balance(new Date()) > 0n),
    ));
  }
  console.log('  DUST ready!\n');

  // Deploy
  console.log('─── Deploy Contract ──────────────────────────────────────────\n');
  if (!(await waitForProofServer(networkConfig.proofServer))) {
    console.log('  ❌ Proof server not responding. Run: docker compose up -d\n');
    await walletCtx.wallet.stop(); process.exit(1);
  }
  console.log('  Proof server ready!');

  const providers = await createProviders(walletCtx, networkConfig);
  await new Promise(r => setTimeout(r, 6000));

  let deployed: any;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract,
        args: [],
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: emptyPrivateState,
      });
      break;
    } catch (err: any) {
      const full = `${err?.message || ''} ${err?.cause?.message || ''}`;
      const isDust = full.includes('Not enough Dust') || full.includes('Insufficient Funds');
      if (!(isDust && attempt === 1)) console.error(`\n  Attempt ${attempt}: ${err?.message}`);
      if (!isDust && full.includes('ECONNREFUSED')) { console.log('  ❌ Proof server unreachable.'); await walletCtx.wallet.stop(); process.exit(1); }
      if (isDust && attempt < 20) { if (attempt === 1) console.log('  Generating DUST...'); await new Promise(r => setTimeout(r, 5000)); }
      else if (!isDust) throw err;
    }
  }

  if (!deployed) throw new Error('Deployment failed');

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log('  ✅ Contract deployed!\n');
  console.log(`  Contract Address: ${contractAddress}\n`);
  recordDeployment(network, contractAddress, address.toString());
  console.log('  Saved to .midnight-state.json\n');
  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
  console.log('─── Deployment complete ──────────────────────────────────────\n');
  console.log('  Next: npm run cli\n');
}

main().catch((err) => { console.error(err); process.exit(1); });