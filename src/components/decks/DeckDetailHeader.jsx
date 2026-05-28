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
        className="inline-flex items-center gap-2 self-start px-4 py-2.5 text-sm font-semibold bg-white rounded-lg border-2 shadow-sm transition-all hover:shadow-md hover:bg-gray-50 active:scale-[0.98]"
        style={{ borderColor: corTema, color: corTema }}
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded-md"
          style={{ backgroundColor: `${corTema}18` }}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </span>
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
