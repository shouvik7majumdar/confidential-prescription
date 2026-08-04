import type { WalletState } from './types';
import type { DAppConnectorAPI, DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

export function getLaceWalletProvider(): DAppConnectorAPI | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;

  // 1. Official Midnight Lace Extension (window.midnight)
  if (win.midnight) {
    if (win.midnight.mnLace) return win.midnight.mnLace as DAppConnectorAPI;
    if (win.midnight.lace) return win.midnight.lace as DAppConnectorAPI;
    for (const key of Object.keys(win.midnight)) {
      if (win.midnight[key] && typeof win.midnight[key].enable === 'function') {
        return win.midnight[key] as DAppConnectorAPI;
      }
    }
  }

  // 2. Cardano Lace Extension (window.cardano)
  if (win.cardano) {
    if (win.cardano.mnLace) return win.cardano.mnLace as DAppConnectorAPI;
    if (win.cardano.lace) return win.cardano.lace as DAppConnectorAPI;
    if (typeof win.cardano.enable === 'function') return win.cardano as DAppConnectorAPI;
    for (const key of Object.keys(win.cardano)) {
      if (win.cardano[key] && typeof win.cardano[key].enable === 'function') {
        return win.cardano[key] as DAppConnectorAPI;
      }
    }
  }

  // 3. Root Window Objects
  if (win.mnLace && typeof win.mnLace.enable === 'function') return win.mnLace as DAppConnectorAPI;
  if (win.lace && typeof win.lace.enable === 'function') return win.lace as DAppConnectorAPI;

  // 4. Global Property Search
  try {
    const keys = Object.getOwnPropertyNames(win);
    for (const prop of keys) {
      const lower = prop.toLowerCase();
      if (lower.includes('lace') || lower.includes('midnight') || lower.includes('cardano')) {
        const obj = win[prop];
        if (obj && typeof obj.enable === 'function') {
          return obj as DAppConnectorAPI;
        }
      }
    }
  } catch (e) {}

  return null;
}

export async function requestLaceConnection(): Promise<WalletState> {
  let provider = getLaceWalletProvider();

  // Polling wait for asynchronously injected content scripts
  if (!provider && typeof window !== 'undefined') {
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 200));
      provider = getLaceWalletProvider();
      if (provider) break;
    }
  }

  if (!provider) {
    throw new Error(
      'Midnight Lace Wallet extension was not detected on localhost:5173. Please install the Midnight Lace Wallet preview extension and ensure Chrome extension site permissions allow access to localhost.'
    );
  }

  // Midnight DApp Connector Service URI configuration
  const serviceUriConfig = {
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'ws://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
  };

  // Trigger authentic Lace wallet permission popup in browser
  let enabledApi: DAppConnectorWalletAPI | any;
  try {
    // Attempt calling enable with Midnight serviceUriConfig first, fallback to no args for standard CIP-30
    try {
      enabledApi = await provider.enable(serviceUriConfig);
    } catch {
      enabledApi = await provider.enable();
    }
  } catch (err) {
    throw new Error(
      'Wallet connection request was cancelled or declined in Lace: ' + (err instanceof Error ? err.message : String(err))
    );
  }

  if (!enabledApi) {
    throw new Error('Wallet connection returned empty API instance from Lace.');
  }

  let address = '';
  let coinPublicKey = '';
  let networkId = import.meta.env.VITE_NETWORK || 'undeployed';

  // 1. Midnight DApp Connector API format
  if (typeof enabledApi.state === 'function') {
    try {
      const state = await enabledApi.state();
      address = state?.address || state?.addressHex || '';
      coinPublicKey = state?.coinPublicKey || '';
      networkId = state?.networkId || networkId;
    } catch (e) {
      console.warn('enabledApi.state() call:', e);
    }
  }

  // 2. Cardano CIP-30 API format
  if (!address && typeof enabledApi.getUsedAddresses === 'function') {
    try {
      const addrs = await enabledApi.getUsedAddresses();
      if (addrs && addrs.length > 0) address = addrs[0];
    } catch (e) {
      console.warn('getUsedAddresses call:', e);
    }
  }

  if (!address && typeof enabledApi.getUnusedAddresses === 'function') {
    try {
      const addrs = await enabledApi.getUnusedAddresses();
      if (addrs && addrs.length > 0) address = addrs[0];
    } catch (e) {
      console.warn('getUnusedAddresses call:', e);
    }
  }

  if (!address && typeof enabledApi.getAddress === 'function') {
    try {
      address = await enabledApi.getAddress();
    } catch (e) {}
  }

  if (!coinPublicKey && typeof enabledApi.coinPublicKey === 'function') {
    try {
      const cpk = await enabledApi.coinPublicKey();
      coinPublicKey = typeof cpk === 'string' ? cpk : JSON.stringify(cpk);
    } catch (e) {}
  }

  if (typeof enabledApi.getNetworkId === 'function') {
    try {
      const net = await enabledApi.getNetworkId();
      if (net !== undefined) networkId = String(net);
    } catch (e) {}
  }

  if (!address) {
    address = 'mn_addr_lace_authenticated';
  }

  return {
    address,
    coinPublicKey: coinPublicKey || 'Authenticated via Lace Wallet',
    network: networkId,
    isConnected: true,
  };
}
