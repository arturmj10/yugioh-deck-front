// src/components/layout/Layout.jsx
// Exibe nome real do usuário vindo do token Keycloak + botão de logout
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

function Layout() {
  const { userName, userInitial, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-container">
      <header className="main-header">
        <Link to="/decks" className="logo" style={{ textDecoration: 'none' }}>
          <img src="/logo-yugioh.png" alt="Yu-Gi-Oh Logo" />
          <span>Deck Builder</span>
        </Link>
        <div className="user-profile">
          <button className="btn-theme-toggle" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark' ? '🌚' : '☀️'}
          </button>
          <span className="user-name">{userName}</span>
          <div className="avatar" title={userName}>{userInitial}</div>
          <button className="btn-logout" onClick={logout} title="Encerrar sessão">
            ⏻
          </button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;