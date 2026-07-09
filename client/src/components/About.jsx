import React, { useState, useEffect } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import API_BASE from '../config.js';

export default function About({ user, token, addToast }) {
  const [page, setPage] = useState({ title: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPageContent = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/pages/sobre_movimiento`);
      const data = await response.json();
      if (response.ok) {
        setPage(data);
        setEditTitle(data.title);
        setEditContent(data.content);
      }
    } catch (err) {
      console.error("Error fetching about page content:", err);
    }
  };

  useEffect(() => {
    fetchPageContent();
  }, []);

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      addToast('El título y contenido no pueden estar vacíos.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/pages/sobre_movimiento`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, content: editContent })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar la información.');
      }

      setPage(data);
      setIsEditing(false);
      addToast('Información de la misión actualizada con éxito.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="about-container">
      {isEditing ? (
        <div className="about-editor">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-pharma-teal)', marginBottom: '10px' }}>
            Editar Misión del Movimiento
          </h2>
          
          <div className="form-group">
            <label className="form-label">Título Oficial de la Misión</label>
            <input 
              type="text" 
              className="form-input" 
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contenido de la Misión / Manifesto</label>
            <textarea 
              className="form-textarea" 
              style={{ minHeight: '300px' }}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-text" 
              onClick={() => { setIsEditing(false); setEditTitle(page.title); setEditContent(page.content); }}
              disabled={loading}
            >
              <X size={16} />
              <span>Cancelar</span>
            </button>
            <button 
              className="btn btn-teal" 
              onClick={handleSave}
              disabled={loading}
            >
              <Save size={16} />
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="about-header-vandalized">
            <h2 className="about-title-official">{page.title}</h2>
            <div className="about-title-protest">NUESTRO MANIFIESTO</div>
          </div>
          
          <p className="about-body">
            {page.content}
          </p>

          {user && (
            <div className="about-edit-btn">
              <button className="btn btn-protest" onClick={() => setIsEditing(true)}>
                <Edit3 size={16} />
                <span>EDITAR MISIÓN</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
