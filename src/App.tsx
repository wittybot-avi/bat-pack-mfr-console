
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGate } from './src/components/AuthGate';
import { RouteGuard } from './src/components/RouteGuard';
import { ScreenId } from './src/rbac/screenIds';
import { Layout } from './src/components/Layout';
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import Telemetry from './src/pages/Telemetry';
import Analytics from './src/pages/Analytics';
import SkuList from './src/pages/SkuList';
import SkuDetail from './src/pages/SkuDetail';
import CellLotsList from './src/pages/CellLotsList';
import CellLotDetail from './src/pages/CellLotDetail';
import LineageView from './src/pages/LineageView';
import Batches from './src/pages/Batches';
import BatchDetail from './src/pages/BatchDetail';
import ModuleAssemblyList from './src/pages/ModuleAssemblyList';
import ModuleAssemblyDetail from './src/pages/ModuleAssemblyDetail';
import PackAssemblyList from './src/pages/PackAssemblyList';
import PackAssemblyDetail from './src/pages/PackAssemblyDetail';
import Batteries from './src/pages/Batteries';
import BatteryDetail from './src/pages/BatteryDetail';
import ProvisioningConsole from './src/pages/ProvisioningConsole';
import ProvisioningStationSetup from './src/pages/ProvisioningStationSetup';
import InventoryList from './src/pages/InventoryList';
import DispatchList from './src/pages/DispatchList';
import DispatchDetail from './src/pages/DispatchDetail';
import EolQaList from './src/pages/EolQaList';
import EolQaDetail from './src/pages/EolQaDetail';
import Compliance from './src/pages/Compliance';
import Custody from './src/pages/Custody';
import CustodyDetail from './src/pages/CustodyDetail';
import Warranty from './src/pages/Warranty';
import WarrantyDetail from './src/pages/WarrantyDetail';
import WarrantyIntake from './src/pages/WarrantyIntake';
import RbacAdmin from './src/pages/RbacAdmin';
import Settings from './src/pages/Settings';
import DiagnosticsPage from './src/pages/DiagnosticsPage';
import ErrorBoundary from './src/components/ErrorBoundary';
import NotFound from './src/pages/NotFound';

/**
 * App component with routing and security gates.
 * Using HashRouter for improved compatibility with hosted preview environments.
 */
export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<AuthGate><Layout /></AuthGate>}>
            <Route index element={<RouteGuard screen={ScreenId.DASHBOARD}><Dashboard /></RouteGuard>} />
            <Route path="telemetry" element={<RouteGuard screen={ScreenId.TELEMETRY}><Telemetry /></RouteGuard>} />
            <Route path="analytics" element={<RouteGuard screen={ScreenId.ANALYTICS}><Analytics /></RouteGuard>} />
            
            <Route path="sku" element={<RouteGuard screen={ScreenId.SKU_LIST}><SkuList /></RouteGuard>} />
            <Route path="sku/:id" element={<RouteGuard screen={ScreenId.SKU_LIST}><SkuDetail /></RouteGuard>} />
            
            <Route path="trace/cells" element={<RouteGuard screen={ScreenId.CELL_LOTS_LIST}><CellLotsList /></RouteGuard>} />
            <Route path="trace/cells/:lotId" element={<RouteGuard screen={ScreenId.CELL_LOTS_LIST}><CellLotDetail /></RouteGuard>} />
            <Route path="trace/lineage/:id" element={<RouteGuard screen={ScreenId.LINEAGE_VIEW}><LineageView /></RouteGuard>} />
            
            <Route path="batches" element={<RouteGuard screen={ScreenId.BATCHES_LIST}><Batches /></RouteGuard>} />
            <Route path="batches/:id" element={<RouteGuard screen={ScreenId.BATCHES_DETAIL}><BatchDetail /></RouteGuard>} />
            
            <Route path="operate/modules" element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_LIST}><ModuleAssemblyList /></RouteGuard>} />
            <Route path="operate/modules/:id" element={<RouteGuard screen={ScreenId.MODULE_ASSEMBLY_DETAIL}><ModuleAssemblyDetail /></RouteGuard>} />
            
            <Route path="operate/packs" element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_LIST}><PackAssemblyList /></RouteGuard>} />
            <Route path="operate/packs/:id" element={<RouteGuard screen={ScreenId.PACK_ASSEMBLY_DETAIL}><PackAssemblyDetail /></RouteGuard>} />
            
            <Route path="batteries" element={<RouteGuard screen={ScreenId.BATTERIES_LIST}><Batteries /></RouteGuard>} />
            <Route path="batteries/:id" element={<RouteGuard screen={ScreenId.BATTERIES_DETAIL}><BatteryDetail /></RouteGuard>} />
            
            <Route path="provisioning" element={<RouteGuard screen={ScreenId.PROVISIONING}><ProvisioningConsole /></RouteGuard>} />
            <Route path="provisioning/setup" element={<RouteGuard screen={ScreenId.PROVISIONING_STATION_SETUP}><ProvisioningStationSetup /></RouteGuard>} />
            
            <Route path="inventory" element={<RouteGuard screen={ScreenId.INVENTORY}><InventoryList /></RouteGuard>} />
            
            <Route path="dispatch" element={<RouteGuard screen={ScreenId.DISPATCH_LIST}><DispatchList /></RouteGuard>} />
            <Route path="dispatch/:orderId" element={<RouteGuard screen={ScreenId.DISPATCH_DETAIL}><DispatchDetail /></RouteGuard>} />
            
            <Route path="eol" element={<RouteGuard screen={ScreenId.EOL_QA_STATION}><EolQaList /></RouteGuard>} />
            <Route path="assure/eol/:id" element={<RouteGuard screen={ScreenId.EOL_QA_DETAIL}><EolQaDetail /></RouteGuard>} />
            
            <Route path="compliance" element={<RouteGuard screen={ScreenId.COMPLIANCE}><Compliance /></RouteGuard>} />
            
            <Route path="custody" element={<RouteGuard screen={ScreenId.CUSTODY}><Custody /></RouteGuard>} />
            <Route path="custody/:dispatchId" element={<RouteGuard screen={ScreenId.CUSTODY}><CustodyDetail /></RouteGuard>} />
            
            <Route path="warranty" element={<RouteGuard screen={ScreenId.WARRANTY}><Warranty /></RouteGuard>} />
            <Route path="warranty/claims/:claimId" element={<RouteGuard screen={ScreenId.WARRANTY}><WarrantyDetail /></RouteGuard>} />
            <Route path="warranty/intake" element={<RouteGuard screen={ScreenId.WARRANTY_EXTERNAL_INTAKE}><WarrantyIntake /></RouteGuard>} />
            
            <Route path="admin/rbac" element={<RouteGuard screen={ScreenId.RBAC_VIEW}><RbacAdmin /></RouteGuard>} />
            <Route path="settings" element={<RouteGuard screen={ScreenId.SETTINGS}><Settings /></RouteGuard>} />
            
            <Route path="__diagnostics/pages" element={<DiagnosticsPage />} />
            
            {/* Catch-all route for unknown pathways */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}
