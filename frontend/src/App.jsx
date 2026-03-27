import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Services from './pages/Services';
import Resources from './pages/Resources';
import Customers from './pages/Customers';
import Tenants from './pages/Tenants';
import Agenda from './pages/Agenda';
import Finance from './pages/Finance';
import Settings from './pages/Settings'; 
import BillingSettings from './pages/BillingSettings';

// 👇 DRCODE: Importando a novíssima página de Registros de Serviço / Atendimentos
import ServiceRecords from './pages/ServiceRecords';

// Importando o nosso guarda-costas de rotas
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Protegidas - Nível 1: Acesso Amplo */}
        <Route path="/agenda" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL', 'CLIENTE']}>
            <Agenda />
          </ProtectedRoute>
        } />

        {/* 👇 DRCODE: A Porta de Entrada para a Execução do Serviço */}
        <Route path="/atendimentos" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL']}>
            <ServiceRecords />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL']}>
            <Dashboard />
          </ProtectedRoute>
        } />
          
        <Route path="/clientes" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR', 'PROFISSIONAL']}>
            <Customers />
          </ProtectedRoute>
        } />

        {/* Rotas Protegidas - Nível 2: Gestão e Operação */}
        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR']}>
            <Users />
          </ProtectedRoute>
        } />

        <Route path="/servicos" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR']}>
            <Services />
          </ProtectedRoute>
        } />

        <Route path="/recursos" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR']}>
            <Resources />
          </ProtectedRoute>
        } />

        <Route path="/finance" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'GESTOR']}>
            <Finance />
          </ProtectedRoute>
        } />

        {/* Rotas Protegidas - Nível 3: Administração da Clínica */}
        <Route path="/configuracoes" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN']}>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/configuracoes/faturamento" element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN']}>
            <BillingSettings />
          </ProtectedRoute>
        } />

        {/* Rotas Protegidas - Nível 4: Exclusivo Dono do Sistema */}
        <Route path="/tenants" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN']}>
            <Tenants />
          </ProtectedRoute>
        } />

        {/* Fallback: Qualquer rota não encontrada joga pro Dashboard ou Login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
