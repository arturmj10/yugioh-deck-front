import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  getDecks,
  getDeckById,
  criarDeck,
  atualizarDeck,
  deletarDeck,
} from '../../services/deckService';
import { useToast } from '../../hooks/useToast';
import { formValuesToPayload, enrichDecksWithCards, getDeckCards } from '../../utils/deckUtils';
import DeckGrid from './DeckGrid';
import DeckFormModal from './DeckFormModal';
import DeckDeleteDialog from './DeckDeleteDialog';

function DecksPage() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroFormato, setFiltroFormato] = useState('Todos');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deckEditando, setDeckEditando] = useState(null);
  const [deckDeletando, setDeckDeletando] = useState(null);

  const toast = useToast();

  useEffect(() => {
    carregarDecks();
  }, []);

  const carregarDecks = async () => {
    try {
      setLoading(true);
      const dados = await getDecks();
      const decksComCartas = await enrichDecksWithCards(dados, getDeckById);
      setDecks(decksComCartas);
    } catch (error) {
      toast.error('Não foi possível carregar os decks. Verifique se a API está rodando.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNovo = () => {
    setDeckEditando(null);
    setIsFormModalOpen(true);
  };

  const handleEditar = (e, deck) => {
    e.preventDefault();
    e.stopPropagation();
    setDeckEditando(deck);
    setIsFormModalOpen(true);
  };

  const handleConfirmarDelete = (e, deck) => {
    e.preventDefault();
    e.stopPropagation();
    setDeckDeletando(deck);
    setIsDeleteDialogOpen(true);
  };

  const handleSalvar = async (values) => {
    if (values.nome.trim().length > 30) {
      toast.warning('Nome limitado a 30 caracteres!');
      return;
    }

    const payload = formValuesToPayload(values);

    try {
      if (deckEditando) {
        await atualizarDeck({ id: deckEditando.id, ...payload });
        setDecks((prev) =>
          prev.map((d) =>
            d.id === deckEditando.id
              ? {
                  ...d,
                  ...payload,
                  configuration: payload.configuration,
                  deckCards: d.deckCards,
                }
              : d
          )
        );
        toast.success(`Deck "${values.nome}" atualizado com sucesso!`);
      } else {
        const novoDeck = await criarDeck(payload);
        setDecks((prev) => [...prev, { ...novoDeck, deckCards: getDeckCards(novoDeck) }]);
        toast.success(`Deck "${values.nome}" criado com sucesso!`);
      }
      setIsFormModalOpen(false);
      setDeckEditando(null);
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar o deck.');
      console.error(error);
    }
  };

  const handleDeletar = async () => {
    try {
      await deletarDeck(deckDeletando.id);
      setDecks((prev) => prev.filter((d) => d.id !== deckDeletando.id));
      toast.info(`Deck "${deckDeletando.nome}" removido do inventário.`);
      setIsDeleteDialogOpen(false);
      setDeckDeletando(null);
    } catch (error) {
      toast.error(error.message || 'Não foi possível excluir o deck.');
      setIsDeleteDialogOpen(false);
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-500">Carregando decks...</span>
        </div>
      ) : (
        <DeckGrid
          decks={decks}
          filtroNome={filtroNome}
          filtroFormato={filtroFormato}
          onFiltroNomeChange={setFiltroNome}
          onFiltroFormatoChange={setFiltroFormato}
          onNovo={handleNovo}
          onEditar={handleEditar}
          onDeletar={handleConfirmarDelete}
        />
      )}

      <DeckFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setDeckEditando(null);
        }}
        deckEditando={deckEditando}
        onSalvar={handleSalvar}
      />

      <DeckDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeckDeletando(null);
        }}
        onConfirm={handleDeletar}
        deck={deckDeletando}
      />
    </div>
  );
}

export default DecksPage;
