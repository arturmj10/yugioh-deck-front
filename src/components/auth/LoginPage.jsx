// src/components/auth/LoginPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate('/decks', { replace: true });
      } else {
        login();
      }
    }
  }, [user, isLoading, navigate, login]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-emblem">⚑</div>
        <h1 className="login-title">DECK BUILDER</h1>
        <p className="login-subtitle">Redirecionando para autenticação segura...</p>
      </div>
    </div>
  );
}

export default LoginPage;
