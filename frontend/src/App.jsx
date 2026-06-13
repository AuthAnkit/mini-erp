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
