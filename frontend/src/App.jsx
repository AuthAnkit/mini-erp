import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/dashboard/Dashboard';
import ProductsPage from './pages/products/ProductsPage';
import StockGraphPage from './pages/products/StockGraphPage';
import SalesPage from './pages/sales/SalesPage';
import PurchasePage from './pages/purchase/PurchasePage';
import ManufacturingPage from './pages/manufacturing/ManufacturingPage';
import AuditPage from './pages/audit/AuditPage';
import VendorsPage from './pages/purchase/VendorsPage';
import CustomersPage from './pages/sales/CustomersPage';
import DemandForecastPage from './pages/analytics/DemandForecastPage';
import SmartProcurementPage from './pages/analytics/SmartProcurementPage';
import ManufacturingPriorityPage from './pages/analytics/ManufacturingPriorityPage';
import AutoManufacturingPage from './pages/analytics/AutoManufacturingPage';
import ShortageAlertsPage from './pages/analytics/ShortageAlertsPage';
import InventoryHeatMapPage from './pages/analytics/InventoryHeatMapPage';
import DeadStockPage from './pages/analytics/DeadStockPage';
import RankingsPage from './pages/analytics/RankingsPage';
import BusinessHealthPage from './pages/analytics/BusinessHealthPage';
import ProfitLeakPage from './pages/analytics/ProfitLeakPage';
import ERPStoryPage from './pages/analytics/ERPStoryPage';
import BusinessSimulatorPage from './pages/analytics/BusinessSimulatorPage';
import ChatbotPage from './pages/analytics/ChatbotPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute roles={['ADMIN','OWNER','INVENTORY']}>
          <Layout><ProductsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/stock-graph" element={
        <ProtectedRoute roles={['ADMIN','OWNER','INVENTORY']}>
          <Layout><StockGraphPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute roles={['ADMIN','OWNER','SALES']}>
          <Layout><SalesPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute roles={['ADMIN','OWNER','SALES']}>
          <Layout><CustomersPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/purchase" element={
        <ProtectedRoute roles={['ADMIN','OWNER','PURCHASE']}>
          <Layout><PurchasePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/vendors" element={
        <ProtectedRoute roles={['ADMIN','OWNER','PURCHASE']}>
          <Layout><VendorsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/manufacturing" element={
        <ProtectedRoute roles={['ADMIN','OWNER','MANUFACTURING']}>
          <Layout><ManufacturingPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute roles={['ADMIN','OWNER']}>
          <Layout><AuditPage /></Layout>
        </ProtectedRoute>
      } />
      {/* Intelligence Routes */}
      <Route path="/analytics/health" element={<ProtectedRoute roles={['ADMIN','OWNER']}><Layout><BusinessHealthPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/demand" element={<ProtectedRoute roles={['ADMIN','OWNER','SALES','INVENTORY']}><Layout><DemandForecastPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/procurement" element={<ProtectedRoute roles={['ADMIN','OWNER','PURCHASE']}><Layout><SmartProcurementPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/mfg-priority" element={<ProtectedRoute roles={['ADMIN','OWNER','MANUFACTURING']}><Layout><ManufacturingPriorityPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/auto-mfg" element={<ProtectedRoute roles={['ADMIN','OWNER','MANUFACTURING']}><Layout><AutoManufacturingPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/shortages" element={<ProtectedRoute roles={['ADMIN','OWNER','MANUFACTURING','INVENTORY']}><Layout><ShortageAlertsPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/heatmap" element={<ProtectedRoute roles={['ADMIN','OWNER','INVENTORY']}><Layout><InventoryHeatMapPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/dead-stock" element={<ProtectedRoute roles={['ADMIN','OWNER','INVENTORY']}><Layout><DeadStockPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/rankings" element={<ProtectedRoute roles={['ADMIN','OWNER']}><Layout><RankingsPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/profit-leaks" element={<ProtectedRoute roles={['ADMIN','OWNER']}><Layout><ProfitLeakPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/stories" element={<ProtectedRoute roles={['ADMIN','OWNER']}><Layout><ERPStoryPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/simulator" element={<ProtectedRoute roles={['ADMIN','OWNER']}><Layout><BusinessSimulatorPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics/chatbot" element={<ProtectedRoute roles={['ADMIN','OWNER']}><Layout><ChatbotPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
