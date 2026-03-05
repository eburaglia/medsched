import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota padrão redireciona para o Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Tela de Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard (Em breve a protegeremos com verificação de Token) */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
