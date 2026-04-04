import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getDeckById } from '../../services/deckService';

function DeckDetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);

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

  if (!deck) return <div>Carregando Deck...</div>;

  return (
    <div className="deck-detail-container" style={{ padding: '20px', color: 'white' }}>
      <button onClick={() => navigate(-1)}>← Voltar</button>
      <h1>{deck.nome}</h1>
      <p>Formato: {deck.configuration?.formato}</p>
      <div className="cards-list">
        {/* Futuramente listaremos as cartas aqui */}
        <p>Este deck ainda não possui cartas visualizáveis.</p>
      </div>
    </div>
  );
}

export default DeckDetalhesPage;