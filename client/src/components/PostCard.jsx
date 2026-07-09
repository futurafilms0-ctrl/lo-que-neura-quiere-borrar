import React, { useState, useEffect } from 'react';
import { Angry, MessageSquare, CornerDownRight, Send } from 'lucide-react';
import API_BASE from '../config.js';

export default function PostCard({ post, user, token, setView, addToast, onPostUpdated }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null); // ID of comment being replied to
  const [replyText, setReplyText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Dynamic tags mapping for visual diversity
  const categoryClasses = {
    'Testimonio': 'tag-1',
    'Denuncia': 'tag-2',
    'Investigación': 'tag-3',
    'Falso anuncio Neura': 'tag-4'
  };

  const getCategoryClass = (cat) => {
    return categoryClasses[cat] || 'tag-1';
  };

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, { headers });
      const data = await response.json();
      if (response.ok) {
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      addToast('No se pudieron cargar los comentarios.', 'error');
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, post.id, token]);

  // Handle post indignar
  const handlePostIndignar = async () => {
    if (!user) {
      addToast('Debes iniciar sesión para expresar tu indignación.', 'error');
      setView('auth');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/${post.id}/indignar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        const diff = data.indignado ? 1 : -1;
        onPostUpdated({
          ...post,
          user_indignado: data.indignado ? 1 : 0,
          indignados_count: post.indignados_count + diff
        });
      }
    } catch (err) {
      console.error(err);
      addToast('Error al procesar la indignación.', 'error');
    }
  };

  // Handle comment indignar
  const handleCommentIndignar = async (commentId, isReply, parentId = null) => {
    if (!user) {
      addToast('Debes iniciar sesión para indignarte.', 'error');
      setView('auth');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/comments/${commentId}/indignar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        const diff = data.indignado ? 1 : -1;
        
        if (isReply) {
          // Update reply within parent comment
          setComments(prev => prev.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: c.replies.map(r => r.id === commentId ? {
                  ...r,
                  user_indignado: data.indignado ? 1 : 0,
                  indignados_count: r.indignados_count + diff
                } : r)
              };
            }
            return c;
          }));
        } else {
          // Update top-level comment
          setComments(prev => prev.map(c => c.id === commentId ? {
            ...c,
            user_indignado: data.indignado ? 1 : 0,
            indignados_count: c.indignados_count + diff
          } : c));
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error al procesar la indignación.', 'error');
    }
  };

  // Handle adding new comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newCommentText })
      });
      const data = await response.json();

      if (response.ok) {
        setComments(prev => [data, ...prev]);
        setNewCommentText('');
        // Update post comment count globally
        onPostUpdated({
          ...post,
          comments_count: post.comments_count + 1
        });
        addToast('Comentario publicado.', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addToast(err.message || 'Error al agregar comentario.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle adding a reply to a comment
  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyText, parent_id: parentId })
      });
      const data = await response.json();

      if (response.ok) {
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...c.replies, data]
            };
          }
          return c;
        }));
        setReplyText('');
        setReplyToId(null);
        // Update post comment count globally
        onPostUpdated({
          ...post,
          comments_count: post.comments_count + 1
        });
        addToast('Respuesta publicada.', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addToast(err.message || 'Error al enviar respuesta.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if post category is pharma-ads to show extra stamp visual
  const isPharmaAd = post.category === "Falso anuncio Neura";

  return (
    <div className="post-card">
      {isPharmaAd && (
        <div className="stamp-censored">PROPAGANDA MENTIROSA</div>
      )}

      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div className="avatar-generic">
            {post.author_username ? post.author_username[0] : '?'}
          </div>
          <div className="post-meta">
            <span className="post-author">@{post.author_username}</span>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
        </div>
        
        <div className={`category-sticker ${getCategoryClass(post.category)}`}>
          {post.category}
        </div>
      </div>

      {/* Post Content */}
      <h3 className="post-title">{post.title}</h3>
      <p className="post-body">{post.content}</p>

      {post.image_url && (
        <div className="post-image-container">
          <img 
            src={`${API_BASE}${post.image_url}`} 
            alt="Evidencia" 
            className="post-image" 
          />
        </div>
      )}

      {/* Post Stats Summary */}
      <div className="post-actions-summary">
        <div className="action-summary-item">
          <Angry size={14} style={{ color: 'var(--color-protest-red)' }} />
          <span>{post.indignados_count} indignados</span>
        </div>
        <div className="action-summary-item">
          <span>{post.comments_count} comentarios</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-row">
        <button 
          className={`btn-indigna ${post.user_indignado ? 'active' : ''}`}
          onClick={handlePostIndignar}
        >
          <Angry size={16} />
          <span>{post.user_indignado ? '¡ESTOY INDIGNADO!' : 'Me indigna'}</span>
        </button>

        <button 
          className="btn-comment-toggle"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare size={16} />
          <span>{showComments ? 'Ocultar Comentarios' : 'Comentar / Ver'}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {/* Write comment */}
          {user ? (
            <form onSubmit={handleAddComment} className="comment-form">
              <div className="avatar-generic" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                {user.username[0]}
              </div>
              <input
                type="text"
                placeholder="Escribe un comentario..."
                className="comment-input"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={submittingComment}
              />
              <button 
                type="submit" 
                className="btn-comment-submit"
                disabled={submittingComment || !newCommentText.trim()}
              >
                <Send size={14} />
              </button>
            </form>
          ) : (
            <div className="comment-login-prompt">
              Debes <span onClick={() => setView('auth')}>iniciar sesión</span> para participar e indignarte en los comentarios.
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: '15px', fontSize: '0.9rem', color: 'var(--color-pharma-muted)' }}>
              Cargando testimonios de los comentarios...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '0.85rem', color: 'var(--color-pharma-muted)', fontStyle: 'italic' }}>
              No hay comentarios. Sé el primero en alzar la voz aquí.
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  {/* Top-level Comment */}
                  <div className="comment-bubble-container">
                    <div className="avatar-generic" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                      {comment.author_username ? comment.author_username[0] : '?'}
                    </div>
                    <div className="comment-bubble">
                      <div className="comment-author">@{comment.author_username}</div>
                      <div className="comment-content">{comment.content}</div>
                    </div>
                  </div>
                  
                  {/* Top-level Comment Actions */}
                  <div className="comment-actions">
                    <span className="post-date">{formatDate(comment.created_at)}</span>
                    
                    <span 
                      className={`comment-action-link ${comment.user_indignado ? 'indignado' : ''}`}
                      onClick={() => handleCommentIndignar(comment.id, false)}
                    >
                      Me indigna ({comment.indignados_count})
                    </span>

                    {user && (
                      <span 
                        className="comment-action-link"
                        onClick={() => {
                          setReplyToId(replyToId === comment.id ? null : comment.id);
                          setReplyText('');
                        }}
                      >
                        Responder
                      </span>
                    )}
                  </div>

                  {/* Comment Replies (Level 1 Nesting) */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-list">
                      {comment.replies.map((reply) => (
                        <div className="reply-item" key={reply.id}>
                          <div className="reply-bubble-container">
                            <div className="avatar-generic" style={{ width: '26px', height: '26px', fontSize: '0.75rem' }}>
                              {reply.author_username ? reply.author_username[0] : '?'}
                            </div>
                            <div className="reply-bubble">
                              <div className="comment-author" style={{ fontSize: '0.8rem' }}>
                                @{reply.author_username}
                              </div>
                              <div className="comment-content" style={{ fontSize: '0.85rem' }}>
                                {reply.content}
                              </div>
                            </div>
                          </div>

                          <div className="reply-actions">
                            <span className="post-date">{formatDate(reply.created_at)}</span>
                            <span 
                              className={`comment-action-link ${reply.user_indignado ? 'indignado' : ''}`}
                              onClick={() => handleCommentIndignar(reply.id, true, comment.id)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              Me indigna ({reply.indignados_count})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input Box */}
                  {user && replyToId === comment.id && (
                    <form onSubmit={(e) => handleAddReply(e, comment.id)} className="comment-form-reply">
                      <CornerDownRight size={16} style={{ color: 'var(--color-pharma-teal)', marginTop: '8px' }} />
                      <input
                        type="text"
                        placeholder={`Responder a @${comment.author_username}...`}
                        className="comment-input"
                        style={{ height: '34px', fontSize: '0.82rem' }}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={submittingComment}
                        autoFocus
                      />
                      <button 
                        type="submit" 
                        className="btn-comment-submit"
                        style={{ width: '32px', height: '32px' }}
                        disabled={submittingComment || !replyText.trim()}
                      >
                        <Send size={12} />
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
