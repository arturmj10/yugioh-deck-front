import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-yugioh.png"
              alt="Yu-Gi-Oh Logo"
              className="h-10 w-auto object-contain"
            />
            <span className="text-lg font-bold text-gray-800 tracking-tight">
              Deck Builder
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Develin Gonçalves
            </span>
            <div
              className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold"
              title="Develin Gonçalves"
            >
              D
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
