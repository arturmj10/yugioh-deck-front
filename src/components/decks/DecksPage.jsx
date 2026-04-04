// src/components/decks/DecksPage.jsx
import { useEffect, useState } from 'react';
import { getDecks, criarDeck, deletarDeck, atualizarDeck } from '../../services/deckService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // 1. Importar o toast
import './Decks.css';

function DecksPage() {
  const [decks, setDecks] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  const [novoDeck, setNovoDeck] = useState({ 
    nome: '', 
    descricao: '', 
    formato: 'TCG', 
    corTema: '#4b0082' 
  });

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroFormato, setFiltroFormato] = useState('Todos');

  const CORES_DISPONIVEIS = [
    { nome: 'Trevas', hex: '#4b0082' },
    { nome: 'Luz', hex: '#f1c40f' },
    { nome: 'Fogo', hex: '#e74c3c' },
    { nome: 'Água', hex: '#3498db' },
    { nome: 'Vento', hex: '#2ecc71' },
    { nome: 'Terra', hex: '#a0522d' },
    { nome: 'Divino', hex: '#ff8c00' }
  ];

  useEffect(() => {
    carregarDecks();
  }, []);

  const carregarDecks = async () => {
    try {
      const dados = await getDecks();
      setDecks(dados);
    } catch (error) {
      toast.error("Erro ao carregar decks do banco!"); // Toast de erro
      console.error(error);
    }
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setEditandoId(null);
    setNovoDeck({ nome: '', descricao: '', formato: 'TCG', corTema: '#4b0082' });
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (novoDeck.nome.trim().length > 30) {
      toast.warning("Nome limitado a 30 caracteres!"); // Toast de aviso
      return;
    }

    const dadosParaEnviar = {
      nome: novoDeck.nome,
      descricao: novoDeck.descricao,
      configuration: {
        formato: novoDeck.formato,
        corTema: novoDeck.corTema
      }
    };

    try {
      if (editandoId) {
        await atualizarDeck({ id: editandoId, ...dadosParaEnviar });
        toast.success("Deck atualizado com sucesso! 🎴"); // Toast de sucesso
      } else {
        await criarDeck(dadosParaEnviar);
        toast.success("Novo deck criado! ⚔️"); // Toast de sucesso
      }
      fecharModal();
      carregarDecks();
    } catch (error) {
      toast.error("Erro ao salvar no banco do Docker."); // Toast de erro
    }
  };

  const handleExcluir = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Deseja deletar este deck permanentemente?")) {
      try {
        await deletarDeck(id);
        setDecks(decks.filter(d => d.id !== id));
        toast.info("Deck removido do inventário."); // Toast informativo
      } catch (error) {
        toast.error("Não foi possível excluir o deck.");
      }
    }
  };

  const abrirEdicao = (e, deck) => {
    e.preventDefault();
    e.stopPropagation();
    setNovoDeck({ 
      nome: deck.nome, 
      descricao: deck.descricao, 
      formato: deck.configuration?.formato || 'TCG',
      corTema: deck.configuration?.corTema || '#4b0082' 
    });
    setEditandoId(deck.id);
    setMostrarModal(true);
  };

  const decksFiltrados = decks.filter(deck => {
    const matchesNome = deck.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const matchesFormato = filtroFormato === 'Todos' || deck.configuration?.formato === filtroFormato;
    return matchesNome && matchesFormato;
  });

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
            <option value="Speed Duel">Speed Duel</option>
            <option value="Master Duel">Master Duel</option>
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
          return (
            <Link 
              to={`/decks/${deck.id}`} 
              key={deck.id} 
              className="deck-card" 
              style={{ borderColor: corPrimaria }}
            >
              <div className="card-actions">
                <button className="btn-edit" onClick={(e) => abrirEdicao(e, deck)} title="Editar Deck">✎</button>
                <button className="btn-delete" onClick={(e) => handleExcluir(e, deck.id)} title="Excluir Deck">🗑</button>
              </div>

              <div className="deck-image-placeholder">
                <img src="https://images.ygoprodeck.com/images/cards/back_high.jpg" alt="Verso" />
              </div>
              
              <div className="deck-info">
                <h3 style={{ color: corPrimaria }}>{deck.nome}</h3>
                <p className="deck-desc">{deck.descricao}</p>
                <span className="deck-format" style={{ backgroundColor: corPrimaria }}>
                  {deck.configuration?.formato || 'TCG'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* MODAL */}
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
                  onChange={(e) => setNovoDeck({...novoDeck, nome: e.target.value})}
                  placeholder="Nome do Deck"
                />
              </div>

              <div className="form-group">
                <label>Descrição:</label>
                <textarea 
                  rows="3"
                  value={novoDeck.descricao}
                  onChange={(e) => setNovoDeck({...novoDeck, descricao: e.target.value})}
                  placeholder="Estratégia do deck..."
                />
              </div>

              <div className="form-group">
                <label>Formato:</label>
                <select 
                  className="form-select"
                  value={novoDeck.formato}
                  onChange={(e) => setNovoDeck({...novoDeck, formato: e.target.value})}
                >
                  <option value="TCG">TCG</option>
                  <option value="OCG">OCG</option>
                  <option value="Speed Duel">Speed Duel</option>
                  <option value="Master Duel">Master Duel</option>
                </select>
              </div>

            <div className="form-group">
              <label>Cor do Tema:</label>
              <div className="color-options">
                {CORES_DISPONIVEIS.map((cor) => (
                  <button
                    key={cor.hex}
                    type="button"
                    title={cor.nome} // Aparece ao passar o mouse
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
    </div>
  );
}

export default DecksPage;