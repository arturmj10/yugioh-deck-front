import { Link } from 'react-router-dom';
import { Pencil, Trash2, Layers, Plus } from 'lucide-react';
import { countMainDeckCards, getDeckCoverImage } from '../../utils/deckUtils';

/** Proporção oficial do card Yu-Gi-Oh! (59 × 86 mm) */
const CARD_ASPECT = 'aspect-[59/86]';

function DeckGrid({
  decks,
  filtroNome,
  filtroFormato,
  onFiltroNomeChange,
  onFiltroFormatoChange,
  onNovo,
  onEditar,
  onDeletar,
}) {
  const decksFiltrados = decks.filter((deck) => {
    const matchesNome = deck.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const matchesFormato =
      filtroFormato === 'Todos' || deck.configuration?.formato === filtroFormato;
    return matchesNome && matchesFormato;
  });

  const inputClass =
    'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow';

  const cardShellClass = `relative block w-full ${CARD_ASPECT} rounded-[0.65rem] border-2 overflow-hidden shadow-sm hover:shadow-lg transition-shadow`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={(e) => onFiltroNomeChange(e.target.value)}
          className={inputClass}
        />
        <select
          value={filtroFormato}
          onChange={(e) => onFiltroFormatoChange(e.target.value)}
          className={`${inputClass} sm:max-w-xs bg-white`}
        >
          <option value="Todos">Todos os Formatos</option>
          <option value="TCG">TCG</option>
          <option value="OCG">OCG</option>
          <option value="Goat">Goat</option>
        </select>
      </div>

      {decksFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Layers className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium">
            {filtroNome || filtroFormato !== 'Todos'
              ? 'Nenhum deck encontrado para os filtros.'
              : 'Nenhum deck cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,17rem))] gap-6 justify-items-center">
          <button
            type="button"
            onClick={onNovo}
            className={`${cardShellClass} border-dashed border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-3`}
          >
            <Plus className="w-11 h-11 stroke-[1.5]" />
            <span className="text-sm font-medium px-2 text-center">Novo Deck</span>
          </button>

          {decksFiltrados.map((deck) => {
            const corPrimaria = deck.configuration?.corTema || '#333';
            const cartasCount = countMainDeckCards(deck);
            const capaImg = getDeckCoverImage(deck);

            return (
              <Link
                key={deck.id}
                to={`/decks/${deck.id}`}
                className={`group ${cardShellClass}`}
                style={{
                  borderColor: corPrimaria,
                  boxShadow: `0 4px 14px ${corPrimaria}22`,
                }}
              >
                <img
                  src={capaImg}
                  alt={deck.nome}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />

                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: `linear-gradient(160deg, ${corPrimaria}88 0%, transparent 45%)`,
                  }}
                />

                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => onEditar(e, deck)}
                    title="Editar Deck"
                    className="p-2 bg-white/95 text-blue-600 rounded-md shadow hover:bg-blue-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onDeletar(e, deck)}
                    title="Excluir Deck"
                    className="p-2 bg-white/95 text-red-600 rounded-md shadow hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <span className="text-white text-sm font-semibold tracking-wide uppercase">
                    Ver Deck
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-12 pb-3 px-3 pointer-events-none">
                  <h3
                    className="text-white text-base font-bold leading-tight truncate drop-shadow"
                    title={deck.nome}
                  >
                    {deck.nome}
                  </h3>
                  <div className="flex items-center justify-between gap-1 mt-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border border-white/40 text-white bg-black/30">
                      {deck.configuration?.formato || 'TCG'}
                    </span>
                    <span className="text-xs font-bold text-white/90">{cartasCount}/60</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DeckGrid;
