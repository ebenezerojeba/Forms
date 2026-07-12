import React, { useState } from 'react';
import FormManager from './components/FormManager';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [view, setView] = useState('user'); // Toggle modes: 'user' or 'admin'

  return (
    <div className="relative antialiased selection:bg-slate-900 selection:text-white">
      
      {/* Absolute Layout Workspace Toggle Switch */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setView(view === 'user' ? 'admin' : 'user')}
          className="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white text-xs font-black px-4 py-2 rounded-full shadow-2xl transition-all"
        >
          Switch View: Mode [{view.toUpperCase()}]
        </button>
      </div>

      {view === 'user' ? <FormManager /> : <AdminDashboard />}
    </div>
  );
}

export default App;