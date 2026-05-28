// src/auth/keycloak.js
// Configuração do cliente OIDC para o Keycloak local
// Realm: yugioh-realm | Client: yugioh-app | Flow: Authorization Code + PKCE
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const KEYCLOAK_URL    = 'http://localhost:8081';
const REALM           = 'yugioh-realm';
const CLIENT_ID       = 'yugioh-app';
const FRONTEND_ORIGIN = window.location.origin; // http://localhost:5173

export const userManager = new UserManager({
  // URL do realm — oidc-client-ts descobre automaticamente os endpoints via
  // {authority}/.well-known/openid-configuration
  authority: `${KEYCLOAK_URL}/realms/${REALM}`,

  client_id: CLIENT_ID,

  // Página que o Keycloak vai redirecionar após login bem-sucedido
  redirect_uri: `${FRONTEND_ORIGIN}/callback`,

  // Página que o Keycloak vai redirecionar após logout
  post_logout_redirect_uri: `${FRONTEND_ORIGIN}/login`,

  // Escopos: openid (obrigatório), profile (nome/username), email
  scope: 'openid profile email',

  // PKCE é o padrão atual para SPAs — oidc-client-ts usa por padrão
  response_type: 'code',

  // Armazena o usuário na sessionStorage (persiste na aba, limpa ao fechar)
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // Renovação automática do token antes de expirar (usa iframe silencioso)
  automaticSilentRenew: true,
});
