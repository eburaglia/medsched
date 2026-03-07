import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Services from './pages/Services';
import Resources from './pages/Resources';
import Customers from './pages/Customers';
import Tenants from './pages/Tenants';
import Agenda from './pages/Agenda'; // NOVO: Importando a Agenda

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} /> {/* NOVO: Rota da Agenda */}
        <Route path="/usuarios" element={<Users />} />
        <Route path="/servicos" element={<Services />} />
        <Route path="/recursos" element={<Resources />} />
        <Route path="/clientes" element={<Customers />} />
        <Route path="/tenants" element={<Tenants />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
