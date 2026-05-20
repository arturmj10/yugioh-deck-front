import { X } from 'lucide-react';
import { CARD_BACK_URL } from '../../constants/deckConstants';

function CardInspectModal({ card, onClose }) {
  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={card.imagem || CARD_BACK_URL}
          alt={card.nome}
          className="max-h-[80vh] rounded-xl shadow-2xl"
        />
        <h3 className="text-white text-center mt-4 text-lg font-medium drop-shadow-lg">
          {card.nome}
        </h3>
      </div>
    </div>
  );
}

export default CardInspectModal;
