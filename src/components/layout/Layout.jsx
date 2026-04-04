// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import './Layout.css';

function Layout() {
  return (
    <div className="app-container">
      <header className="main-header">
        <div className="logo">
          <img src="/logo-yugioh.png" alt="Yu-Gi-Oh Logo" />
          <span>Deck Builder</span>
        </div>
        <div className="user-profile">
          <span>Develin Gonçalves</span>
          <div className="avatar">D</div>
        </div>
      </header>

      <main className="content">
        <Outlet /> {/* Aqui é onde as páginas (DecksPage) serão renderizadas */}
      </main>
    </div>
  );
}

export default Layout;