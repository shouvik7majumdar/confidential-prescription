declare module '@midnight-ntwrk/dapp-connector-api' {
  export interface DAppConnectorAPI {
    name?: string;
    icon?: string;
    apiVersion?: string;
    enable(serviceUriConfig?: any): Promise<DAppConnectorWalletAPI>;
    isEnabled(): Promise<boolean>;
  }

  export interface DAppConnectorWalletAPI {
    state(): Promise<{
      address?: string;
      addressHex?: string;
      coinPublicKey?: string;
      networkId?: string;
    }>;
    getAddress?(): Promise<string>;
    coinPublicKey?(): Promise<string | object>;
    getNetworkId?(): Promise<string | number>;
    getUsedAddresses?(): Promise<string[]>;
    getUnusedAddresses?(): Promise<string[]>;
  }
}
