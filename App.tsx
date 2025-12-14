import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './src/components/Layout';
import Dashboard from './src/pages/Dashboard';
import Batches from './src/pages/Batches';
import Telemetry from './src/pages/Telemetry';
import { useAppStore } from './src/lib/store';

// Placeholder components for routes not fully implemented in this demo
const Batteries = () => <div className="p-8 text-center text-muted-foreground">Battery List & Provisioning Module Placeholder</div>;
const EOL = () => <div className="p-8 text-center text-muted-foreground">End of Line QA & Certification Module Placeholder</div>;
const Logistics = () => <div className="p-8 text-center text-muted-foreground">Inventory & Dispatch Module Placeholder</div>;

// Toast Component
const ToastContainer = () => {
  const notifications = useAppStore(state => state.notifications);
  const removeNotification = useAppStore(state => state.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <div key={n.id} className={`p-4 rounded-md shadow-lg border min-w-[300px] flex justify-between items-center ${
          n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
          'bg-white border-slate-200 text-slate-800'
        }`}>
          <div>
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm opacity-90">{n.message}</div>
          </div>
          <button onClick={() => removeNotification(n.id)} className="ml-4 hover:opacity-70">X</button>
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="batches" element={<Batches />} />
          <Route path="batteries" element={<Batteries />} />
          <Route path="telemetry" element={<Telemetry />} />
          <Route path="provisioning" element={<Batteries />} />
          <Route path="eol" element={<EOL />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="compliance" element={<div className="p-8">Compliance Digital Record Placeholder</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;