import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('medsched_token');

  // Regra 1: Se não tem crachá (token), manda pro Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    // Padroniza a leitura do papel/role que vem do backend
    const userRole = String(decoded.papel || decoded.role || 'CLIENTE').toUpperCase();

    // Regra 2: Se a rota exige papéis específicos e o usuário não tem, manda pro Dashboard
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      console.warn(`Acesso negado: Perfil ${userRole} tentou acessar rota restrita a ${allowedRoles.join(', ')}`);
      return <Navigate to="/dashboard" replace />;
    }

    // Regra 3: Tudo certo, pode renderizar a tela!
    return children;
    
  } catch (error) {
    // Se o token for falso ou estiver corrompido, limpa tudo e chuta pro login
    console.error("Token inválido ou corrompido", error);
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
}
