// src/components/decks/DeckDetalhesPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getDeckById,
  atualizarDeck,
  deletarDeck,
  adicionarCartaAoDeck,
  removerUnidadeCartaDoDeck,
  buscarCartasComFiltros,
  buscarPrecosDasCartas,
  buscarCotacoes,
} from '../../services/deckService';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../ui/ConfirmDialog';
import './DeckDetalhes.css';

// Helper: Converte URL de imagem normal para thumbnail (API do YGOProDeck)
const getSmallImageUrl = (url, cardId) => {
  if (!url) return `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
  return url.replace('/cards/', '/cards_small/');
};

// Helper: Agrupa array de deckCards combinando iguais e somando quantidades
const stackCards = (deckCardsList) => {
  const map = new Map();
  deckCardsList.forEach(item => {
    if (!item.cardId) return;
    if (map.has(item.cardId)) {
      map.get(item.cardId).quantidade += (item.quantidade || 1);
    } else {
      map.set(item.cardId, { ...item, quantidade: item.quantidade || 1 });
    }
  });
  return Array.from(map.values());
};

function DeckDetalhesPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token, logout } = useAuth();

  const [deck, setDeck]                     = useState(null);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [inputTexto, setInputTexto]         = useState('');
  const [catalogoGlobal, setCatalogoGlobal] = useState([]);
  const [catalogoOffset, setCatalogoOffset] = useState(0);
  const [catalogoHasMore, setCatalogoHasMore] = useState(false);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(false);
  
  // Preço total do deck
  const [precoDeck, setPrecoDeck] = useState(null); // { total: number, cotacao: number } | null
  const [carregandoPreco, setCarregandoPreco] = useState(false);

  // Modal de edição do deck
  const [modalEdicao, setModalEdicao]   = useState(false);
  const [dadosEdicao, setDadosEdicao]   = useState({ nome: '', descricao: '', formato: 'TCG', corTema: '#0028B3', capaCardId: null });
  const [confirmExcluir, setConfirmExcluir] = useState(false);

  const CORES_DISPONIVEIS = [
    { nome: 'Azul',   hex: '#0028B3' },
    { nome: 'Luz',    hex: '#f1c40f' },
    { nome: 'Fogo',   hex: '#e74c3c' },
    { nome: 'Água',   hex: '#3498db' },
    { nome: 'Vento',  hex: '#2ecc71' },
    { nome: 'Terra',  hex: '#a0522d' },
    { nome: 'Divino', hex: '#ff8c00' },
  ];

  const abrirEdicao = () => {
    setDadosEdicao({
      nome:       deck.nome,
      descricao:  deck.descricao || '',
      formato:    deck.configuration?.formato || 'TCG',
      corTema:    deck.configuration?.corTema || '#0028B3',
      capaCardId: deck.configuration?.capaCardId || null,
    });
    setModalEdicao(true);
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      await atualizarDeck({
        id,
        nome:      dadosEdicao.nome,
        descricao: dadosEdicao.descricao,
        configuration: { formato: dadosEdicao.formato, corTema: dadosEdicao.corTema, capaCardId: dadosEdicao.capaCardId },
      }, token);
      toast.success('Deck atualizado!');
      setModalEdicao(false);
      carregarDetalhes();
    } catch (error) {
      handleServiceError(error, 'Erro ao atualizar deck.');
    }
  };

  const confirmarExclusao = async () => {
    try {
      await deletarDeck(id, token);
      toast.info('Deck removido.');
      navigate('/decks', { replace: true });
    } catch (error) {
      handleServiceError(error, 'Erro ao excluir deck.');
    }
  };

  // Modais e Drag and Drop
  const [cartaEmDestaque, setCartaEmDestaque] = useState(null);
  const [draggedCard, setDraggedCard]         = useState(null);
  const [dragOverZone, setDragOverZone]       = useState(null); // 'Main', 'Extra', 'Side'


  // Ref estável para o handler de erros — nunca muda de referência,
  // portanto não precisa entrar em nenhum array de dependências.
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

const handleServiceError = useCallback((error, fallbackMsg) => {
    if (error.message === 'SESSION_EXPIRED') {
      toast.error('Sessão expirada. Faça login novamente.');
      logoutRef.current();
    } else {
      toast.error(error.message || fallbackMsg);
    }
  }, []); // sem dependências — usa ref internamente

  // Ref que guarda sempre o token mais recente sem criar um novo callback
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // carregarDetalhes usa refs para evitar ser recriado a cada mudança de token
  const carregarDetalhes = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const dados = await getDeckById(id, currentToken);
      setDeck(dados);
      setErroCarregamento(null);
    } catch (error) {
      const msg = error.message === 'SESSION_EXPIRED'
        ? 'Sessão expirada. Faça login novamente.'
        : 'Deck não encontrado ou acesso negado.';
      setErroCarregamento(msg);
      handleServiceError(error, 'Erro ao carregar deck.');
    }
  }, [id, handleServiceError]); // token via ref — não precisa ser dependência

  // Guard para disparar carregarDetalhes apenas uma vez quando o token chega
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!token || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    carregarDetalhes();
  }, [token, carregarDetalhes]);

  // Reseta o guard ao trocar de deck (id muda)
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [id]);

  // Calcula preço total do deck em BRL sempre que as cartas mudam
  useEffect(() => {
    if (!deck?.deckCards?.length) { setPrecoDeck(null); return; }
    let mounted = true;
    (async () => {
      setCarregandoPreco(true);
      try {
        const cardIds = [...new Set(deck.deckCards.map(dc => dc.cardId))];
        // Busca cotações primeiro para passar para o cálculo de preços
        const cotacoes = await buscarCotacoes();
        if (!mounted || !cotacoes) { setPrecoDeck(null); return; }

        const precos = await buscarPrecosDasCartas(cardIds, cotacoes);
        if (!mounted) return;

        const totalBrl = deck.deckCards.reduce((sum, dc) => {
          return sum + (precos[dc.cardId] || 0) * (dc.quantidade || 1);
        }, 0);

        setPrecoDeck({ total: totalBrl, cotacoes });
      } catch {
        if (mounted) setPrecoDeck(null);
      } finally {
        if (mounted) setCarregandoPreco(false);
      }
    })();
    return () => { mounted = false; };
  }, [deck?.deckCards]);

  const FILTROS_PADRAO = { tipoPrincipal: 'Todos', subTipo: 'Todos', atributo: 'Todos', race: 'Todos', level: 'Todos' };

  // Busca com debounce — reseta o catálogo a cada nova pesquisa
  useEffect(() => {
    if (!inputTexto.trim()) {
      setCatalogoGlobal([]);
      setCatalogoOffset(0);
      setCatalogoHasMore(false);
      return;
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        setCarregandoCatalogo(true);
        const { cards, hasMore } = await buscarCartasComFiltros(inputTexto, FILTROS_PADRAO, 0);
        if (mounted) {
          setCatalogoGlobal(cards);
          setCatalogoOffset(cards.length);
          setCatalogoHasMore(hasMore);
        }
      } catch (error) {
        if (mounted) handleServiceError(error, 'Erro ao buscar cartas.');
      } finally {
        if (mounted) setCarregandoCatalogo(false);
      }
    }, 400);
    return () => { mounted = false; clearTimeout(timer); };
  }, [inputTexto, handleServiceError]);

  const carregarMaisCartas = async () => {
    try {
      setCarregandoCatalogo(true);
      const { cards, hasMore } = await buscarCartasComFiltros(inputTexto, FILTROS_PADRAO, catalogoOffset);
      setCatalogoGlobal(prev => [...prev, ...cards]);
      setCatalogoOffset(prev => prev + cards.length);
      setCatalogoHasMore(hasMore);
    } catch (error) {
      handleServiceError(error, 'Erro ao carregar mais cartas.');
    } finally {
      setCarregandoCatalogo(false);
    }
  };

  // ── Ações de Deck ──────────────────────────────────────────────────────────
  const handleAdicionar = async (cardId, slot = 'Main') => {
    try {
      await adicionarCartaAoDeck(deck.id, cardId, slot, 1, tokenRef.current);
      await carregarDetalhes();
    } catch (error) {
      handleServiceError(error, 'Erro ao adicionar carta.');
    }
  };

  const handleRemover = async (e, cardId, slot = 'Main') => {
    e.preventDefault(); // Evita menu de contexto nativo
    try {
      await removerUnidadeCartaDoDeck(deck.id, cardId, slot, tokenRef.current);
      await carregarDetalhes();
    } catch (error) {
      handleServiceError(error, 'Erro ao remover carta.');
    }
  };

  // ── Drag and Drop Handlers ─────────────────────────────────────────────────
  const onDragStartCatalog = (e, card, isExtra) => {
    setDraggedCard({ cardId: card.cardId, defaultSlot: isExtra ? 'Extra' : 'Main' });
    // Imagem fantasma (ghost) transparente por padrão no HTML5
  };

  const onDragOverZone = (e, zoneName) => {
    e.preventDefault(); // Necessário para permitir o drop
    if (dragOverZone !== zoneName) setDragOverZone(zoneName);
  };

  const onDragLeaveZone = () => setDragOverZone(null);

  const onDropZone = async (e, targetZone) => {
    e.preventDefault();
    setDragOverZone(null);
    if (!draggedCard) return;

    const currentCard = draggedCard;
    setDraggedCard(null);

    if (currentCard.sourceSlot) {
      // Mover entre zonas do deck: faz remove + add e recarrega UMA única vez
      if (currentCard.sourceSlot !== targetZone) {
        try {
          await removerUnidadeCartaDoDeck(deck.id, currentCard.cardId, currentCard.sourceSlot, tokenRef.current);
          await adicionarCartaAoDeck(deck.id, currentCard.cardId, targetZone, 1, tokenRef.current);
          await carregarDetalhes(); // único reload
        } catch (error) {
          handleServiceError(error, 'Erro ao mover carta.');
        }
      }
    } else {
      // Adicionar do catálogo para uma zona
      try {
        await adicionarCartaAoDeck(deck.id, currentCard.cardId, targetZone, 1, tokenRef.current);
        await carregarDetalhes(); // único reload
      } catch (error) {
        handleServiceError(error, 'Erro ao adicionar carta.');
      }
    }
  };

  const onDropCatalog = async (e) => {
    e.preventDefault();
    setDragOverZone(null);
    if (!draggedCard || !draggedCard.sourceSlot) return; // Se sourceSlot existir, veio do deck

    const currentCard = draggedCard;
    setDraggedCard(null);

    try {
      await removerUnidadeCartaDoDeck(deck.id, currentCard.cardId, currentCard.sourceSlot, tokenRef.current);
      await carregarDetalhes();
    } catch (error) {
      handleServiceError(error, 'Erro ao remover carta.');
    }
  };

  if (erroCarregamento) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#e74c3c', marginBottom: 16 }}>{erroCarregamento}</p>
      <button className="btn-back" onClick={() => navigate('/decks')}>← Voltar</button>
    </div>
  );

  if (!deck) return <div className="loading">Carregando Deck...</div>;

  const corTema  = deck.configuration?.corTema || '#0028B3';
  const totalCards = deck.deckCards?.reduce((sum, it) => sum + (it.quantidade || 0), 0) || 0;

  const cartasParaExibir = catalogoGlobal;

  // Stacks do deck atual
  const mainCards  = stackCards(deck.deckCards?.filter(dc => (dc.slot || dc.Slot || 'Main') === 'Main') || []);
  const extraCards = stackCards(deck.deckCards?.filter(dc => (dc.slot || dc.Slot) === 'Extra') || []);
  const sideCards  = stackCards(deck.deckCards?.filter(dc => (dc.slot || dc.Slot) === 'Side') || []);

  const countMain  = mainCards.reduce((s, c) => s + c.quantidade, 0);
  const countExtra = extraCards.reduce((s, c) => s + c.quantidade, 0);
  const countSide  = sideCards.reduce((s, c) => s + c.quantidade, 0);

  return (
    <div className="deck-detail-container">
      <header className="deck-detail-header" style={{ borderLeft: `6px solid ${corTema}` }}>
        <button className="btn-back" onClick={() => navigate(-1)}>← Voltar</button>
        <div className="deck-header-info">
          <h1>{deck.nome}</h1>
          <div className="deck-badges">
            <span className="badge-format" style={{ backgroundColor: corTema }}>{deck.configuration?.formato}</span>
            {carregandoPreco && (
              <span className="badge-preco badge-preco--loading">💰 Calculando...</span>
            )}
            {!carregandoPreco && precoDeck && (
              <span className="badge-preco" title={`USD: R$ ${precoDeck.cotacoes.USD.toFixed(2)} | EUR: R$ ${precoDeck.cotacoes.EUR.toFixed(2)} (Cardmarket)`}>
                💰 {precoDeck.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
          </div>
        </div>
        <div className="deck-header-actions">
          <button className="btn-edit-deck" onClick={abrirEdicao} title="Editar deck">✎ Editar</button>
          <button className="btn-delete-deck" onClick={() => setConfirmExcluir(true)} title="Excluir deck">🗑 Excluir</button>
        </div>
      </header>

      <div className="deck-builder-grid">
        {/* COLUNA 1: CATÁLOGO */}
        <section 
          className={`search-column ${dragOverZone === 'Catalog' ? 'drag-over' : ''}`}
          onDragOver={(e) => onDragOverZone(e, 'Catalog')}
          onDragLeave={onDragLeaveZone}
          onDrop={onDropCatalog}
        >
          <div className="search-box">
            <input
              type="text"
              placeholder="Digite o nome da carta..."
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
            />
          </div>

          <div className="catalog-results">
            {carregandoCatalogo && <p className="helper-text">Buscando...</p>}
            {!carregandoCatalogo && inputTexto.trim() && catalogoGlobal.length === 0 && <p className="helper-text">Nenhuma carta encontrada.</p>}
            
            {cartasParaExibir.map(card => {
              const tipo = (card.raw?.type || card.raw?.Type || '').toString();
              const isExtra = /Fusion|Synchro|XYZ|Link/i.test(tipo);
              const thumbUrl = getSmallImageUrl(card.imagem, card.cardId);

              // Conta cópias no deck para feedback visual
              const noDeck = deck.deckCards?.filter(dc => dc.cardId === card.cardId).reduce((s, c) => s + c.quantidade, 0) || 0;

              return (
                <div 
                  key={card.cardId} 
                  className="builder-card"
                  draggable
                  onDragStart={(e) => onDragStartCatalog(e, card, isExtra)}
                  onClick={() => handleAdicionar(card.cardId, isExtra ? 'Extra' : 'Main')}
                  onContextMenu={(e) => { e.preventDefault(); setCartaEmDestaque(card); }}
                  title="Clique Esquerdo: Adicionar | Clique Direito: Inspecionar"
                >
                  {noDeck > 0 && <div className="stack-badge" style={{ top: -6, left: -6, bottom: 'auto', right: 'auto', background: '#0028B3' }}>{noDeck}</div>}
                  <div className="builder-card-image">
                    <img src={thumbUrl} alt={card.nome} loading="lazy" />
                  </div>
                </div>
              );
            })}

            {catalogoHasMore && (
              <div style={{ textAlign: 'center', marginTop: 8, gridColumn: '1 / -1' }}>
                <button onClick={carregarMaisCartas} disabled={carregandoCatalogo} style={{ padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
                  {carregandoCatalogo ? 'Carregando...' : 'Carregar mais...'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* COLUNA 2: ZONAS DO DECK */}
        <section className="deck-list-column">
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Meu Deck</h2>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 20 }}>
            Clique Direito para remover. Clique Esquerdo para ver detalhes. Passe o mouse e clique no <strong>+</strong> para adicionar mais cópias.
          </p>

          {/* MAIN DECK */}
          <div 
            className={`deck-zone ${dragOverZone === 'Main' ? 'drag-over' : ''}`}
            onDragOver={(e) => onDragOverZone(e, 'Main')}
            onDragLeave={onDragLeaveZone}
            onDrop={(e) => onDropZone(e, 'Main')}
          >
            <div className="deck-zone-header">
              <span>Main Deck</span>
              <span style={{ color: countMain > 60 ? '#e74c3c' : 'inherit' }}>{countMain} / 60</span>
            </div>
            <div className="deck-zone-grid">
              {mainCards.map(item => {
                const thumbUrl = getSmallImageUrl(item.card?.imageUrl || item.card?.ImageUrl, item.cardId);
                return (
                  <div 
                    key={item.cardId} 
                    className="builder-card"
                    draggable
                    onDragStart={(e) => setDraggedCard({ cardId: item.cardId, sourceSlot: 'Main' })}
                    onClick={() => setCartaEmDestaque({ ...item.card, cardId: item.cardId, raw: item.card })}
                    onContextMenu={(e) => handleRemover(e, item.cardId, 'Main')}
                    title="Clique Esquerdo: Detalhes | Clique Direito: Remover"
                  >
                    <div className="builder-card-image">
                      <img src={thumbUrl} alt={item.card?.name} loading="lazy" />
                    </div>
                    {item.quantidade > 1 && <div className="stack-badge">{item.quantidade}</div>}
                    <button 
                      className="btn-quick-add"
                      onClick={(e) => { e.stopPropagation(); handleAdicionar(item.cardId, 'Main'); }}
                      title="Adicionar cópia"
                    >+</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXTRA DECK */}
          <div 
            className={`deck-zone ${dragOverZone === 'Extra' ? 'drag-over' : ''}`}
            onDragOver={(e) => onDragOverZone(e, 'Extra')}
            onDragLeave={onDragLeaveZone}
            onDrop={(e) => onDropZone(e, 'Extra')}
          >
            <div className="deck-zone-header">
              <span>Extra Deck</span>
              <span style={{ color: countExtra > 15 ? '#e74c3c' : 'inherit' }}>{countExtra} / 15</span>
            </div>
            <div className="deck-zone-grid">
              {extraCards.map(item => {
                const thumbUrl = getSmallImageUrl(item.card?.imageUrl || item.card?.ImageUrl, item.cardId);
                return (
                  <div 
                    key={item.cardId} className="builder-card"
                    draggable
                    onDragStart={(e) => setDraggedCard({ cardId: item.cardId, sourceSlot: 'Extra' })}
                    onClick={() => setCartaEmDestaque({ ...item.card, cardId: item.cardId, raw: item.card })}
                    onContextMenu={(e) => handleRemover(e, item.cardId, 'Extra')}
                    title="Clique Esquerdo: Detalhes | Clique Direito: Remover"
                  >
                    <div className="builder-card-image"><img src={thumbUrl} alt={item.card?.name} /></div>
                    {item.quantidade > 1 && <div className="stack-badge">{item.quantidade}</div>}
                    <button 
                      className="btn-quick-add"
                      onClick={(e) => { e.stopPropagation(); handleAdicionar(item.cardId, 'Extra'); }}
                      title="Adicionar cópia"
                    >+</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDE DECK */}
          <div 
            className={`deck-zone ${dragOverZone === 'Side' ? 'drag-over' : ''}`}
            onDragOver={(e) => onDragOverZone(e, 'Side')}
            onDragLeave={onDragLeaveZone}
            onDrop={(e) => onDropZone(e, 'Side')}
          >
            <div className="deck-zone-header">
              <span>Side Deck</span>
              <span style={{ color: countSide > 15 ? '#e74c3c' : 'inherit' }}>{countSide} / 15</span>
            </div>
            <div className="deck-zone-grid">
              {sideCards.map(item => {
                const thumbUrl = getSmallImageUrl(item.card?.imageUrl || item.card?.ImageUrl, item.cardId);
                return (
                  <div 
                    key={item.cardId} className="builder-card"
                    draggable
                    onDragStart={(e) => setDraggedCard({ cardId: item.cardId, sourceSlot: 'Side' })}
                    onClick={() => setCartaEmDestaque({ ...item.card, cardId: item.cardId, raw: item.card })}
                    onContextMenu={(e) => handleRemover(e, item.cardId, 'Side')}
                    title="Clique Esquerdo: Detalhes | Clique Direito: Remover"
                  >
                    <div className="builder-card-image"><img src={thumbUrl} alt={item.card?.name} /></div>
                    {item.quantidade > 1 && <div className="stack-badge">{item.quantidade}</div>}
                    <button 
                      className="btn-quick-add"
                      onClick={(e) => { e.stopPropagation(); handleAdicionar(item.cardId, 'Side'); }}
                      title="Adicionar cópia"
                    >+</button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* MODAL DE INSPEÇÃO (Alta Resolução) */}
      {cartaEmDestaque && (
        <div className="modal-overlay" onClick={() => setCartaEmDestaque(null)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            background: 'rgba(10,10,26,0.95)', border: '1px solid rgba(0,40,179,0.4)', borderRadius: 16,
            padding: 24, display: 'flex', gap: 24, maxWidth: 700, width: '90%', color: '#fff',
          }}>
            {/* Imagem Original HD no Modal */}
            <div style={{ flexShrink: 0 }}>
              <img src={cartaEmDestaque.imagem || cartaEmDestaque.raw?.imageUrl || cartaEmDestaque.raw?.ImageUrl} alt={cartaEmDestaque.nome || cartaEmDestaque.raw?.name} style={{ width: 220, borderRadius: 10 }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#4a7ffd' }}>{cartaEmDestaque.nome || cartaEmDestaque.raw?.name}</h3>
                <button onClick={() => setCartaEmDestaque(null)} style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {(cartaEmDestaque.raw?.type || cartaEmDestaque.raw?.Type) && <span style={{ background: 'rgba(0,40,179,0.3)', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{cartaEmDestaque.raw.type || cartaEmDestaque.raw.Type}</span>}
                {(cartaEmDestaque.raw?.attribute || cartaEmDestaque.raw?.Attribute) && <span style={{ background: 'rgba(241,196,15,0.2)', color: '#f1c40f', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{cartaEmDestaque.raw.attribute || cartaEmDestaque.raw.Attribute}</span>}
                {(cartaEmDestaque.raw?.race || cartaEmDestaque.raw?.Race) && <span style={{ background: 'rgba(155,89,182,0.2)', color: '#9b59b6', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{cartaEmDestaque.raw.race || cartaEmDestaque.raw.Race}</span>}
                {(cartaEmDestaque.raw?.level ?? cartaEmDestaque.raw?.Level) != null && <span style={{ background: 'rgba(230,126,34,0.2)', color: '#e67e22', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>⭐ {cartaEmDestaque.raw.level ?? cartaEmDestaque.raw.Level}</span>}
                {(cartaEmDestaque.raw?.atk ?? cartaEmDestaque.raw?.Atk) != null && <span style={{ background: 'rgba(46,204,113,0.2)', color: '#2ecc71', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>ATK: {cartaEmDestaque.raw.atk ?? cartaEmDestaque.raw.Atk}</span>}
                {(cartaEmDestaque.raw?.def ?? cartaEmDestaque.raw?.Def) != null && <span style={{ background: 'rgba(52,152,219,0.2)', color: '#3498db', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>DEF: {cartaEmDestaque.raw.def ?? cartaEmDestaque.raw.Def}</span>}
              </div>

              <p style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.6, maxHeight: 180, overflowY: 'auto' }}>
                {cartaEmDestaque.raw?.desc}
              </p>
              
              <div style={{ marginTop: 24, display: 'flex', gap: 16, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
                <button 
                  onClick={() => handleAdicionar(cartaEmDestaque.cardId, 'Main')}
                  className="btn-modal-add btn-modal-main"
                >
                  + Main Deck
                </button>
                <button 
                  onClick={() => handleAdicionar(cartaEmDestaque.cardId, 'Extra')}
                  className="btn-modal-add btn-modal-extra"
                >
                  + Extra Deck
                </button>
                <button 
                  onClick={() => handleAdicionar(cartaEmDestaque.cardId, 'Side')}
                  className="btn-modal-add btn-modal-side"
                >
                  + Side Deck
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE EDIÇÃO */}
      {modalEdicao && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Deck</h2>
            <form onSubmit={salvarEdicao}>
              <div className="form-group">
                <label>Nome do Deck</label>
                <input
                  type="text"
                  required
                  maxLength="30"
                  value={dadosEdicao.nome}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, nome: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  rows="3"
                  value={dadosEdicao.descricao}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, descricao: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Formato</label>
                <select
                  className="form-select"
                  value={dadosEdicao.formato}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, formato: e.target.value })}
                >
                  <option value="TCG">TCG</option>
                  <option value="OCG">OCG</option>
                  <option value="GOAT">Goat Format</option>
                </select>
              </div>
              <div className="form-group">
                <label>Cor do Tema</label>
                <div className="color-options">
                  {CORES_DISPONIVEIS.map((cor) => (
                    <button
                      key={cor.hex}
                      type="button"
                      title={cor.nome}
                      className={`color-dot ${dadosEdicao.corTema === cor.hex ? 'active' : ''}`}
                      style={{ backgroundColor: cor.hex }}
                      onClick={() => setDadosEdicao({ ...dadosEdicao, corTema: cor.hex })}
                    />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Capa do Deck</label>
                {deck.deckCards?.length > 0 ? (
                  <div className="capa-picker">
                    {stackCards(deck.deckCards).map(item => {
                      const thumbUrl = getSmallImageUrl(item.card?.imageUrl || item.card?.ImageUrl, item.cardId);
                      const selecionada = dadosEdicao.capaCardId === item.cardId;
                      return (
                        <button
                          key={item.cardId}
                          type="button"
                          className={`capa-option ${selecionada ? 'capa-selecionada' : ''}`}
                          onClick={() => setDadosEdicao(d => ({ ...d, capaCardId: selecionada ? null : item.cardId }))}
                          title={item.card?.name || item.cardId}
                        >
                          <img src={thumbUrl} alt={item.card?.name} />
                          {selecionada && <span className="capa-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Adicione cartas ao deck para escolher uma capa.
                  </p>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setModalEdicao(false)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-save">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmDialog
        isOpen={confirmExcluir}
        onClose={() => setConfirmExcluir(false)}
        onConfirm={confirmarExclusao}
        title="Excluir Deck"
        message="Deseja deletar este deck permanentemente? Esta ação não pode ser desfeita."
      />
    </div>
  );
}

export default DeckDetalhesPage;