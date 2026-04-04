import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Importa o container
import 'react-toastify/dist/ReactToastify.css'; // Importa o CSS padrão do Toast

import Layout from './components/layout/Layout';
import DecksPage from './components/decks/DecksPage';
import DeckDetalhesPage from './components/decks/DeckDetalhesPage';

function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          {/* Redireciona a raiz para a listagem de decks */}
          <Route path="/" element={<Navigate to="/decks" replace />} />
          
          <Route path="/decks" element={<DecksPage />} />
          
          {/* Rota para ver o conteúdo de um deck específico */}
          <Route path="/decks/:id" element={<DeckDetalhesPage />} />
        </Route>
      </Routes>

      {/* Container global de notificações */}
      <ToastContainer 
        position="bottom-right" // Aparece no canto inferior direito
        autoClose={3000}       // Fecha sozinho após 3 segundos
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"           // Tema escuro para combinar com o seu CSS
      />
    </>
  );
}

export default App;