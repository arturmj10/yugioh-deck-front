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

export function getDeckCoverImage(deck) {
  const capaId = deck?.configuration?.capaCardId;
  const capaCard = getDeckCards(deck).find(
    (dc) =>
      dc.cardId === capaId ||
      dc.card?.id === capaId ||
      dc.card?.Id === capaId
  );
  return (
    capaCard?.card?.imageUrl ||
    capaCard?.card?.ImageUrl ||
    capaCard?.card?.imagem ||
    CARD_BACK_URL
  );
}

export function deckToFormValues(deck) {
  return {
    nome: deck.nome || '',
    descricao: deck.descricao || '',
    formato: deck.configuration?.formato || 'TCG',
    corTema: deck.configuration?.corTema || '#0028B3',
  };
}

export function formValuesToPayload(values) {
  return {
    nome: values.nome,
    descricao: values.descricao,
    configuration: {
      formato: values.formato,
      corTema: values.corTema,
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
