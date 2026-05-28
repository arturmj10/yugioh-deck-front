import DeckCoverPicker, { DeckCoverPreview } from './DeckCoverPicker';

function DeckCoverSection({ deck, corTema, onSelectCapa }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
      <DeckCoverPreview deck={deck} className="mb-4 pb-4 border-b border-gray-100" />
      <DeckCoverPicker
        deck={deck}
        onSelect={onSelectCapa}
        accentColor={corTema}
      />
    </section>
  );
}

export default DeckCoverSection;
