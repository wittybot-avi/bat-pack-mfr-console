import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './src/components/Layout';
import { RouteGuard } from './src/components/RouteGuard';
import { AuthGate } from './src/components/AuthGate';
import { ScreenId } from './src/rbac/screenIds';
import { useAppStore } from './src/lib/store';

// Pages
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import Batches from './src/pages/Batches';
import BatchDetail from './src/pages/BatchDetail';
import Batteries from './src/pages/Batteries';
import BatteryDetail from './src/pages/BatteryDetail';
import Telemetry from './src/pages/Telemetry';
import Analytics from './src/pages/Analytics';
import ProvisioningConsole from './src/pages/ProvisioningConsole';
import ProvisioningStationSetup from './src/pages/ProvisioningStationSetup';
import EolStation from './src/pages/EolStation';
import EolStationSetup from './src/pages/EolStationSetup';
import InventoryList from './src/pages/InventoryList';
import DispatchList from './src/pages/DispatchList';
import DispatchDetail from './src/pages/DispatchDetail';
import RbacAdmin from './src/pages/RbacAdmin';
import Placeholder from './src/pages/Placeholder';
import Compliance from './src/pages/Compliance';
import Custody from './src/pages/Custody';
import CustodyDetail from './src/pages/CustodyDetail';
import Warranty from './src/pages/Warranty';
import WarrantyDetail from './src/pages/WarrantyDetail';
import WarrantyIntake from './src/pages/WarrantyIntake';
import Settings from './src/pages/Settings';

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
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <AuthGate>
            <Layout />
          </AuthGate>
        }>
          
          <Route index element={
            <RouteGuard screen={ScreenId.DASHBOARD}>
              <Dashboard />
            </RouteGuard>
          } />

          <Route path="batches" element={
            <RouteGuard screen={ScreenId.BATCHES_LIST}>
              <Batches />
            </RouteGuard>
          } />

          <Route path="batches/:id" element={
            <RouteGuard screen={ScreenId.BATCHES_DETAIL}>
              <BatchDetail />
            </RouteGuard>
          } />

          <Route path="telemetry" element={
            <RouteGuard screen={ScreenId.TELEMETRY}>
              <Telemetry />
            </RouteGuard>
          } />

          <Route path="batteries" element={
            <RouteGuard screen={ScreenId.BATTERIES_LIST}>
              <Batteries />
            </RouteGuard>
          } />

          <Route path="batteries/:id" element={
            <RouteGuard screen={ScreenId.BATTERIES_DETAIL}>
              <BatteryDetail />
            </RouteGuard>
          } />

          <Route path="provisioning" element={
            <RouteGuard screen={ScreenId.PROVISIONING}>
              <ProvisioningConsole />
            </RouteGuard>
          } />

          <Route path="provisioning/setup" element={
            <RouteGuard screen={ScreenId.PROVISIONING_STATION_SETUP}>
              <ProvisioningStationSetup />
            </RouteGuard>
          } />

          <Route path="eol" element={
            <RouteGuard screen={ScreenId.EOL_QA_STATION}>
               <EolStation />
            </RouteGuard>
          } />

          <Route path="eol/setup" element={
            <RouteGuard screen={ScreenId.EOL_QA_STATION_SETUP}>
               <EolStationSetup />
            </RouteGuard>
          } />

          <Route path="inventory" element={
            <RouteGuard screen={ScreenId.INVENTORY}>
              <InventoryList />
            </RouteGuard>
          } />
          
          <Route path="dispatch" element={
            <RouteGuard screen={ScreenId.DISPATCH_LIST}>
              <DispatchList />
            </RouteGuard>
          } />

          <Route path="dispatch/:id" element={
            <RouteGuard screen={ScreenId.DISPATCH_DETAIL}>
              <DispatchDetail />
            </RouteGuard>
          } />

          <Route path="custody" element={
            <RouteGuard screen={ScreenId.CUSTODY}>
              <Custody />
            </RouteGuard>
          } />

          <Route path="custody/:dispatchId" element={
            <RouteGuard screen={ScreenId.CUSTODY_DETAIL}>
              <CustodyDetail />
            </RouteGuard>
          } />
          
          <Route path="warranty" element={
            <RouteGuard screen={ScreenId.WARRANTY}>
              <Warranty />
            </RouteGuard>
          } />

          <Route path="warranty/claims/:claimId" element={
            <RouteGuard screen={ScreenId.WARRANTY_CLAIM_DETAIL}>
              <WarrantyDetail />
            </RouteGuard>
          } />

          <Route path="warranty/intake" element={
            <RouteGuard screen={ScreenId.WARRANTY_EXTERNAL_INTAKE}>
              <WarrantyIntake />
            </RouteGuard>
          } />

          <Route path="compliance" element={
            <RouteGuard screen={ScreenId.COMPLIANCE}>
              <Compliance />
            </RouteGuard>
          } />
          
          <Route path="analytics" element={
            <RouteGuard screen={ScreenId.ANALYTICS}>
               <Analytics />
            </RouteGuard>
          } />

          <Route path="settings" element={
            <RouteGuard screen={ScreenId.SETTINGS}>
               <Settings />
            </RouteGuard>
          } />

          <Route path="admin/rbac" element={
            <RouteGuard screen={ScreenId.RBAC_VIEW}>
              <RbacAdmin />
            </RouteGuard>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;