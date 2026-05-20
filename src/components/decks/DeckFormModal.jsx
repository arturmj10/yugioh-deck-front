import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { CORES_DISPONIVEIS, FORMATOS_DECK, DECK_FORM_DEFAULT } from '../../constants/deckConstants';
import { deckToFormValues } from '../../utils/deckUtils';

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow';

function DeckFormModal({ isOpen, onClose, deckEditando, onSalvar }) {
  const [values, setValues] = useState(DECK_FORM_DEFAULT);

  useEffect(() => {
    if (isOpen) {
      setValues(deckEditando ? deckToFormValues(deckEditando) : DECK_FORM_DEFAULT);
    }
  }, [isOpen, deckEditando]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar(values);
  };

  const corSelecionada = CORES_DISPONIVEIS.find((c) => c.hex === values.corTema);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={deckEditando ? 'Editar Deck' : 'Criar Novo Deck'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
            Nome do Deck
            <span
              className={`text-xs font-normal ${
                values.nome.length >= 25 ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {values.nome.length}/30
            </span>
          </label>
          <input
            type="text"
            required
            maxLength={30}
            value={values.nome}
            onChange={(e) => setValues({ ...values, nome: e.target.value })}
            placeholder="Nome do Deck"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            rows={3}
            value={values.descricao}
            onChange={(e) => setValues({ ...values, descricao: e.target.value })}
            placeholder="Estratégia do deck..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
          <select
            value={values.formato}
            onChange={(e) => setValues({ ...values, formato: e.target.value })}
            className={`${inputClass} bg-white`}
          >
            {FORMATOS_DECK.map((formato) => (
              <option key={formato} value={formato}>
                {formato}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Tema</label>
          <div className="flex flex-wrap gap-2">
            {CORES_DISPONIVEIS.map((cor) => (
              <button
                key={cor.hex}
                type="button"
                title={cor.nome}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  values.corTema === cor.hex ? 'border-gray-800 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: cor.hex }}
                onClick={() => setValues({ ...values, corTema: cor.hex })}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Atributo selecionado: <strong>{corSelecionada?.nome || 'Nenhum'}</strong>
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {deckEditando ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default DeckFormModal;
