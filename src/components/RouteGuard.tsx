import React from 'react';
import { useAppStore } from '../lib/store';
import { ScreenId } from '../rbac/screenIds';
import { canView } from '../rbac/can';
import { Button } from './ui/design-system';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DiagnosticBanner } from './DiagnosticBanner';

interface RouteGuardProps {
  screen: ScreenId;
  children: React.ReactNode;
}

const AccessDenied = ({ screen }: { screen: ScreenId }) => {
  const { currentRole, currentCluster } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-6">
        <ShieldAlert className="h-12 w-12 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        You are currently logged in as <span className="font-semibold text-foreground">{currentRole?.name}</span> ({currentCluster?.name}).
        You do not have permission to view <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-1 rounded">{screen}</span>.
      </p>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
        <Button onClick={() => window.location.reload()}>
          Switch Role
        </Button>
      </div>
      
      <div className="mt-12 text-xs text-muted-foreground border-t pt-4 w-full max-w-sm">
        <p>Tip: Use the role switcher in the top right to change your active persona.</p>
      </div>
    </div>
  );
};

export const RouteGuard: React.FC<RouteGuardProps> = ({ screen, children }) => {
  const { currentCluster } = useAppStore();
  
  // Guard clause: if no cluster loaded yet (refresh case), might need handling or let AuthGate handle it
  if (!currentCluster) return null; 

  const isAllowed = canView(currentCluster.id, screen);

  return (
    <>
      <DiagnosticBanner screenId={screen} />
      {isAllowed ? children : <AccessDenied screen={screen} />}
    </>
  );
};
