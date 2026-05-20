import { Search, ZoomIn } from 'lucide-react';
import { CARD_BACK_URL } from '../../constants/deckConstants';
import { getCardSlot } from '../../utils/deckUtils';
import { FILTROS_CATALOGO_INICIAL } from '../../utils/catalogFilters';

const selectClass =
  'px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none';

function CardCatalogPanel({
  inputTexto,
  onInputTextoChange,
  filtros,
  onFiltrosChange,
  carregandoCatalogo,
  cartasParaExibir,
  cartasFiltradasCount,
  limiteExibicao,
  onCarregarMais,
  onInspecionar,
  onAdicionar,
}) {
  const limparFiltros = () => onFiltrosChange({ ...FILTROS_CATALOGO_INICIAL });

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col min-h-[400px]">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">Catálogo de Cartas</h2>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={inputTexto}
          onChange={(e) => onInputTextoChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-100">
        <select
          value={filtros.tipoPrincipal}
          onChange={(e) =>
            onFiltrosChange({ ...filtros, tipoPrincipal: e.target.value, subTipo: 'Todos' })
          }
          className={selectClass}
        >
          <option value="Todos">Todos</option>
          <option value="Monstros">Monstros</option>
          <option value="Magias">Magias</option>
          <option value="Armadilhas">Armadilhas</option>
        </select>

        <select
          value={filtros.subTipo}
          onChange={(e) => onFiltrosChange({ ...filtros, subTipo: e.target.value })}
          className={selectClass}
        >
          <option value="Todos">Subtipo</option>
          <option value="Normal">Normal</option>
          <option value="Effect">Efeito</option>
          <option value="Fusion">Fusão</option>
          <option value="Synchro">Synchro</option>
          <option value="XYZ">XYZ</option>
          <option value="Link">Link</option>
          <option value="Ritual">Ritual</option>
          <option value="Continuous">Continuous</option>
          <option value="Counter">Counter</option>
          <option value="Equip">Equip</option>
          <option value="Field">Field</option>
          <option value="Quick-Play">Quick-Play</option>
        </select>

        <select
          value={filtros.atributo}
          onChange={(e) => onFiltrosChange({ ...filtros, atributo: e.target.value })}
          className={selectClass}
        >
          <option value="Todos">Atributo</option>
          <option value="DARK">DARK</option>
          <option value="LIGHT">LIGHT</option>
          <option value="EARTH">EARTH</option>
          <option value="WATER">WATER</option>
          <option value="FIRE">FIRE</option>
          <option value="WIND">WIND</option>
          <option value="DIVINE">DIVINE</option>
        </select>

        <select
          value={filtros.race}
          onChange={(e) => onFiltrosChange({ ...filtros, race: e.target.value })}
          className={selectClass}
        >
          <option value="Todos">Race</option>
          <option value="Spellcaster">Spellcaster</option>
          <option value="Dragon">Dragon</option>
          <option value="Warrior">Warrior</option>
          <option value="Fiend">Fiend</option>
          <option value="Zombie">Zombie</option>
          <option value="Machine">Machine</option>
          <option value="Fairy">Fairy</option>
          <option value="Aqua">Aqua</option>
          <option value="Pyro">Pyro</option>
          <option value="Rock">Rock</option>
          <option value="Thunder">Thunder</option>
          <option value="Insect">Insect</option>
          <option value="Plant">Plant</option>
          <option value="Cyberse">Cyberse</option>
        </select>

        <select
          value={filtros.level}
          onChange={(e) => onFiltrosChange({ ...filtros, level: e.target.value })}
          className={selectClass}
        >
          <option value="Todos">Nível</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={(i + 1).toString()}>
              {i + 1}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="ATK min"
          value={filtros.atkMin}
          onChange={(e) => onFiltrosChange({ ...filtros, atkMin: e.target.value })}
          className={`${selectClass} w-20`}
        />
        <input
          type="number"
          placeholder="ATK max"
          value={filtros.atkMax}
          onChange={(e) => onFiltrosChange({ ...filtros, atkMax: e.target.value })}
          className={`${selectClass} w-20`}
        />
        <input
          type="number"
          placeholder="DEF min"
          value={filtros.defMin}
          onChange={(e) => onFiltrosChange({ ...filtros, defMin: e.target.value })}
          className={`${selectClass} w-20`}
        />
        <input
          type="number"
          placeholder="DEF max"
          value={filtros.defMax}
          onChange={(e) => onFiltrosChange({ ...filtros, defMax: e.target.value })}
          className={`${selectClass} w-20`}
        />

        <button
          type="button"
          onClick={limparFiltros}
          className="text-xs text-blue-600 hover:text-blue-800 px-2"
        >
          Limpar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {carregandoCatalogo ? (
          <p className="text-sm text-gray-500 text-center py-8">Carregando catálogo...</p>
        ) : cartasParaExibir.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhuma carta encontrada no catálogo.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cartasParaExibir.map((card) => {
              const tipo = (card.raw?.type || card.raw?.Type || '').toString();
              const slotMain = getCardSlot(tipo);

              return (
                <article
                  key={card.cardId}
                  className="group relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
                >
                  <div className="absolute top-1 right-1 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onInspecionar(card)}
                      title="Ver carta ampliada"
                      className="p-1.5 bg-blue-600 text-white rounded-md shadow"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdicionar(card.cardId, slotMain)}
                      title={slotMain === 'Extra' ? 'Extra' : 'Main'}
                      className="text-[10px] font-bold px-1.5 py-1 bg-green-600 text-white rounded-md"
                    >
                      +{slotMain === 'Extra' ? 'E' : 'M'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdicionar(card.cardId, 'Side')}
                      title="Side"
                      className="text-[10px] font-bold px-1.5 py-1 bg-amber-600 text-white rounded-md"
                    >
                      +S
                    </button>
                  </div>
                  <img
                    src={card.imagem || CARD_BACK_URL}
                    alt={card.nome}
                    loading="lazy"
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2">{card.nome}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {cartasFiltradasCount > limiteExibicao && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onCarregarMais}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default CardCatalogPanel;
