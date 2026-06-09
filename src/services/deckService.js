// src/services/deckService.js
// Todas as funções recebem `token` (JWT) e o enviam no header Authorization.
// 401 lança erro com mensagem especial 'SESSION_EXPIRED' para os componentes tratarem.
const API_URL = 'http://localhost:5282/api';
const YGOPRO_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

// Mapa de subtipo (UI) → tipo exato da API YGOProDeck
const SUBTIPO_PARA_TIPO_API = {
  'Normal':          'Normal Monster',
  'Effect':          'Effect Monster',
  'Ritual':          'Ritual Monster',
  'Fusion':          'Fusion Monster',
  'Synchro':         'Synchro Monster',
  'XYZ':             'XYZ Monster',
  'Link':            'Link Monster',
  'Normal Spell':    'Normal Spell Card',
  'Continuous Spell':'Continuous Spell Card',
  'Field Spell':     'Field Spell Card',
  'Equip Spell':     'Equip Spell Card',
  'Quick-Play Spell':'Quick-Play Spell Card',
  'Ritual Spell':    'Ritual Spell Card',
  'Normal Trap':     'Normal Trap Card',
  'Continuous Trap': 'Continuous Trap Card',
  'Counter Trap':    'Counter Trap Card',
};

const SPELL_TYPES = [
  'Normal Spell Card', 'Continuous Spell Card', 'Field Spell Card',
  'Equip Spell Card', 'Quick-Play Spell Card', 'Ritual Spell Card',
];
const TRAP_TYPES = [
  'Normal Trap Card', 'Continuous Trap Card', 'Counter Trap Card',
];

const mapCards = (data) => (data || []).map(c => ({
  cardId: c.id,
  nome:   c.name,
  imagem: c.card_images?.[0]?.image_url ?? null,
  raw:    c,
}));

const PAGE_SIZE = 30;

const fetchByType = async (type, fname, offset = 0) => {
  const params = new URLSearchParams({ language: 'pt', type, num: PAGE_SIZE, offset });
  if (fname) params.set('fname', fname);
  const res = await fetch(`${YGOPRO_API}?${params}`);
  if (res.status === 400 || res.status === 404) return { cards: [], hasMore: false };
  const json = await res.json();
  const cards = mapCards(json.data);
  return { cards, hasMore: cards.length === PAGE_SIZE };
};

// Busca cartas diretamente na API pública do YGOProDeck usando filtros reais.
// Não requer autenticação — é uma API pública.
// Retorna { cards, hasMore } para suportar paginação.
export const buscarCartasComFiltros = async (texto, filtros, offset = 0) => {
  const { tipoPrincipal, subTipo, race, atributo, level } = filtros;
  const term = texto.trim();

  if (!term) return { cards: [], hasMore: false };

  // Subtipo específico → uma única chamada com type=...
  if (subTipo !== 'Todos' && subTipo !== 'Pendulum') {
    return fetchByType(SUBTIPO_PARA_TIPO_API[subTipo], term, offset);
  }

  // Pêndulo → sem type único, usa busca por nome (sem paginação parcial confiável)
  if (subTipo === 'Pendulum') {
    const [effect, normal] = await Promise.all([
      fetchByType('Pendulum Effect Monster', term, offset),
      fetchByType('Pendulum Normal Monster', term, offset),
    ]);
    return {
      cards: [...effect.cards, ...normal.cards],
      hasMore: effect.hasMore || normal.hasMore,
    };
  }

  // Magias sem subtipo → busca todos os tipos em paralelo
  if (tipoPrincipal === 'Magias') {
    const results = await Promise.all(SPELL_TYPES.map(t => fetchByType(t, term, offset)));
    return { cards: results.flatMap(r => r.cards), hasMore: results.some(r => r.hasMore) };
  }

  // Armadilhas sem subtipo → busca todos os tipos em paralelo
  if (tipoPrincipal === 'Armadilhas') {
    const results = await Promise.all(TRAP_TYPES.map(t => fetchByType(t, term, offset)));
    return { cards: results.flatMap(r => r.cards), hasMore: results.some(r => r.hasMore) };
  }

  // Monstros e Todos → usa race / attribute / level / fname
  const params = new URLSearchParams({ language: 'pt', num: PAGE_SIZE, offset });
  if (race     !== 'Todos') params.set('race',      race);
  if (atributo !== 'Todos') params.set('attribute', atributo);
  if (level    !== 'Todos') params.set('level',     level);
  if (term)                 params.set('fname',     term);

  const res = await fetch(`${YGOPRO_API}?${params}`);
  if (res.status === 400 || res.status === 404) return { cards: [], hasMore: false };
  if (!res.ok) throw new Error('Erro ao buscar cartas na API');

  const json = await res.json();
  const cards = mapCards(json.data);
  return { cards, hasMore: cards.length === PAGE_SIZE };
};

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

// ── Preços ───────────────────────────────────────────────────────────────────

// Extrai o melhor preço disponível de um card da YGOProDeck em BRL.
// Converte tanto Cardmarket (EUR) quanto TCGPlayer (USD) e usa o maior,
// pois a API retorna o preço da impressão mais barata — o maior valor
// é o mais representativo do mercado real.
const extrairMelhorPrecoBrl = (card, cotacoes) => {
  const cm  = parseFloat(card.card_prices?.[0]?.cardmarket_price || 0);
  const tcg = parseFloat(card.card_prices?.[0]?.tcgplayer_price  || 0);
  const cmBrl  = cm  > 0 && cotacoes.EUR ? cm  * cotacoes.EUR : 0;
  const tcgBrl = tcg > 0 && cotacoes.USD ? tcg * cotacoes.USD : 0;
  return Math.max(cmBrl, tcgBrl);
};

// Busca preços de uma lista de IDs em paralelo (uma requisição por carta)
export const buscarPrecosDasCartas = async (cardIds, cotacoes) => {
  if (!cardIds?.length) return {};
  const uniqueIds = [...new Set(cardIds)];
  const resultados = await Promise.allSettled(
    uniqueIds.map(id =>
      fetch(`${YGOPRO_API}?id=${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(json => ({ id, preco: json?.data?.[0] ? extrairMelhorPrecoBrl(json.data[0], cotacoes) : 0 }))
    )
  );
  return Object.fromEntries(
    resultados
      .filter(r => r.status === 'fulfilled')
      .map(r => [r.value.id, r.value.preco])
  );
};

// Busca cotações USD→BRL e EUR→BRL em tempo real (AwesomeAPI — gratuita)
export const buscarCotacoes = async () => {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
    if (!res.ok) return null;
    const json = await res.json();
    return {
      USD: parseFloat(json.USDBRL?.bid || 0),
      EUR: parseFloat(json.EURBRL?.bid || 0),
    };
  } catch {
    return null;
  }
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