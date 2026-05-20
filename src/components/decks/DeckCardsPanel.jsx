import {
  getDeckCardName,
  getDeckCardSlot,
  getDeckCards,
  getDeckCardQuantity,
  getDeckCardId,
} from '../../utils/deckUtils';

function DeckSlotSection({ title, items, onAdicionar, onRemover, showSideButton = true }) {
  const total = items.reduce((sum, item) => sum + getDeckCardQuantity(item), 0);

  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title} ({total})
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Nenhuma carta neste slot.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            const slot = getDeckCardSlot(item);
            return (
              <li
                key={`${getDeckCardId(item)}-${slot}`}
                className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"
              >
                <span className="truncate flex-1">
                  {getDeckCardQuantity(item)}x {getDeckCardName(item)}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onAdicionar(getDeckCardId(item), slot)}
                    className="w-7 h-7 text-xs font-bold bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    +
                  </button>
                  {showSideButton && slot !== 'Side' && (
                    <button
                      type="button"
                      onClick={() => onAdicionar(getDeckCardId(item), 'Side')}
                      title="Adicionar no Side"
                      className="w-7 h-7 text-xs font-bold bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                    >
                      S
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemover(getDeckCardId(item), slot)}
                    className="w-7 h-7 text-xs font-bold bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    -
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeckCardsPanel({ deck, onAdicionar, onRemover }) {
  const deckCards = getDeckCards(deck);
  const main = deckCards.filter((dc) => getDeckCardSlot(dc) === 'Main');
  const extra = deckCards.filter((dc) => getDeckCardSlot(dc) === 'Extra');
  const side = deckCards.filter((dc) => getDeckCardSlot(dc) === 'Side');

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Cartas no Deck</h2>

      {deckCards.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Nenhuma carta adicionada ainda.
        </p>
      ) : (
        <>
          <DeckSlotSection
            title="Main Deck"
            items={main}
            onAdicionar={onAdicionar}
            onRemover={onRemover}
          />
          <DeckSlotSection
            title="Extra Deck"
            items={extra}
            onAdicionar={onAdicionar}
            onRemover={onRemover}
          />
          <DeckSlotSection
            title="Side Deck"
            items={side}
            onAdicionar={onAdicionar}
            onRemover={onRemover}
            showSideButton={false}
          />
        </>
      )}
    </section>
  );
}

export default DeckCardsPanel;
