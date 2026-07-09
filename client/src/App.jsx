import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Feed from './components/Feed';
import Auth from './components/Auth';
import CreatePost from './components/CreatePost';
import About from './components/About';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [view, setView] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Load auth state from localStorage on init
  useEffect(() => {
    const storedToken = localStorage.getItem('neura_token');
    const storedUser = localStorage.getItem('neura_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('neura_token', newToken);
    localStorage.setItem('neura_user', JSON.stringify(newUser));
    addToast(`Sesión iniciada. ¡Bienvenido al foro, @${newUser.username}!`, 'success');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('neura_token');
    localStorage.removeItem('neura_user');
    setView('feed');
    addToast('Sesión cerrada con éxito.', 'success');
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const renderActiveView = () => {
    switch (view) {
      case 'feed':
        return (
          <Feed 
            user={user} 
            token={token} 
            setView={setView} 
            addToast={addToast}
            posts={posts}
            setPosts={setPosts}
          />
        );
      case 'auth':
        return (
          <Auth 
            onLoginSuccess={handleLoginSuccess} 
            setView={setView} 
          />
        );
      case 'create-post':
        return (
          <CreatePost 
            token={token} 
            setView={setView} 
            onPostCreated={handlePostCreated}
            addToast={addToast}
          />
        );
      case 'about':
        return (
          <About 
            user={user}
            token={token}
            addToast={addToast}
          />
        );
      default:
        return (
          <Feed 
            user={user} 
            token={token} 
            setView={setView} 
            addToast={addToast}
            posts={posts}
            setPosts={setPosts}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Header 
        user={user} 
        currentView={view} 
        setView={setView} 
        onLogout={handleLogout} 
      />
      
      <main>
        {renderActiveView()}
      </main>

      {/* Toast Alerts Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
            {toast.type === 'error' ? (
              <AlertCircle size={18} style={{ color: 'var(--color-protest-red)' }} />
            ) : (
              <CheckCircle2 size={18} style={{ color: 'var(--color-pharma-teal)' }} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
