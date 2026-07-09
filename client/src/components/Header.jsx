import React from 'react';
import { ShieldAlert, LogOut, PlusCircle, Info, MessageSquareCode } from 'lucide-react';

export default function Header({ user, currentView, setView, onLogout }) {
  return (
    <header>
      <div className="header-logo-container" style={{ cursor: 'pointer' }} onClick={() => setView('feed')}>
        {/* Underneath official-looking text */}
        <div className="pharma-title">
          Lo Que <span className="official-strikethrough">Neura</span> Quiere Borrar
        </div>
        {/* Graffiti style overlay */}
        <div className="protest-title-overlay">
          NEURA MIENTE
        </div>
      </div>

      <nav className="header-nav">
        <button 
          className={`btn ${currentView === 'feed' ? 'btn-teal' : 'btn-text'}`}
          onClick={() => setView('feed')}
        >
          <MessageSquareCode size={18} />
          <span>Feed</span>
        </button>

        <button 
          className={`btn ${currentView === 'about' ? 'btn-teal' : 'btn-text'}`}
          onClick={() => setView('about')}
        >
          <Info size={18} />
          <span>Sobre el movimiento</span>
        </button>

        {user ? (
          <>
            <button 
              className="btn btn-protest"
              onClick={() => setView('create-post')}
            >
              <PlusCircle size={18} />
              <span>DENUNCIAR</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>@{user.username}</span>
              <button className="btn btn-text" onClick={onLogout} title="Cerrar Sesión">
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <button 
            className="btn btn-protest"
            onClick={() => setView('auth')}
          >
            <ShieldAlert size={18} />
            <span>UNIRSE AL FORO</span>
          </button>
        )}
      </nav>
    </header>
  );
}
