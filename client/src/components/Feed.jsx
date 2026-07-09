import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { AlertCircle, RefreshCw } from 'lucide-react';
import API_BASE from '../config.js';

export default function Feed({ user, token, setView, addToast, posts, setPosts }) {
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/api/posts`, { headers });
      const data = await response.json();
      
      if (response.ok) {
        setPosts(data);
      } else {
        throw new Error(data.error || 'No se pudieron cargar los posts.');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  return (
    <div className="feed-container">
      <div className="feed-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-pharma-teal)', textTransform: 'uppercase' }}>
            Muro de Denuncias
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-pharma-muted)' }}>
            Ordenado por fecha de publicación
          </span>
        </div>
        
        <button 
          className="btn btn-outline-teal" 
          onClick={fetchPosts} 
          disabled={loading}
          title="Recargar Muro"
          style={{ padding: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
        </button>
      </div>

      {loading && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-pharma-muted)' }}>
          Cargando testimonios del servidor...
        </div>
      ) : posts.length === 0 ? (
        <div className="feed-empty">
          <h3 className="feed-empty-title">El Muro está Silenciado</h3>
          <p style={{ color: 'var(--color-pharma-text)', marginBottom: '20px', fontSize: '0.95rem' }}>
            Actualmente no hay ninguna publicación. Neura quiere que olvidemos, pero nosotros resistimos.
          </p>
          {user ? (
            <button className="btn btn-protest" onClick={() => setView('create-post')}>
              ¡ALZAR MI VOZ AHORA!
            </button>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-pharma-muted)', marginBottom: '10px' }}>
                Regístrate o inicia sesión para crear la primera denuncia del movimiento.
              </p>
              <button className="btn btn-protest" onClick={() => setView('auth')}>
                UNIRSE E INICIAR FORO
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {posts.map(post => (
            <PostCard 
              key={post.id}
              post={post}
              user={user}
              token={token}
              setView={setView}
              addToast={addToast}
              onPostUpdated={handlePostUpdated}
            />
          ))}
        </div>
      )}
      
      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
