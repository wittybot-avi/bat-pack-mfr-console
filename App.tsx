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
import Telemetry from './src/pages/Telemetry';
import RbacAdmin from './src/pages/RbacAdmin';
import Placeholder from './src/pages/Placeholder';

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
              <Placeholder 
                title="Battery Inventory" 
                description="Central repository of all battery packs, with lifecycle tracking from assembly to retirement."
                features={["Serial Number Search", "SOH/SOC Overview", "Firmware Version", "History Log"]}
              />
            </RouteGuard>
          } />

          <Route path="provisioning" element={
            <RouteGuard screen={ScreenId.PROVISIONING}>
              <Placeholder 
                title="BMS Provisioning" 
                description="Securely inject credentials and bind BMS hardware to battery identity."
                features={["Hardware Handshake", "Firmware Attestation", "Crypto Key Injection", "QA Checklist"]}
              />
            </RouteGuard>
          } />

          <Route path="eol" element={
            <RouteGuard screen={ScreenId.EOL_QA}>
               <Placeholder 
                title="EOL QA & Certification" 
                description="End-of-Line testing uploads, automated grading, and digital certificate generation."
                features={["Test Log Upload", "Pass/Fail Criteria", "Certificate Generation", "Exception Handling"]}
              />
            </RouteGuard>
          } />

          <Route path="logistics" element={<Navigate to="/inventory" replace />} />

          <Route path="inventory" element={
            <RouteGuard screen={ScreenId.INVENTORY}>
              <Placeholder 
                title="Warehouse Inventory" 
                description="Real-time stock levels, rack/bin location management, and aging alerts."
                features={["Zone Map", "Stock Aging", "Inbound Scans", "Holding Area"]}
              />
            </RouteGuard>
          } />
          
          <Route path="dispatch" element={
            <RouteGuard screen={ScreenId.DISPATCH}>
              <Placeholder 
                title="Dispatch & Movement" 
                description="Manage outbound shipments, movement orders, and manifests."
                features={["Create Movement Order", "Manifest Generation", "Carrier Assignment", "Tracking"]}
              />
            </RouteGuard>
          } />

          <Route path="custody" element={
            <RouteGuard screen={ScreenId.CUSTODY}>
              <Placeholder 
                title="Chain of Custody" 
                description="Digital signatures and handover records for battery assets."
                features={["Handover Logs", "Digital Signature", "Ownership History", "Audit Proof"]}
              />
            </RouteGuard>
          } />
          
          <Route path="warranty" element={
            <RouteGuard screen={ScreenId.WARRANTY}>
              <Placeholder 
                title="Warranty Claims" 
                description="Process RMA requests, triage field failures, and analyze root causes."
                features={["Claims Inbox", "Evidence Pack", "RMA Decision", "Replacement Logic"]}
              />
            </RouteGuard>
          } />

          <Route path="compliance" element={
            <RouteGuard screen={ScreenId.COMPLIANCE}>
              <Placeholder 
                title="Compliance & Digital Record" 
                description="EU Battery Passport / DPP compliance data aggregation and export."
                features={["DPP Data Model", "Sustainability Metrics", "Recycling Info", "Regulatory Export"]}
              />
            </RouteGuard>
          } />
          
          <Route path="analytics" element={
            <RouteGuard screen={ScreenId.ANALYTICS}>
               <Placeholder 
                title="Advanced Analytics" 
                description="Long-term performance trends, predictive maintenance, and fleet health."
                features={["Degradation Curves", "Fleet Heatmap", "Anomaly Detection", "Usage Patterns"]}
              />
            </RouteGuard>
          } />

          <Route path="settings" element={
            <RouteGuard screen={ScreenId.SETTINGS}>
               <Placeholder 
                title="System Settings" 
                description="Configure organization profile, users, and integration webhooks."
                features={["Profile Mgmt", "User Mgmt", "API Keys", "Notifications"]}
              />
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