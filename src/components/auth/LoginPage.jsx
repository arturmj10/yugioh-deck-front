// src/components/auth/LoginPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Se já está autenticado, redireciona para /decks
  // Mas NÃO chama login() automaticamente — isso causaria um loop de
  // reautenticação silenciosa via SSO cookie do Keycloak após o logout.
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/decks', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-emblem">⚑</div>
        <h1 className="login-title">DECK BUILDER</h1>
        <p className="login-subtitle">Faça login para acessar seus decks</p>
        <button className="btn-login-keycloak" onClick={login} disabled={isLoading}>
          {isLoading ? 'Carregando...' : '🔑 Entrar com Keycloak'}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
