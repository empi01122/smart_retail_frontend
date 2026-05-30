import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/login';
import Storefront from './pages/storefront';
import Products from './pages/products';
import Sales from './pages/sales';
import Dashboard from './pages/dashboard';
import Settings from './pages/settings';
import Navbar from './components/navbar';
import ProtectedRoute from './guards/ProtectedRoute';
import AdminRoute from './guards/AdminRoute';

// Layout wrapper for all protected routes, enclosing sidebar and content column
const AppLayout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/storefront" replace />} />
          <Route path="/storefront" element={<Storefront />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin Exclusive Route */}
          <Route element={<AdminRoute />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/storefront" replace />} />
    </Routes>
  );
};

export default App;