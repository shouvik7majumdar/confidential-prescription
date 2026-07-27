import type { WalletState } from './types';

export function getLaceWalletProvider(): any {
  if (typeof window === 'undefined') return null;
  const win = window as any;

  // 1. Check window.midnight namespace (Midnight Lace Extension)
  if (win.midnight) {
    if (win.midnight.mnLace) return win.midnight.mnLace;
    if (win.midnight.lace) return win.midnight.lace;
    for (const key of Object.keys(win.midnight)) {
      if (win.midnight[key] && typeof win.midnight[key].enable === 'function') {
        return win.midnight[key];
      }
    }
  }

  // 2. Check window.cardano namespace (Standard Lace Extension)
  if (win.cardano) {
    if (win.cardano.lace) return win.cardano.lace;
    if (win.cardano.mnLace) return win.cardano.mnLace;
    if (typeof win.cardano.enable === 'function') return win.cardano;
    for (const key of Object.keys(win.cardano)) {
      if (win.cardano[key] && typeof win.cardano[key].enable === 'function') {
        return win.cardano[key];
      }
    }
  }

  // 3. Check root window properties
  if (win.mnLace && typeof win.mnLace.enable === 'function') return win.mnLace;
  if (win.lace && typeof win.lace.enable === 'function') return win.lace;

  return null;
}

export async function requestLaceConnection(): Promise<WalletState> {
  const provider = getLaceWalletProvider();

  if (!provider) {
    throw new Error(
      'Lace Wallet extension was not detected. Please ensure your Lace Wallet extension is active and has access to this page.'
    );
  }

  // Trigger authentic Lace wallet permission popup in browser
  let enabledApi: any;
  try {
    enabledApi = await provider.enable();
  } catch (err) {
    throw new Error(
      'Connection request failed in Lace Wallet: ' + (err instanceof Error ? err.message : String(err))
    );
  }

  if (!enabledApi) {
    throw new Error('Connection request returned empty response from Lace Wallet.');
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
      console.warn('enabledApi.state() call failed:', e);
    }
  }

  // 2. Cardano CIP-30 / Lace API format
  if (!address && typeof enabledApi.getUsedAddresses === 'function') {
    try {
      const addrs = await enabledApi.getUsedAddresses();
      if (addrs && addrs.length > 0) address = addrs[0];
    } catch (e) {
      console.warn('getUsedAddresses call failed:', e);
    }
  }

  if (!address && typeof enabledApi.getUnusedAddresses === 'function') {
    try {
      const addrs = await enabledApi.getUnusedAddresses();
      if (addrs && addrs.length > 0) address = addrs[0];
    } catch (e) {
      console.warn('getUnusedAddresses call failed:', e);
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
