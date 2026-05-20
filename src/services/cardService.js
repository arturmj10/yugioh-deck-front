import axios from 'axios';

const API_BASE_URL = 'http://localhost:5282/api';

function mapCatalogCard(c) {
  return {
    cardId: c.id ?? c.Id ?? c.cardId,
    nome: c.name ?? c.Name ?? c.nome ?? c.Nome,
    imagem: c.imageUrl ?? c.ImageUrl ?? c.imagem ?? null,
    raw: c,
  };
}

export const buscarCartasDoCatalogo = async (query) => {
  if (!query || !query.trim()) return [];

  const response = await axios.get(`${API_BASE_URL}/cards/search`, {
    params: { q: query.trim() },
    validateStatus: (status) => status === 200 || status === 404,
  });

  if (response.status === 404) return [];
  return response.data.map(mapCatalogCard);
};
