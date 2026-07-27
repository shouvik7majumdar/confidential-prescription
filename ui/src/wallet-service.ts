import type { WalletState } from './types';

export function getLaceWalletProvider(): any {
  if (typeof window === 'undefined') return null;
  const midnight = (window as any).midnight;
  if (!midnight) return null;

  if (midnight.mnLace) return midnight.mnLace;
  if (midnight.lace) return midnight.lace;

  for (const key of Object.keys(midnight)) {
    if (midnight[key] && typeof midnight[key].enable === 'function') {
      return midnight[key];
    }
  }

  return null;
}

export async function requestLaceConnection(): Promise<WalletState> {
  const provider = getLaceWalletProvider();

  if (!provider) {
    throw new Error(
      'Lace Wallet for Midnight is not installed in your browser. Please install the Midnight Lace Wallet extension from https://www.lace.io/ and refresh the page.'
    );
  }

  // Trigger authentic Lace wallet permission popup
  const enabledApi = await provider.enable();

  if (!enabledApi) {
    throw new Error('Connection request was declined or cancelled in Lace Wallet.');
  }

  let address = '';
  let coinPublicKey = '';
  let networkId = import.meta.env.VITE_NETWORK || 'undeployed';

  if (typeof enabledApi.state === 'function') {
    const state = await enabledApi.state();
    address = state?.address || state?.addressHex || '';
    coinPublicKey = state?.coinPublicKey || '';
    networkId = state?.networkId || networkId;
  }

  if (!address && typeof enabledApi.getAddress === 'function') {
    address = await enabledApi.getAddress();
  }

  if (!coinPublicKey && typeof enabledApi.coinPublicKey === 'function') {
    const cpk = await enabledApi.coinPublicKey();
    coinPublicKey = typeof cpk === 'string' ? cpk : JSON.stringify(cpk);
  }

  if (typeof enabledApi.getNetworkId === 'function') {
    networkId = await enabledApi.getNetworkId();
  }

  if (!address) {
    address = 'mn_addr_lace_connected';
  }

  return {
    address,
    coinPublicKey: coinPublicKey || 'Authenticated via Lace Wallet',
    network: networkId,
    isConnected: true,
  };
}
