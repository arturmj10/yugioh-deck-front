// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import DecksPage from './components/decks/DecksPage';
import DeckDetalhesPage from './components/decks/DeckDetalhesPage';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './components/auth/AuthCallback';

// Guarda as rotas privadas: mostra loading enquanto auth inicializa,
// redireciona para /login se não autenticado.
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #00123a 100%)',
        color: '#fff',
        fontSize: '1.1rem',
      }}>
        ⚙️ Carregando...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/callback" element={<AuthCallback />} />

        {/* Rotas protegidas — dentro do Layout */}
        <Route element={<Layout />}>
          <Route path="/"         element={<Navigate to="/decks" replace />} />
          <Route path="/decks"    element={<ProtectedRoute><DecksPage /></ProtectedRoute>} />
          <Route path="/decks/:id" element={<ProtectedRoute><DeckDetalhesPage /></ProtectedRoute>} />
        </Route>
      </Routes>

      {/* Container global de notificações (react-toastify) */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default App;