import { createApiClient } from './apiClient';

const api = createApiClient('/decks');

export const getDecks = async () => {
  const response = await api.get('/');
  return response.data;
};

export const getDeckById = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const criarDeck = async (deck) => {
  const response = await api.post('/', deck);
  return response.data;
};

export const atualizarDeck = async (deck) => {
  const response = await api.put(`/${deck.id}`, deck);
  return response.data;
};

export const deletarDeck = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export const adicionarCartaAoDeck = async (
  deckId,
  cardId,
  slot = 'Main',
  quantidade = 1
) => {
  const response = await api.post(`/${deckId}/cards`, { cardId, slot, quantidade });
  return response.data;
};

export const removerCartaDoDeck = async (deckId, cardId, slot = 'Main') => {
  const response = await api.delete(`/${deckId}/cards/${cardId}`, {
    params: { slot },
  });
  return response.data;
};

export const removerUnidadeCartaDoDeck = removerCartaDoDeck;
