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
    // Se a URL contém os parâmetros do callback OIDC, aguardamos o evento
    // userLoaded (disparado pelo AuthCallback) em vez de resolver via getUser(),
    // evitando que isLoading vire false antes do token ser processado.
    const params = new URLSearchParams(window.location.search);
    const isCallbackUrl = params.has('code') && params.has('state');

    userManager.getUser().then((u) => {
      if (!isCallbackUrl) {
        setUser(u);
        setIsLoading(false);
      }
    });

    // Ouve eventos do userManager para manter o estado sincronizado
    const onUserLoaded = (u) => {
      setUser(u);
      setIsLoading(false); // garante que isLoading cai antes do navigate
    };
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

  // Encerra a sessão: limpa a sessão local primeiro (feedback imediato),
  // depois tenta o logout no servidor Keycloak com fallback para /login.
  const logout = useCallback(async () => {
    try {
      // 1. Remove o usuário da sessionStorage — reage imediatamente na UI
      await userManager.removeUser();
      setUser(null);
    } catch {
      // ignora erros de limpeza local
    }

    try {
      // 2. Redireciona para o endpoint de logout do Keycloak
      await userManager.signoutRedirect();
    } catch (err) {
      // Fallback: se o Keycloak não tiver end_session_endpoint configurado
      // ou estiver inacessível, redireciona manualmente para /login
      console.warn('[Auth] signoutRedirect falhou, redirecionando para /login:', err);
      window.location.href = '/login';
    }
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
