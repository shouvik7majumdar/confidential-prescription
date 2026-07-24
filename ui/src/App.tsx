import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { WalletConnect } from './components/WalletConnect';
import { PrescriptionVerifier } from './components/PrescriptionVerifier';
import { LedgerState } from './components/LedgerState';
import { PrivacyModel } from './components/PrivacyModel';
import { ToastContainer } from './components/Toast';
import type { WalletState, Toast } from './types';

function App() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [verificationCount, setVerificationCount] = useState<bigint | null>(null);
  const [contractActive, setContractActive] = useState<boolean | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const onVerified = useCallback(() => {
    setVerificationCount(prev => prev !== null ? prev + 1n : 1n);
    addToast('Prescription verified on-chain! ZK proof submitted.', 'success');
  }, [addToast]);

  const network = import.meta.env.VITE_NETWORK || 'undeployed';
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header network={network} wallet={wallet} onDisconnect={() => setWallet(null)} />

      <main className="main-content">
        <section className="hero">
          <div className="container">
            <div className="hero-eyebrow">
              <span>🔒</span>
              Zero-Knowledge Healthcare Privacy
            </div>
            <h1>
              <span className="gradient-text">Confidential</span>
              {' '}Prescription<br />Verification
            </h1>
            <p className="hero-desc">
              Prove your prescription is valid without revealing what it contains.
              Powered by Midnight Network zero-knowledge proofs — your medical data
              stays private, on your device.
            </p>

            <div className="stats-row animate-fade-in">
              <div className="stat-card">
                <div className="stat-value gradient-text">
                  {verificationCount !== null ? verificationCount.toString() : <span className="text-muted">—</span>}
                </div>
                <div className="stat-label">Verifications</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: contractActive === null ? 'var(--text-muted)' : contractActive ? '#34d399' : '#fc8181' }}>
                  {contractActive === null ? '—' : contractActive ? 'Active' : 'Paused'}
                </div>
                <div className="stat-label">Contract Status</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#a78bfa' }}>ZK</div>
                <div className="stat-label">Proof System</div>
              </div>
            </div>
          </div>
        </section>

        <div className="container">
          <div className="main-grid animate-slide-up">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <WalletConnect
                wallet={wallet}
                onConnect={setWallet}
                onDisconnect={() => setWallet(null)}
                onError={(msg) => addToast(msg, 'error')}
              />
              <LedgerState
                contractAddress={contractAddress}
                network={network}
                verificationCount={verificationCount}
                contractActive={contractActive}
                onStateLoaded={(count, active) => {
                  setVerificationCount(count);
                  setContractActive(active);
                }}
              />
            </div>

            <div>
              <PrescriptionVerifier
                wallet={wallet}
                contractAddress={contractAddress}
                network={network}
                onVerified={onVerified}
                onError={(msg) => addToast(msg, 'error')}
              />
            </div>
          </div>

          <PrivacyModel />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            Built on{' '}
            <a href="https://midnight.network" target="_blank" rel="noopener noreferrer">Midnight Network</a>
            {' '}· Zero-Knowledge Proofs · Medical Data Never Leaves Your Device
          </p>
        </div>
      </footer>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App;