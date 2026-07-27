import React, { useState, useEffect } from 'react';
import type { WalletState } from '../types';

interface WalletConnectProps {
  wallet: WalletState | null;
  onConnect: (wallet: WalletState) => void;
  onDisconnect: () => void;
  onError: (msg: string) => void;
}

export function WalletConnect({ wallet, onConnect, onDisconnect, onError }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLaceInstalled, setIsLaceInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLace = () => {
      const midnight = (window as any).midnight;
      const laceObj = midnight?.mnLace || midnight?.lace;
      setIsLaceInstalled(Boolean(laceObj));
    };

    checkLace();
    const interval = setInterval(checkLace, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const midnight = (window as any).midnight;
      const lace = midnight?.mnLace || midnight?.lace;

      if (!lace) {
        const errorMsg = 'Lace Wallet for Midnight is not installed. Please install the Lace browser extension from https://www.lace.io/ and refresh this page.';
        onError(errorMsg);
        throw new Error(errorMsg);
      }

      // Trigger the authentic Lace Wallet browser permission popup
      const enabledApi = await lace.enable();

      if (!enabledApi) {
        throw new Error('Connection request was rejected in Lace Wallet.');
      }

      // Query connected wallet details using supported Midnight DApp Connector API
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

      const connectedWallet: WalletState = {
        address,
        coinPublicKey: coinPublicKey || 'Authenticated via Lace',
        network: networkId,
        isConnected: true,
      };

      onConnect(connectedWallet);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Lace Wallet for Midnight is not installed')) {
        // Already handled above
        return;
      }
      const msg = err instanceof Error ? err.message : 'Failed to connect Lace wallet';
      onError(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!wallet) {
    return (
      <div className="card animate-slide-up">
        <div className="card-title">
          <span className="card-title-icon">👛</span>
          Connect Lace Wallet
        </div>

        {isLaceInstalled === false && (
          <div className="alert alert-error mb-4" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Lace Wallet Not Detected:</strong> Midnight Lace Wallet extension was not found in your browser. Please install the extension to connect.
            </div>
          </div>
        )}

        <div className="alert alert-info mb-4" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">ℹ️</span>
          <div>
            Connect your authentic <strong>Lace wallet</strong> to issue or verify confidential prescriptions.
            Your private keys and health data never leave your device.
          </div>
        </div>

        <button
          id="wallet-connect-btn"
          className="btn btn-primary btn-lg w-full"
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <><span className="spinner" style={{ borderTopColor: 'white' }} /> Awaiting Lace Approval...</>
          ) : (
            <><span>💊</span> Connect Lace Wallet</>
          )}
        </button>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          <a
            href="https://www.lace.io/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}
          >
            Download Midnight Lace Wallet Extension →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-title">
        <span className="card-title-icon">✅</span>
        Lace Wallet Connected
      </div>

      <div className="wallet-section">
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connected Address</div>
          <div className="wallet-addr" id="wallet-address-display">{wallet.address}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Network</div>
            <div style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{wallet.network}</div>
          </div>
          <div className="tag tag-green">Authentic Lace</div>
        </div>

        <button
          id="wallet-disconnect-btn-card"
          className="btn btn-danger w-full"
          onClick={onDisconnect}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}