
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent } from '../components/ui/design-system';
import { Home, Compass, Map, Search, Loader2 } from 'lucide-react';
import { routerSafe } from '../utils/routerSafe';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auto-recovery: redirect to last good route after 1.5s to give user time to read
    const timer = setTimeout(() => {
      const safePath = routerSafe.getLastGoodRoute();
      console.warn(`[RouterSafe] Invalid path ${location.pathname} detected. Auto-recovering to ${safePath}`);
      navigate(safePath, { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, location]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    const safePath = routerSafe.getLastGoodRoute();
    navigate(safePath, { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative h-32 w-32 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-primary shadow-2xl">
          <Compass size={64} className="text-primary animate-spin-slow" />
        </div>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
        Unknown Coordinates
      </h1>
      
      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        The pathway <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-sm text-primary">{location.pathname}</code> is not registered.
      </p>

      <Card className="w-full max-w-sm border-dashed border-2 bg-transparent mb-10">
        <CardContent className="p-4 flex items-center gap-4 text-left">
          <Loader2 className="text-primary h-6 w-6 animate-spin shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto-Recovery Active</p>
            <p className="text-sm">Returning you to the last valid sector in a moment...</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="gap-2 h-12 px-8 shadow-lg shadow-primary/20" onClick={handleGoHome}>
          <Home size={18} /> Return to Dashboard
        </Button>
        <Button size="lg" variant="outline" className="gap-2 h-12 px-8" onClick={handleGoBack}>
          <Map size={18} /> Return to Last Page
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}} />
    </div>
  );
}
