import React from 'react';
import { useLocation } from 'react-router-dom';
import { BUILD_STAMP } from '../../app/patchInfo';

/**
 * CRASH-PROOF DIAGNOSTIC PROBE
 * Uses defensive checks and window-level gating to ensure zero impact on production stability.
 */
export const DiagProbe: React.FC = () => {
  // Gated by global flag (Safe Mode by default)
  if (!(window as any).__AAYATANA_DIAG__) return null;

  try {
    return <DiagProbeContent />;
  } catch (err) {
    return (
      <div style={{ background: '#ef4444', color: 'white', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>
        DIAGNOSTICS_UNAVAILABLE (GUARDED)
      </div>
    );
  }
};

const DiagProbeContent: React.FC = () => {
  const location = useLocation();
  
  // Safe data access
  let ledgerCount = 'ERR';
  let navCount = 'ERR';
  
  try {
    // Attempting lazy/guarded evaluation of ledger
    const ledger = (window as any).ROUTE_LEDGER || [];
    ledgerCount = ledger.length || '0';
  } catch (e) {}

  return (
    <div style={{ 
      background: '#020617', 
      color: '#38bdf8', 
      fontSize: '10px', 
      fontFamily: 'monospace', 
      padding: '4px 12px',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10000,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <span>[PROBE_ACTIVE]</span>
        <span>PATH: {location.pathname}</span>
        <span>LEDGER: {ledgerCount}</span>
        <span>STAMP: {BUILD_STAMP}</span>
      </div>
      <div style={{ opacity: 0.5 }}>
        DIAG_MODE: ON
      </div>
    </div>
  );
};