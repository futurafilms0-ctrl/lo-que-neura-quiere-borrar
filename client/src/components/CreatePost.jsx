import React, { useState, useRef } from 'react';
import { Camera, Trash2, Send } from 'lucide-react';
import API_BASE from '../config.js';

export default function CreatePost({ token, setView, onPostCreated, addToast }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Testimonio');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) {
      addToast('Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear la publicación.');
      }

      addToast('Publicación creada con éxito.', 'success');
      if (onPostCreated) {
        onPostCreated(data);
      }
      setView('feed');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <h2 className="create-post-title">Publicar Denuncia / Testimonio</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="post-category">Categoría de la Publicación</label>
          <select 
            id="post-category" 
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          >
            <option value="Testimonio">Testimonio (Historias reales de víctimas)</option>
            <option value="Denuncia">Denuncia (Efectos secundarios de Neura)</option>
            <option value="Investigación">Investigación (Datos y verdades ocultas)</option>
            <option value="Falso anuncio Neura">Falso anuncio Neura (Propaganda corporativa)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="post-title">Título de la Denuncia</label>
          <input
            id="post-title"
            type="text"
            className="form-input"
            placeholder="Escribe un título impactante..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="post-content">Cuerpo de Texto</label>
          <textarea
            id="post-content"
            className="form-textarea"
            placeholder="Relata lo que Neura te ha quitado o lo que has descubierto..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          ></textarea>
        </div>

        <div className="form-group">
          <label className="form-label">Subir Imagen Asociada (Evidencia)</label>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={loading}
          />
          
          {imagePreview ? (
            <div className="preview-img-wrapper" onClick={() => fileInputRef.current.click()}>
              <img src={imagePreview} alt="Vista previa" className="preview-img" />
              <button 
                type="button" 
                className="btn-remove-preview" 
                onClick={removeImage} 
                title="Quitar imagen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="image-upload-preview" onClick={() => fileInputRef.current.click()}>
              <div className="image-upload-label">
                <Camera size={36} style={{ color: 'var(--color-pharma-teal)' }} />
                <span>Haz clic para seleccionar una imagen local</span>
                <small style={{ color: 'var(--color-pharma-muted)' }}>PNG, JPG, GIF hasta 5MB</small>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '25px' }}>
          <button 
            type="button" 
            className="btn btn-text"
            onClick={() => setView('feed')}
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button 
            type="submit" 
            className="btn btn-protest"
            disabled={loading}
            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
          >
            <Send size={16} />
            <span>{loading ? 'PUBLICANDO...' : 'DIFUNDIR VERDAD'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
