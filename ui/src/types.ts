export interface WalletState {
  address: string;
  coinPublicKey: string;
  network: string;
  isConnected: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export interface LedgerData {
  verificationCount: bigint;
  contractActive: boolean;
}