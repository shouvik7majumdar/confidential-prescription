export interface WalletState {
  address: string;
  coinPublicKey: string;
  network: string;
  isConnected: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface LedgerData {
  verificationCount: bigint;
  contractActive: boolean;
}

export type TabType =
  | 'analytics'
  | 'doctor'
  | 'patient'
  | 'pharmacy'
  | 'history'
  | 'privacy';