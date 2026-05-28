// src/components/decks/DecksPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { getDecks, criarDeck, deletarDeck, atualizarDeck } from '../../services/deckService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../ui/ConfirmDialog';
import './Decks.css';

function DecksPage() {
  const { token, logout } = useAuth();

  const [decks, setDecks] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  // Estado do ConfirmDialog (substitui window.confirm)
  const [confirmState, setConfirmState] = useState({ isOpen: false, deckId: null });

  const [novoDeck, setNovoDeck] = useState({
    nome: '', descricao: '', formato: 'TCG', corTema: '#0028B3',
  });

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroFormato, setFiltroFormato] = useState('Todos');

  const CORES_DISPONIVEIS = [
    { nome: 'Azul', hex: '#0028B3', hue: 220 },
    { nome: 'Luz', hex: '#f1c40f', hue: 45 },
    { nome: 'Fogo', hex: '#e74c3c', hue: 0 },
    { nome: 'Água', hex: '#3498db', hue: 200 },
    { nome: 'Vento', hex: '#2ecc71', hue: 140 },
    { nome: 'Terra', hex: '#a0522d', hue: 30 },
    { nome: 'Divino', hex: '#ff8c00', hue: 30 },
  ];

  const getHueFromColor = (hex) => {
    const cor = CORES_DISPONIVEIS.find(c => c.hex === hex);
    return cor ? cor.hue : 180;
  };

  // Trata erros de sessão expirada de forma centralizada
  const handleServiceError = useCallback((error, fallbackMsg) => {
    if (error.message === 'SESSION_EXPIRED') {
      toast.error('Sessão expirada. Faça login novamente.');
      logout();
    } else {
      toast.error(error.message || fallbackMsg);
    }
  }, [logout]);

  const carregarDecks = useCallback(async (nomeBusca = '', formatoBusca = 'Todos') => {
    try {
      const dados = await getDecks(token, nomeBusca, formatoBusca);
      setDecks(dados);
    } catch (error) {
      handleServiceError(error, 'Erro ao carregar decks do banco!');
    }
  }, [token, handleServiceError]);

  useEffect(() => {
    const handler = setTimeout(() => {
      carregarDecks(filtroNome, filtroFormato);
    }, 500);

    return () => clearTimeout(handler);
  }, [filtroNome, filtroFormato, carregarDecks]);

  const fecharModal = () => {
    setMostrarModal(false);
    setEditandoId(null);
    setNovoDeck({ nome: '', descricao: '', formato: 'TCG', corTema: '#0028B3' });
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (novoDeck.nome.trim().length > 30) {
      toast.warning('Nome limitado a 30 caracteres!');
      return;
    }

    const dadosParaEnviar = {
      nome: novoDeck.nome,
      descricao: novoDeck.descricao,
      configuration: {
        formato: novoDeck.formato,
        corTema: novoDeck.corTema,
      },
    };

    try {
      if (editandoId) {
        await atualizarDeck({ id: editandoId, ...dadosParaEnviar }, token);
        toast.success('Deck atualizado com sucesso! 🎴');
      } else {
        await criarDeck(dadosParaEnviar, token);
        toast.success('Novo deck criado! ⚔️');
      }
      fecharModal();
      carregarDecks(filtroNome, filtroFormato);
    } catch (error) {
      handleServiceError(error, 'Erro ao salvar deck.');
    }
  };

  // Abre o ConfirmDialog em vez do window.confirm nativo
  const handleExcluir = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmState({ isOpen: true, deckId: id });
  };

  const confirmarExclusao = async () => {
    const { deckId } = confirmState;
    setConfirmState({ isOpen: false, deckId: null });
    try {
      await deletarDeck(deckId, token);
      setDecks(decks.filter(d => d.id !== deckId));
      toast.info('Deck removido do inventário.');
    } catch (error) {
      handleServiceError(error, 'Não foi possível excluir o deck.');
    }
  };

  const abrirEdicao = (e, deck) => {
    e.preventDefault();
    e.stopPropagation();
    setNovoDeck({
      nome: deck.nome,
      descricao: deck.descricao,
      formato: deck.configuration?.formato || 'TCG',
      corTema: deck.configuration?.corTema || '#0028B3',
    });
    setEditandoId(deck.id);
    setMostrarModal(true);
  };

  const decksFiltrados = decks;

  return (
    <div className="decks-container">

      {/* FILTROS */}
      <div className="filters-container">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={filtroFormato}
            onChange={(e) => setFiltroFormato(e.target.value)}
            className="filter-select"
          >
            <option value="Todos">Todos os Formatos</option>
            <option value="TCG">TCG</option>
            <option value="OCG">OCG</option>
            <option value="GOAT">Goat Format</option>
          </select>
        </div>
      </div>

      <div className="decks-grid">
        <div className="deck-card add-card" onClick={() => setMostrarModal(true)}>
          <div className="add-button">
            <span className="plus-icon">+</span>
            <p>Novo Deck</p>
          </div>
        </div>

        {decksFiltrados.map((deck) => {
          const corPrimaria = deck.configuration?.corTema || '#333';
          const hueOffset = getHueFromColor(corPrimaria);
          const cartasCount = deck.deckCards?.reduce((s, c) => s + (c.quantidade || 0), 0) || 0;
          const capaId = deck.configuration?.capaCardId;
          const capaCard = deck.deckCards?.find(
            dc => dc.cardId === capaId || dc.card?.id === capaId || dc.card?.Id === capaId
          );
          const capaImg = capaCard?.card?.imageUrl
            || capaCard?.card?.ImageUrl
            || capaCard?.card?.imagem
            || 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

          return (
            <Link
              to={`/decks/${deck.id}`}
              key={deck.id}
              className="deck-card"
              style={{
                borderColor: corPrimaria,
                '--tema-cor': corPrimaria,
                '--hue-offset': `${hueOffset}deg`,
                background: `linear-gradient(135deg, ${corPrimaria}15 0%, var(--bg-panel) 100%)`,
              }}
            >
              <div className="card-actions">
                <button className="btn-edit" onClick={(e) => abrirEdicao(e, deck)} title="Editar Deck">✎</button>
                <button className="btn-delete" onClick={(e) => handleExcluir(e, deck.id)} title="Excluir Deck">🗑</button>
              </div>

              <div className="deck-image-placeholder">
                <img src={capaImg} alt={deck.nome} />
                <div className="deck-overlay">
                  <span>Ver Deck</span>
                </div>
              </div>

              <div className="deck-info">
                <h3 style={{ color: corPrimaria }}>{deck.nome}</h3>
                <p className="deck-desc">{deck.descricao}</p>
                <div className="deck-meta">
                  <span className="deck-format" style={{ color: corPrimaria, borderColor: corPrimaria }}>
                    {deck.configuration?.formato || 'TCG'}
                  </span>
                  <span className="deck-cards-count">{`${cartasCount}/60`}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editandoId ? 'Editar Deck' : 'Criar Novo Deck'}</h2>
            <form onSubmit={handleSalvar}>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Nome do Deck
                  <span style={{ fontSize: '0.7rem', color: novoDeck.nome.length >= 25 ? '#e74c3c' : '#aaa' }}>
                    {novoDeck.nome.length}/30
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength="30"
                  value={novoDeck.nome}
                  onChange={(e) => setNovoDeck({ ...novoDeck, nome: e.target.value })}
                  placeholder="Nome do Deck"
                />
              </div>

              <div className="form-group">
                <label>Descrição:</label>
                <textarea
                  rows="3"
                  value={novoDeck.descricao}
                  onChange={(e) => setNovoDeck({ ...novoDeck, descricao: e.target.value })}
                  placeholder="Estratégia do deck..."
                />
              </div>

              <div className="form-group">
                <label>Formato:</label>
                <select
                  className="form-select"
                  value={novoDeck.formato}
                  onChange={(e) => setNovoDeck({ ...novoDeck, formato: e.target.value })}
                >
                  <option value="TCG">TCG</option>
                  <option value="OCG">OCG</option>
                  <option value="GOAT">Goat Format</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cor do Tema:</label>
                <div className="color-options">
                  {CORES_DISPONIVEIS.map((cor) => (
                    <button
                      key={cor.hex}
                      type="button"
                      title={cor.nome}
                      className={`color-dot ${novoDeck.corTema === cor.hex ? 'active' : ''}`}
                      style={{ backgroundColor: cor.hex }}
                      onClick={() => setNovoDeck({ ...novoDeck, corTema: cor.hex })}
                    />
                  ))}
                </div>
                <span className="selected-color-name">
                  Atributo Selecionado: <strong>{CORES_DISPONIVEIS.find(c => c.hex === novoDeck.corTema)?.nome || 'Nenhum'}</strong>
                </span>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={fecharModal} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-save">
                  {editandoId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, deckId: null })}
        onConfirm={confirmarExclusao}
        title="Excluir Deck"
        message="Deseja deletar este deck permanentemente? Esta ação não pode ser desfeita."
      />
    </div>
  );
}

export default DecksPage;