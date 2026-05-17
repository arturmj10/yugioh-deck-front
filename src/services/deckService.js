// src/services/deckService.js
const API_URL = 'http://localhost:5282/api';

const handleFetchJson = async (res, errorMessage) => {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || errorMessage);
  }
  return res.status === 204 ? null : res.json();
};

export const getDecks = async () => {
  const res = await fetch(`${API_URL}/decks`);
  return handleFetchJson(res, 'Erro ao buscar inventário de decks');
};

export const getDeckById = async (id) => {
  const res = await fetch(`${API_URL}/decks/${id}`);
  return handleFetchJson(res, 'Erro ao carregar detalhes do deck');
};

export const criarDeck = async (deck) => {
  const res = await fetch(`${API_URL}/decks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deck)
  });
  return handleFetchJson(res, 'Erro ao criar deck');
};

export const atualizarDeck = async (deck) => {
  const res = await fetch(`${API_URL}/decks/${deck.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deck)
  });
  return handleFetchJson(res, 'Erro ao atualizar deck');
};

export const deletarDeck = async (id) => {
  const res = await fetch(`${API_URL}/decks/${id}`, { method: 'DELETE' });
  return handleFetchJson(res, 'Erro ao deletar deck');
};

export const buscarCartasDoCatalogo = async (query) => {
  if (!query || !query.trim()) return [];
  const res = await fetch(`${API_URL}/cards/search?q=${encodeURIComponent(query)}`);
  if (res.status === 404) return [];
  const data = await handleFetchJson(res, 'Erro ao pesquisar cartas');
  return data.map(c => ({
    cardId: c.id ?? c.Id ?? c.cardId,
    nome: c.name ?? c.Name ?? c.nome ?? c.Nome,
    imagem: c.imageUrl ?? c.ImageUrl ?? c.imagem ?? null,
    raw: c
  }));
};

export const adicionarCartaAoDeck = async (deckId, cardId, slot = 'Main', quantidade = 1) => {
  const res = await fetch(`${API_URL}/decks/${deckId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, slot, quantidade })
  });
  return handleFetchJson(res, 'Erro ao aplicar regras do deck.');
};

export const removerCartaDoDeck = async (deckId, cardId, slot = 'Main') => {
  const res = await fetch(`${API_URL}/decks/${deckId}/cards/${cardId}?slot=${encodeURIComponent(slot)}`, { method: 'DELETE' });
  return handleFetchJson(res, 'Erro ao remover carta.');
};

// Alias para compatibilidade
export const removerUnidadeCartaDoDeck = removerCartaDoDeck;