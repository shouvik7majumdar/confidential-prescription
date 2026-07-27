import React, { useState, useEffect } from 'react';
import type { WalletState } from '../types';
import { requestLaceConnection, getLaceWalletProvider } from '../wallet-service';

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
      setIsLaceInstalled(Boolean(getLaceWalletProvider()));
    };

    checkLace();
    const interval = setInterval(checkLace, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const connectedWallet = await requestLaceConnection();
      onConnect(connectedWallet);
    } catch (err) {
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