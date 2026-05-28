import { ImageIcon } from 'lucide-react';
import { CARD_BACK_URL } from '../../constants/deckConstants';
import {
  getUniqueCoverOptions,
  getDeckCardId,
  getDeckCardImage,
  getDeckCardName,
  getCapaCardId,
} from '../../utils/deckUtils';

function DeckCoverPicker({ deck, selectedCapaCardId, onSelect, accentColor = '#2563eb' }) {
  const options = getUniqueCoverOptions(deck);
  const selectedId = selectedCapaCardId ?? getCapaCardId(deck) ?? null;

  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">
        Adicione cartas ao deck para escolher uma imagem de capa.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Escolha uma carta do deck como capa (exibida na listagem):
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1">
        <button
          type="button"
          title="Usar verso padrão"
          onClick={() => onSelect(null)}
          className={`relative aspect-[59/86] rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
            selectedId == null
              ? 'ring-2 ring-offset-1'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          style={
            selectedId == null
              ? { borderColor: accentColor, boxShadow: `0 0 0 2px ${accentColor}33` }
              : undefined
          }
        >
          <img
            src={CARD_BACK_URL}
            alt="Verso padrão"
            className="w-full h-full object-cover opacity-80"
          />
          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5">
            Padrão
          </span>
        </button>

        {options.map((item) => {
          const cardId = getDeckCardId(item);
          const isSelected = selectedId === cardId;

          return (
            <button
              key={cardId}
              type="button"
              title={getDeckCardName(item)}
              onClick={() => onSelect(cardId)}
              className={`relative aspect-[59/86] rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                isSelected ? 'ring-2 ring-offset-1' : 'border-gray-200 hover:border-gray-300'
              }`}
              style={
                isSelected
                  ? { borderColor: accentColor, boxShadow: `0 0 0 2px ${accentColor}33` }
                  : undefined
              }
            >
              <img
                src={getDeckCardImage(item)}
                alt={getDeckCardName(item)}
                className="w-full h-full object-cover object-top"
              />
              {isSelected && (
                <span
                  className="absolute top-1 left-1 text-[9px] font-bold text-white px-1 py-0.5 rounded"
                  style={{ backgroundColor: accentColor }}
                >
                  Capa
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DeckCoverPreview({ deck, className = '' }) {
  const capaUrl = getDeckCoverImage(deck);
  const temCapa = getCapaCardId(deck) != null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-14 aspect-[59/86] rounded-md overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
        <img src={capaUrl} alt="Capa atual" className="w-full h-full object-cover object-top" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" />
          Capa do deck
        </p>
        <p className="text-xs text-gray-500 truncate">
          {temCapa ? 'Carta selecionada' : 'Verso padrão'}
        </p>
      </div>
    </div>
  );
}

export default DeckCoverPicker;
