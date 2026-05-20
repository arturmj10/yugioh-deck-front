import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  getDeckById,
  adicionarCartaAoDeck,
  removerUnidadeCartaDoDeck,
} from '../../services/deckService';
import { buscarCartasDoCatalogo } from '../../services/cardService';
import { useToast } from '../../hooks/useToast';
import {
  filterCatalogCards,
  FILTROS_CATALOGO_INICIAL,
} from '../../utils/catalogFilters';
import DeckDetailHeader from './DeckDetailHeader';
import CardCatalogPanel from './CardCatalogPanel';
import DeckCardsPanel from './DeckCardsPanel';
import CardInspectModal from './CardInspectModal';

function DeckDetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [deck, setDeck] = useState(null);
  const [loadingDeck, setLoadingDeck] = useState(true);
  const [inputTexto, setInputTexto] = useState('');
  const [catalogoGlobal, setCatalogoGlobal] = useState([]);
  const [limiteExibicao, setLimiteExibicao] = useState(20);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(false);
  const [cartaEmDestaque, setCartaEmDestaque] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_CATALOGO_INICIAL);

  const carregarDetalhes = async (silencioso = false) => {
    try {
      if (!silencioso) setLoadingDeck(true);
      const dados = await getDeckById(id);
      setDeck(dados);
    } catch (error) {
      toast.error('Não foi possível carregar o deck.');
      console.error(error);
    } finally {
      if (!silencioso) setLoadingDeck(false);
    }
  };

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const carregarCatalogo = async () => {
      try {
        setCarregandoCatalogo(true);
        const dados = await buscarCartasDoCatalogo('a');
        if (mounted) setCatalogoGlobal(dados);
      } catch (error) {
        console.error(error);
        if (mounted) toast.error('Erro ao inicializar o catálogo de cartas.');
      } finally {
        if (mounted) setCarregandoCatalogo(false);
      }
    };
    carregarCatalogo();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setLimiteExibicao(20);
  }, [inputTexto, filtros]);

  const handleAdicionar = async (cardId, slotSelecionado = 'Main') => {
    if (!deck) return;
    try {
      await adicionarCartaAoDeck(deck.id, cardId, slotSelecionado, 1);
      toast.success('Carta adicionada ao deck!');
      await carregarDetalhes(true);
    } catch (error) {
      toast.error(error.message || 'Erro ao adicionar carta.');
    }
  };

  const handleRemover = async (cardId, slotDaCarta = 'Main') => {
    if (!deck) return;
    try {
      await removerUnidadeCartaDoDeck(deck.id, cardId, slotDaCarta);
      toast.info('Uma cópia foi removida.');
      await carregarDetalhes(true);
    } catch (error) {
      toast.error(error.message || 'Erro ao remover carta.');
    }
  };

  if (loadingDeck || !deck) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-3 text-gray-500">Carregando deck...</span>
      </div>
    );
  }

  const corTema = deck.configuration?.corTema || '#0028B3';
  const cartasFiltradas = filterCatalogCards(catalogoGlobal, inputTexto, filtros);
  const cartasParaExibir = cartasFiltradas.slice(0, limiteExibicao);

  return (
    <div className="p-6">
      <DeckDetailHeader
        deck={deck}
        corTema={corTema}
        onVoltar={() => navigate(-1)}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CardCatalogPanel
          inputTexto={inputTexto}
          onInputTextoChange={setInputTexto}
          filtros={filtros}
          onFiltrosChange={setFiltros}
          carregandoCatalogo={carregandoCatalogo}
          cartasParaExibir={cartasParaExibir}
          cartasFiltradasCount={cartasFiltradas.length}
          limiteExibicao={limiteExibicao}
          onCarregarMais={() => setLimiteExibicao((l) => l + 20)}
          onInspecionar={setCartaEmDestaque}
          onAdicionar={handleAdicionar}
        />

        <DeckCardsPanel
          deck={deck}
          onAdicionar={handleAdicionar}
          onRemover={handleRemover}
        />
      </div>

      <CardInspectModal card={cartaEmDestaque} onClose={() => setCartaEmDestaque(null)} />
    </div>
  );
}

export default DeckDetalhesPage;
