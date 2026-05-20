import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DecksPage from './components/decks/DecksPage';
import DeckDetalhesPage from './components/decks/DeckDetalhesPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/decks" replace />} />
        <Route path="/decks" element={<DecksPage />} />
        <Route path="/decks/:id" element={<DeckDetalhesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
