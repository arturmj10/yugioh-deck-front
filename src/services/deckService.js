// src/services/deckService.js
import axios from 'axios';

// A porta 5282 confirmada pelo seu 'dotnet run'
const API_URL = 'http://localhost:5282/api/decks';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Busca todos os decks cadastrados.
 * Retorna a lista com Configuration incluída (conforme seu GetDecks no C#).
 */
export const getDecks = async () => {
  const response = await api.get('/');
  return response.data;
};

/**
 * Busca um deck específico por ID.
 * Traz detalhes das cartas e configurações (conforme seu GetDeck(id) no C#).
 */
export const getDeckById = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

/**
 * Cria um novo deck.
 * O backend atualmente fixa Formato "TCG" e Cor "#3f51b5".
 */
export const criarDeck = async (deck) => {
  const response = await api.post('/', deck);
  return response.data;
};

/**
 * Atualiza um deck existente.
 * Envia o ID na URL e o objeto completo no corpo da requisição.
 */
export const atualizarDeck = async (deck) => {
  // Assume que o objeto deck possui uma propriedade 'id'
  const response = await api.put(`/${deck.id}`, deck);
  return response.data;
};

/**
 * Remove um deck permanentemente.
 */
export const deletarDeck = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};