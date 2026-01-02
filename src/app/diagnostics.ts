export const isDiagEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('diag') === '1' || localStorage.getItem('DIAG_ENABLED') === '1';
};

/**
 * Global constant for diagnostic mode state.
 */
export const DIAGNOSTIC_MODE = isDiagEnabled();

export interface DiagnosticData {
  pageName: string;
  componentName: string;
  route: string;
  screenId: string;
  recordsLoaded?: number;
  dataSource?: string;
}