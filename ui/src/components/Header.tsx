import React from 'react';
import type { WalletState } from '../types';

interface HeaderProps {
  network: string;
  wallet: WalletState | null;
  onDisconnect: () => void;
}

export function Header({ network, wallet, onDisconnect }: HeaderProps) {
  const networkColors: Record<string, string> = {
    undeployed: '#34d399',
    preview: '#fb923c',
    preprod: '#a78bfa',
    mainnet: '#4da6ff',
  };
  const dotColor = networkColors[network] || '#34d399';

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <a className="logo" href="/">
            <div className="logo-icon">💊</div>
            <div>
              <div className="logo-text">RxVerify</div>
              <div className="logo-sub">Midnight dApp</div>
            </div>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="network-badge">
              <div className="network-dot" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
              <span style={{ color: dotColor, fontWeight: 500 }}>{network}</span>
            </div>

            {wallet && (
              <button
                id="wallet-disconnect-btn"
                className="btn btn-sm btn-outline"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}