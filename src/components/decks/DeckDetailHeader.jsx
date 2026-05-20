import { ArrowLeft } from 'lucide-react';
import { countMainDeckCards } from '../../utils/deckUtils';

function DeckDetailHeader({ deck, corTema, onVoltar }) {
  const mainDeckCount = countMainDeckCards(deck);

  return (
    <header
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ borderLeftWidth: 6, borderLeftColor: corTema }}
    >
      <button
        type="button"
        onClick={onVoltar}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-gray-900 truncate">{deck.nome}</h1>
        {deck.descricao && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{deck.descricao}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs font-medium text-white px-3 py-1 rounded-full"
          style={{ backgroundColor: corTema }}
        >
          {deck.configuration?.formato}
        </span>
        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          {mainDeckCount}/60
        </span>
      </div>
    </header>
  );
}

export default DeckDetailHeader;
