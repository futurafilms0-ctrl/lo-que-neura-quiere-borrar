import React, { useState } from 'react';
import { Shield, ShieldAlert, KeyRound, User } from 'lucide-react';
import API_BASE from '../config.js';

export default function Auth({ onLoginSuccess, setView }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal.');
      }

      onLoginSuccess(data.token, data.user);
      setView('feed');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">
        {isLogin ? 'Ingresar al Foro' : 'Registrarse en el Movimiento'}
      </h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="username">
            <User size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Nombre de Usuario
          </label>
          <input
            id="username"
            type="text"
            className="form-input"
            placeholder="ej: memoria_activa"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            <KeyRound size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-teal" 
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          disabled={loading}
        >
          {isLogin ? <Shield size={18} /> : <ShieldAlert size={18} />}
          <span>{loading ? 'Procesando...' : isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}</span>
        </button>
      </form>

      <div className="auth-switch">
        {isLogin ? (
          <p>
            ¿No tienes una cuenta? <span onClick={() => { setIsLogin(false); setError(''); }}>Registrate aquí</span>
          </p>
        ) : (
          <p>
            ¿Ya eres miembro? <span onClick={() => { setIsLogin(true); setError(''); }}>Ingresa aquí</span>
          </p>
        )}
      </div>
    </div>
  );
}
