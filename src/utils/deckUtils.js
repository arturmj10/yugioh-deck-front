import { CORES_DISPONIVEIS, CARD_BACK_URL } from '../constants/deckConstants';

export function getHueFromColor(hex) {
  const cor = CORES_DISPONIVEIS.find((c) => c.hex === hex);
  return cor ? cor.hue : 180;
}

/** Lista de cartas do deck (API pode enviar deckCards ou DeckCards). */
export function getDeckCards(deck) {
  if (!deck) return [];
  return deck.deckCards ?? deck.DeckCards ?? [];
}

export function getDeckCardQuantity(item) {
  return item?.quantidade ?? item?.Quantidade ?? 0;
}

export function getDeckCardId(item) {
  return item?.cardId ?? item?.CardId;
}

/** Conta cartas; slotFilter = 'Main' | 'Extra' | 'Side' ou null para todas. */
export function countDeckCards(deck, slotFilter = null) {
  return getDeckCards(deck).reduce((sum, item) => {
    if (slotFilter && getDeckCardSlot(item) !== slotFilter) return sum;
    return sum + getDeckCardQuantity(item);
  }, 0);
}

/** Main Deck — limite oficial de 60 cartas. */
export function countMainDeckCards(deck) {
  return countDeckCards(deck, 'Main');
}

/**
 * A lista GET /decks não traz deckCards. Busca cada deck por id em paralelo (só frontend).
 */
export async function enrichDecksWithCards(decks, fetchDeckById) {
  if (!decks?.length) return [];

  return Promise.all(
    decks.map(async (deck) => {
      try {
        const completo = await fetchDeckById(deck.id);
        return { ...deck, deckCards: getDeckCards(completo) };
      } catch {
        return { ...deck, deckCards: getDeckCards(deck) };
      }
    })
  );
}

export function getDeckConfiguration(deck) {
  return deck?.configuration ?? deck?.Configuration ?? {};
}

export function getCapaCardId(deck) {
  const config = getDeckConfiguration(deck);
  const id = config.capaCardId ?? config.CapaCardId;
  return id != null ? id : null;
}

export function getDeckCardImage(item) {
  const card = item?.card;
  return card?.imageUrl || card?.ImageUrl || card?.imagem || CARD_BACK_URL;
}

/** Uma entrada por carta distinta (para escolher capa). */
export function getUniqueCoverOptions(deck) {
  const seen = new Set();
  return getDeckCards(deck).filter((item) => {
    const cardId = getDeckCardId(item);
    if (!cardId || seen.has(cardId)) return false;
    seen.add(cardId);
    return true;
  });
}

export function getDeckCoverImage(deck) {
  const capaId = getCapaCardId(deck);
  if (!capaId) return CARD_BACK_URL;

  const capaCard = getDeckCards(deck).find((dc) => getDeckCardId(dc) === capaId);
  return capaCard ? getDeckCardImage(capaCard) : CARD_BACK_URL;
}

export function buildDeckUpdatePayload(deck, overrides = {}) {
  const config = getDeckConfiguration(deck);
  const capa =
    overrides.capaCardId !== undefined
      ? overrides.capaCardId
      : config.capaCardId ?? config.CapaCardId ?? null;

  return {
    id: deck.id ?? deck.Id,
    nome: overrides.nome ?? deck.nome ?? deck.Nome ?? '',
    descricao: overrides.descricao ?? deck.descricao ?? deck.Descricao ?? '',
    configuration: {
      formato: overrides.formato ?? config.formato ?? config.Formato ?? 'TCG',
      corTema: overrides.corTema ?? config.corTema ?? config.CorTema ?? '#0028B3',
      capaCardId: capa,
    },
  };
}

export function deckToFormValues(deck) {
  const config = getDeckConfiguration(deck);
  return {
    nome: deck.nome || deck.Nome || '',
    descricao: deck.descricao || deck.Descricao || '',
    formato: config.formato || config.Formato || 'TCG',
    corTema: config.corTema || config.CorTema || '#0028B3',
    capaCardId: config.capaCardId ?? config.CapaCardId ?? null,
  };
}

export function formValuesToPayload(values) {
  return {
    nome: values.nome,
    descricao: values.descricao,
    configuration: {
      formato: values.formato,
      corTema: values.corTema,
      capaCardId: values.capaCardId ?? null,
    },
  };
}

export function getCardSlot(rawType) {
  const tipo = (rawType || '').toString();
  return /Fusion|Synchro|XYZ|Link/i.test(tipo) ? 'Extra' : 'Main';
}

export function getDeckCardName(item) {
  return item.card?.name || item.card?.nome || item.cardName || 'Carta sem nome';
}

export function getDeckCardSlot(item) {
  return item.slot || item.Slot || 'Main';
}
