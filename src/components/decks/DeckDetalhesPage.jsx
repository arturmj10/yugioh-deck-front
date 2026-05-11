// src/components/decks/DeckDetalhesPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getDeckById } from '../../services/deckService';
// Importaremos o serviço de busca de cartas futuramente
import './DeckDetalhes.css';

function DeckDetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]); // Cartas da tabela 'Cards'

  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        const dados = await getDeckById(id);
        setDeck(dados);
      } catch (error) {
        console.error("Erro ao carregar deck:", error);
      }
    };
    carregarDetalhes();
  }, [id]);

  if (!deck) return <div className="loading">Carregando Deck...</div>;

  const corTema = deck.configuration?.corTema || '#0028B3';

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
              {deck.deckCards?.length || 0} Cartas
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
              placeholder="Procurar carta no banco..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button className="btn-search">Buscar</button>
          </div>
          <div className="catalog-results">
            <p className="helper-text">Resultados da busca aparecerão aqui...</p>
          </div>
        </section>

        {/* COLUNA 2: LISTA DO DECK (Tabela DeckCards) */}
        <section className="deck-list-column">
          <h2>Cartas no Deck</h2>
          <div className="current-deck-list">
            {deck.deckCards?.length > 0 ? (
              deck.deckCards.map((item) => (
                <div key={item.cardId} className="card-item">
                  <span>{item.quantidade}x {item.card.nome}</span>
                  <div className="card-item-actions">
                    <button>+</button>
                    <button>-</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-msg">Nenhuma carta adicionada ainda.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default DeckDetalhesPage;