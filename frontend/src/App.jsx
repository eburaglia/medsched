import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Services from './pages/Services'; // NOVO: Importando a tela de Serviços

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Futuramente criaremos um componente de Rota Privada para unificar os layouts */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Users />} />
        <Route path="/servicos" element={<Services />} /> {/* NOVO: Rota do catálogo */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
