import Sidebar from './Sidebar';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useState } from 'react';

export default function Layout({ children }) {
  const { stockUpdates } = useWebSocket();
  const [showFeed, setShowFeed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Live Stock Update Toast */}
        {stockUpdates.length > 0 && (
          <div className="fixed top-4 right-4 z-40">
            <button
              onClick={() => setShowFeed(!showFeed)}
              className="bg-[#1a1d27] border border-indigo-600/50 rounded-lg px-3 py-2 text-xs text-indigo-300 flex items-center gap-2 shadow-lg"
            >
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              {stockUpdates.length} stock event{stockUpdates.length > 1 ? 's' : ''}
            </button>
            {showFeed && (
              <div className="mt-2 bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-3 w-72 shadow-xl">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Live Stock Feed</p>
                {stockUpdates.slice(0, 5).map((u, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#2a2d3e] last:border-0">
                    <span className={u.newQty > u.oldQty ? 'text-emerald-400' : 'text-red-400'}>
                      {u.newQty > u.oldQty ? '↑' : '↓'}
                    </span>
                    <div>
                      <p className="text-xs text-gray-200 font-medium">{u.productName}</p>
                      <p className="text-xs text-gray-500">{u.oldQty} → {u.newQty} • {u.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
