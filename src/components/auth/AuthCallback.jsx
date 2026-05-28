// src/components/auth/AuthCallback.jsx
// Componente renderizado na rota /callback.
// O Keycloak redireciona aqui após o login bem-sucedido com o authorization code.
// O oidc-client-ts processa o code, troca pelo access_token e salva na sessionStorage.
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager } from '../../auth/keycloak';

function AuthCallback() {
  const navigate  = useNavigate();
  const processed = useRef(false); // Evita duplo processamento no StrictMode

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    userManager
      .signinRedirectCallback()
      .then(() => {
        // Redireciona para a página principal após autenticação
        navigate('/decks', { replace: true });
      })
      .catch((err) => {
        console.error('[AuthCallback] Erro ao processar callback:', err);
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #00123a 100%)',
      color: '#fff',
      fontSize: '1.1rem',
      letterSpacing: '0.05em',
    }}>
      ⚙️ Autenticando... aguarde.
    </div>
  );
}

export default AuthCallback;
