// src/components/decks/DeckDetalhesPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getDeckById, adicionarCartaAoDeck, removerUnidadeCartaDoDeck, buscarCartasDoCatalogo } from '../../services/deckService';
import { toast } from 'react-toastify';
// Importaremos o serviço de busca de cartas futuramente
import './DeckDetalhes.css';

function DeckDetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [inputTexto, setInputTexto] = useState('');
  const [catalogoGlobal, setCatalogoGlobal] = useState([]);
  const [limiteExibicao, setLimiteExibicao] = useState(20);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(false);
  const [cartaEmDestaque, setCartaEmDestaque] = useState(null);

  // filtros unificados
  const [filtros, setFiltros] = useState({
    tipoPrincipal: 'Todos', // Todos, Monstros, Magias, Armadilhas
    subTipo: 'Todos',
    atributo: 'Todos',
    race: 'Todos',
    level: 'Todos',
    atkMin: '', atkMax: '', defMin: '', defMax: ''
  });

  const carregarDetalhes = async () => {
    try {
      const dados = await getDeckById(id);
      setDeck(dados);
    } catch (error) {
      console.error("Erro ao carregar deck:", error);
    }
  };

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  // Debounce: atualiza termoDebounced 500ms após o usuário parar de digitar
  useEffect(() => {
    let mounted = true;
    const carregarCatalogoLivre = async () => {
      try {
        setCarregandoCatalogo(true);
        const dados = await buscarCartasDoCatalogo('a');
        if (mounted) setCatalogoGlobal(dados);
      } catch (error) {
        console.error('Erro ao inicializar catálogo:', error);
        if (mounted) toast.error('Erro ao inicializar o catálogo de cartas.');
      } finally {
        if (mounted) setCarregandoCatalogo(false);
      }
    };

    carregarCatalogoLivre();
    return () => { mounted = false; };
  }, []);

  // Sempre que o usuário mudar o texto de busca ou qualquer filtro, resetar limiteExibicao para 20
  useEffect(() => {
    setLimiteExibicao(20);
  }, [inputTexto, filtros]);

  if (!deck) return <div className="loading">Carregando Deck...</div>;

  const corTema = deck.configuration?.corTema || '#0028B3';

  const totalCards = deck.deckCards?.reduce((sum, it) => sum + (it.quantidade || 0), 0) || 0;

  const cartasFiltradas = catalogoGlobal.filter(card => {
    const raw = card.raw || {};
    const type = (card.type || raw.type || raw.Type || '').toString();
    const attribute = (card.attribute || raw.attribute || raw.Attribute || '').toString();
    const level = card.level ?? raw.level ?? raw.Level ?? null;
    const atk = card.atk ?? raw.atk ?? raw.Atk ?? raw.ATK ?? -1;
    const def = card.def ?? raw.def ?? raw.Def ?? raw.DEF ?? -1;
    const nome = (card.nome || card.name || raw.name || raw.Name || '').toString().toLowerCase();

    const bateTexto = inputTexto ? nome.includes(inputTexto.trim().toLowerCase()) : true;

    let bateTipoPrincipal = true;
    if (filtros.tipoPrincipal === 'Magias') bateTipoPrincipal = /Spell Card/i.test(type);
    else if (filtros.tipoPrincipal === 'Armadilhas') bateTipoPrincipal = /Trap Card/i.test(type);
    else if (filtros.tipoPrincipal === 'Monstros') bateTipoPrincipal = !/Spell|Trap/i.test(type);

    const bateAtributo = filtros.atributo === 'Todos' || attribute === filtros.atributo;
    const bateLevel = filtros.level === 'Todos' || (level !== null && level !== undefined && parseInt(level, 10) === parseInt(filtros.level, 10));
    const bateAtkMin = filtros.atkMin ? atk !== -1 && atk >= parseInt(filtros.atkMin, 10) : true;
    const bateAtkMax = filtros.atkMax ? atk !== -1 && atk <= parseInt(filtros.atkMax, 10) : true;
    const bateDefMin = filtros.defMin ? def !== -1 && def >= parseInt(filtros.defMin, 10) : true;
    const bateDefMax = filtros.defMax ? def !== -1 && def <= parseInt(filtros.defMax, 10) : true;

    return bateTexto && bateTipoPrincipal && bateAtributo && bateLevel && bateAtkMin && bateAtkMax && bateDefMin && bateDefMax;
  });

  const cartasParaExibir = cartasFiltradas.slice(0, limiteExibicao);

  // Exemplo de ações que usam o backend para validar e persistir
  const handleAdicionar = async (cardId, slotSelecionado = 'Main') => {
    try {
      await adicionarCartaAoDeck(deck.id, cardId, slotSelecionado, 1);
      toast.success('Carta adicionada ao Deck!');
      await carregarDetalhes();
    } catch (error) {
      toast.error(error.message || 'Erro ao adicionar carta.');
    }
  };

  const handleRemover = async (cardId, slotDaCarta = 'Main') => {
    try {
      await removerUnidadeCartaDoDeck(deck.id, cardId, slotDaCarta);
      toast.info('Uma cópia foi removida.');
      await carregarDetalhes();
    } catch (error) {
      toast.error(error.message || 'Erro ao remover carta.');
    }
  };

  return (
    <div className="deck-detail-container">
      {/* HEADER COM A COR DO TEMA */}
      <header className="deck-detail-header" style={{ borderLeft: `6px solid ${corTema}` }}>
        <button className="btn-back" onClick={() => navigate(-1)}>← Voltar</button>
        <div className="deck-header-info">
          <h1>{deck.nome}</h1>
          <div className="deck-badges">
            <span className="badge-format" style={{ backgroundColor: corTema }}>
              {deck.configuration?.formato}
            </span>
            <span className="badge-count">
              {`${totalCards}/60`}
            </span>
          </div>
        </div>
      </header>

      <div className="deck-builder-grid">
        {/* COLUNA 1: BUSCADOR DE CARTAS (Tabela Cards) */}
        <section className="search-column">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Procurar carta no banco... (mínimo 3 caracteres)" 
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
            />
          </div>
          {/* Painel de Filtros Avançados (opera sobre cartasOriginais) */}
          <div className="filter-panel" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={filtros.tipoPrincipal} onChange={(e) => { setFiltros({...filtros, tipoPrincipal: e.target.value, subTipo: 'Todos'}); }}>
                <option value="Todos">Todos</option>
                <option value="Monstros">Monstros</option>
                <option value="Magias">Magias (Spell)</option>
                <option value="Armadilhas">Armadilhas (Trap)</option>
              </select>

              <select value={filtros.subTipo} onChange={(e) => setFiltros({...filtros, subTipo: e.target.value})}>
                <option value="Todos">Todos Subtipos</option>
                {/* Subtipos de Monstro */}
                <option value="Normal">Normal</option>
                <option value="Effect">Efeito</option>
                <option value="Fusion">Fusão</option>
                <option value="Synchro">Synchro</option>
                <option value="XYZ">XYZ</option>
                <option value="Link">Link</option>
                <option value="Ritual">Ritual</option>
                {/* Propriedades de Spell/Trap (usadas se Tipo Principal for Magias/Armadilhas) */}
                <option value="Continuous">Continuous</option>
                <option value="Counter">Counter</option>
                <option value="Equip">Equip</option>
                <option value="Field">Field</option>
                <option value="Quick-Play">Quick-Play</option>
              </select>

              <select value={filtros.atributo} onChange={(e) => setFiltros({...filtros, atributo: e.target.value})}>
                <option value="Todos">Todos Atributos</option>
                <option value="DARK">DARK</option>
                <option value="LIGHT">LIGHT</option>
                <option value="EARTH">EARTH</option>
                <option value="WATER">WATER</option>
                <option value="FIRE">FIRE</option>
                <option value="WIND">WIND</option>
                <option value="DIVINE">DIVINE</option>
              </select>

              <select value={filtros.race} onChange={(e) => setFiltros({...filtros, race: e.target.value})}>
                <option value="Todos">Todos Races</option>
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

              <select value={filtros.level} onChange={(e) => setFiltros({...filtros, level: e.target.value})}>
                <option value="Todos">Nivel/Rank: Todos</option>
                {[...Array(12)].map((_,i) => <option key={i+1} value={(i+1).toString()}>{i+1}</option>)}
              </select>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <label>ATK</label>
                <input type="number" placeholder="min" value={filtros.atkMin} onChange={(e)=>setFiltros({...filtros, atkMin: e.target.value})} style={{ width: 80 }} />
                <input type="number" placeholder="max" value={filtros.atkMax} onChange={(e)=>setFiltros({...filtros, atkMax: e.target.value})} style={{ width: 80 }} />
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <label>DEF</label>
                <input type="number" placeholder="min" value={filtros.defMin} onChange={(e)=>setFiltros({...filtros, defMin: e.target.value})} style={{ width: 80 }} />
                <input type="number" placeholder="max" value={filtros.defMax} onChange={(e)=>setFiltros({...filtros, defMax: e.target.value})} style={{ width: 80 }} />
              </div>

              <button onClick={() => {
                setFiltros({ tipoPrincipal: 'Todos', subTipo: 'Todos', atributo: 'Todos', race: 'Todos', level: 'Todos', atkMin: '', atkMax: '', defMin: '', defMax: '' });
              }}>Limpar Filtros</button>
            </div>
          </div>
          <div className="catalog-results">
            {(() => {
              if (carregandoCatalogo) return <p className="helper-text">Carregando catálogo...</p>;
              if (!catalogoGlobal || catalogoGlobal.length === 0) return <p className="helper-text">Resultados do catálogo aparecerão aqui...</p>;

              return cartasParaExibir.map(card => {
                const tipo = (card.raw?.type || card.raw?.Type || '').toString();
                const isExtra = /Fusion|Synchro|XYZ|Link/i.test(tipo);
                return (
                  <div key={card.cardId} className="deck-card">
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn-edit"
                        style={{ backgroundColor: 'rgba(0, 40, 179, 0.9)' }}
                        onClick={(e) => {
                          e.preventDefault();
                          setCartaEmDestaque(card);
                        }}
                        title="Ver carta ampliada"
                      >
                        🔍
                      </button>
                      <button
                        className="btn-save"
                        onClick={() => handleAdicionar(card.cardId, isExtra ? 'Extra' : 'Main')}
                        title={isExtra ? 'Adicionar no Extra' : 'Adicionar no Main'}
                      >
                        +{isExtra ? 'E' : 'M'}
                      </button>
                    </div>
                    <div className="deck-image-placeholder">
                      <img
                        src={card.imagem || 'https://images.ygoprodeck.com/images/cards/back_high.jpg'}
                        alt={card.nome}
                        loading="lazy"
                      />
                    </div>
                    <div className="card-info">
                      <div className="card-title">{card.nome}</div>
                      <div className="card-rarity">
                        {card.raw?.rarity || card.raw?.Rarity || 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
            {catalogoGlobal && catalogoGlobal.length > 0 && cartasFiltradas.length > limiteExibicao && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button onClick={() => setLimiteExibicao(l => l + 20)}>Carregar mais</button>
              </div>
            )}
          </div>
        </section>

        {/* COLUNA 2: LISTA DO DECK (Tabela DeckCards) */}
        <section className="deck-list-column">
          <h2>Cartas no Deck</h2>
          <div className="current-deck-list">
            {deck.deckCards && deck.deckCards.length > 0 ? (
              <>
                <h3>Main Deck ({deck.deckCards.filter(dc => (dc.slot || dc.Slot || 'Main') === 'Main').reduce((s,c)=>s+(c.quantidade||0),0)})</h3>
                {deck.deckCards.filter(dc => (dc.slot || dc.Slot || 'Main') === 'Main').map(item => (
                  <div key={`${item.cardId}-main`} className="card-item">
                    <span>{item.quantidade}x {item.card?.name || item.card?.nome || item.cardName || 'Carta sem nome'}</span>
                    <div className="card-item-actions">
                      <button onClick={() => handleAdicionar(item.cardId, item.slot || item.Slot || 'Main')}>+</button>
                      <button onClick={() => handleRemover(item.cardId, item.slot || item.Slot || 'Main')}>-</button>
                    </div>
                  </div>
                ))}

                <h3>Extra Deck ({deck.deckCards.filter(dc => (dc.slot || dc.Slot || 'Main') === 'Extra').reduce((s,c)=>s+(c.quantidade||0),0)})</h3>
                {deck.deckCards.filter(dc => (dc.slot || dc.Slot || 'Main') === 'Extra').map(item => (
                  <div key={`${item.cardId}-extra`} className="card-item">
                    <span>{item.quantidade}x {item.card?.name || item.card?.nome || item.cardName || 'Carta sem nome'}</span>
                    <div className="card-item-actions">
                      <button onClick={() => handleAdicionar(item.cardId, item.slot || item.Slot || 'Extra')}>+</button>
                      <button onClick={() => handleRemover(item.cardId, item.slot || item.Slot || 'Extra')}>-</button>
                    </div>
                  </div>
                ))}

                <h3>Side Deck ({deck.deckCards.filter(dc => (dc.slot || dc.Slot || 'Main') === 'Side').reduce((s,c)=>s+(c.quantidade||0),0)})</h3>
                {deck.deckCards.filter(dc => (dc.slot || dc.Slot || 'Main') === 'Side').map(item => (
                  <div key={`${item.cardId}-side`} className="card-item">
                    <span>{item.quantidade}x {item.card?.name || item.card?.nome || item.cardName || 'Carta sem nome'}</span>
                    <div className="card-item-actions">
                      <button onClick={() => handleAdicionar(item.cardId, item.slot || item.Slot || 'Side')}>+</button>
                      <button onClick={() => handleRemover(item.cardId, item.slot || item.Slot || 'Side')}>-</button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="empty-msg">Nenhuma carta adicionada ainda.</p>
            )}
          </div>
        </section>
      </div>

      {/* MODAL DE INSPEÇÃO DE CARTA */}
      {cartaEmDestaque && (
        <div
          className="modal-overlay"
          onClick={() => setCartaEmDestaque(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'auto',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => setCartaEmDestaque(null)}
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  fontSize: '1.2rem',
                  backgroundColor: '#ff4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 10000,
                }}
              >
                ✕
              </button>
              <img
                src={cartaEmDestaque.imagem}
                alt={cartaEmDestaque.nome}
                style={{
                  maxHeight: '80vh',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              />
              <h3
                style={{
                  color: '#fff',
                  marginTop: '15px',
                  textShadow: '2px 2px 4px #000',
                  textAlign: 'center',
                }}
              >
                {cartaEmDestaque.nome}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckDetalhesPage;