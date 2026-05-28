// src/services/deckService.js
// Todas as funções recebem `token` (JWT) e o enviam no header Authorization.
// 401 lança erro com mensagem especial 'SESSION_EXPIRED' para os componentes tratarem.
const API_URL = 'http://localhost:5282/api';

// Monta os headers padrão com autenticação Bearer
const makeHeaders = (token, withBody = false) => ({
  ...(withBody ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

const handleFetchJson = async (res, errorMessage) => {
  if (res.status === 401) {
    throw new Error('SESSION_EXPIRED');
  }
  if (!res.ok) {
    const txt = await res.text();
    let msg = txt;
    try {
      const parsed = JSON.parse(txt);
      msg = parsed.message || parsed.title || txt;
    } catch {
      // Falha silenciosa: assume que é texto puro (BadRequest padrão)
    }
    throw new Error(msg || errorMessage);
  }
  return res.status === 204 ? null : res.json();
};

// ── Decks ────────────────────────────────────────────────────────────────────

export const getDecks = async (token, nome = '', formato = 'Todos') => {
  const queryParams = new URLSearchParams();
  if (nome) queryParams.append('nome', nome);
  if (formato && formato !== 'Todos') queryParams.append('formato', formato);
  
  const queryString = queryParams.toString();
  const url = `${API_URL}/decks${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    headers: makeHeaders(token),
  });
  return handleFetchJson(res, 'Erro ao buscar inventário de decks');
};

export const getDeckById = async (id, token) => {
  const res = await fetch(`${API_URL}/decks/${id}`, {
    headers: makeHeaders(token),
  });
  return handleFetchJson(res, 'Erro ao carregar detalhes do deck');
};

export const criarDeck = async (deck, token) => {
  const res = await fetch(`${API_URL}/decks`, {
    method: 'POST',
    headers: makeHeaders(token, true),
    body: JSON.stringify(deck),
  });
  return handleFetchJson(res, 'Erro ao criar deck');
};

export const atualizarDeck = async (deck, token) => {
  const res = await fetch(`${API_URL}/decks/${deck.id}`, {
    method: 'PUT',
    headers: makeHeaders(token, true),
    body: JSON.stringify(deck),
  });
  return handleFetchJson(res, 'Erro ao atualizar deck');
};

export const deletarDeck = async (id, token) => {
  const res = await fetch(`${API_URL}/decks/${id}`, {
    method: 'DELETE',
    headers: makeHeaders(token),
  });
  return handleFetchJson(res, 'Erro ao deletar deck');
};

// ── Cartas ───────────────────────────────────────────────────────────────────

export const buscarCartasDoCatalogo = async (query, token) => {
  if (!query || !query.trim()) return [];
  const res = await fetch(`${API_URL}/cards/search?q=${encodeURIComponent(query)}`, {
    headers: makeHeaders(token),
  });
  if (res.status === 404) return [];
  const data = await handleFetchJson(res, 'Erro ao pesquisar cartas');
  return data.map(c => ({
    cardId: c.id ?? c.Id ?? c.cardId,
    nome: c.name ?? c.Name ?? c.nome ?? c.Nome,
    imagem: c.imageUrl ?? c.ImageUrl ?? c.imagem ?? null,
    raw: c,
  }));
};

export const adicionarCartaAoDeck = async (deckId, cardId, slot = 'Main', quantidade = 1, token) => {
  const res = await fetch(`${API_URL}/decks/${deckId}/cards`, {
    method: 'POST',
    headers: makeHeaders(token, true),
    body: JSON.stringify({ cardId, slot, quantidade }),
  });
  return handleFetchJson(res, 'Erro ao aplicar regras do deck.');
};

export const removerCartaDoDeck = async (deckId, cardId, slot = 'Main', token) => {
  const res = await fetch(
    `${API_URL}/decks/${deckId}/cards/${cardId}?slot=${encodeURIComponent(slot)}`,
    { method: 'DELETE', headers: makeHeaders(token) },
  );
  return handleFetchJson(res, 'Erro ao remover carta.');
};

// Alias de compatibilidade
export const removerUnidadeCartaDoDeck = removerCartaDoDeck;