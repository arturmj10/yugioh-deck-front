import ConfirmDialog from '../ui/ConfirmDialog';

function DeckDeleteDialog({ isOpen, onClose, onConfirm, deck }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Deletar Deck"
      message={
        deck
          ? `Tem certeza que deseja excluir o deck "${deck.nome}"? Esta ação não pode ser desfeita.`
          : ''
      }
    />
  );
}

export default DeckDeleteDialog;
