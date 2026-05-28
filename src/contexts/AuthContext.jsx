// src/contexts/AuthContext.jsx
// Provider global de autenticação via Keycloak (OIDC).
// Expõe: user, token, userName, userInitial, isLoading, login(), logout()
import { createContext, useState, useEffect, useCallback } from 'react';
import { userManager } from '../auth/keycloak';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(undefined); // undefined = ainda carregando
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se já existe uma sessão salva (sessionStorage)
    userManager.getUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });

    // Ouve eventos do userManager para manter o estado sincronizado
    const onUserLoaded    = (u) => setUser(u);
    const onUserUnloaded  = ()  => setUser(null);
    const onUserExpired   = ()  => setUser(null);

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addAccessTokenExpired(onUserExpired);

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserUnloaded);
      userManager.events.removeAccessTokenExpired(onUserExpired);
    };
  }, []);

  // Inicia o fluxo de login (redireciona para o Keycloak)
  const login = useCallback(() => {
    userManager.signinRedirect();
  }, []);

  // Encerra a sessão no Keycloak e limpa o estado local
  const logout = useCallback(() => {
    userManager.signoutRedirect();
  }, []);

  // Token de acesso JWT — usado nos headers das requisições
  const token = user?.access_token ?? null;

  // Nome do usuário — Keycloak popula 'name' ou 'preferred_username'
  const userName = user?.profile?.name
    ?? user?.profile?.preferred_username
    ?? 'Duelista';

  // Inicial para o avatar
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <AuthContext.Provider value={{ user, token, userName, userInitial, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
