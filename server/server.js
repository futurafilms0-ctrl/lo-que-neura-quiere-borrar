import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query, run, get } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'neura-protest-secret-2026';
const isProduction = process.env.NODE_ENV === 'production';

// CORS: in production restrict to the public domain set via CORS_ORIGIN env var;
// in development allow everything.
const corsOptions = isProduction && process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN, optionsSuccessStatus: 200 }
  : {};
app.use(cors(corsOptions));
app.use(express.json());

// Serve React build in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  console.log('Serving React build from', clientBuildPath);
}

// Create uploads directory if not exists.
// In production (Railway), persist uploads in the /data volume.
const uploadsDir = isProduction
  ? '/data/uploads'
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Authenticate Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no provisto.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
    req.user = user;
    next();
  });
};

// Optional user middleware to extract user if token exists (for public feed showing personal "Me indigna")
const getOptionalUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña requeridos.' });
  }

  try {
    const existingUser = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    
    const user = { id: result.id, username };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor al registrar.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña requeridos.' });
  }

  try {
    const userRow = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!userRow) {
      return res.status(400).json({ error: 'Nombre de usuario o contraseña incorrectos.' });
    }

    const validPassword = await bcrypt.compare(password, userRow.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Nombre de usuario o contraseña incorrectos.' });
    }

    const user = { id: userRow.id, username: userRow.username };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
});

// Get current user details
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userRow = await get('SELECT id, username, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(userRow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener datos del usuario.' });
  }
});

// --- POST ROUTES ---

// Get all posts (ordered by date desc)
app.get('/api/posts', getOptionalUser, async (req, res) => {
  const userId = req.user ? req.user.id : null;

  try {
    const posts = await query(`
      SELECT 
        p.*, 
        u.username as author_username,
        (SELECT COUNT(*) FROM indignaciones i WHERE i.post_id = p.id) as indignados_count,
        (SELECT COUNT(*) FROM indignaciones i WHERE i.post_id = p.id AND i.user_id = ?) as user_indignado,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las publicaciones.' });
  }
});

// Create a post (authenticated, optional image)
app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  const { title, content, category } = req.body;
  const file = req.file;

  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Título, contenido y categoría son obligatorios.' });
  }

  const validCategories = ["Testimonio", "Denuncia", "Investigación", "Falso anuncio Neura"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Categoría no válida.' });
  }

  let imageUrl = null;
  if (file) {
    // Save relative URL path
    imageUrl = `/uploads/${file.filename}`;
  }

  try {
    const result = await run(
      'INSERT INTO posts (user_id, title, content, image_url, category) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, content, imageUrl, category]
    );

    const newPost = await get(`
      SELECT 
        p.*, 
        u.username as author_username,
        0 as indignados_count,
        0 as user_indignado,
        0 as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.id]);

    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la publicación.' });
  }
});

// Indignar/Desindignar a post
app.post('/api/posts/:id/indignar', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    const post = await get('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada.' });
    }

    const existingIndignacion = await get(
      'SELECT * FROM indignaciones WHERE user_id = ? AND post_id = ? AND comment_id IS NULL',
      [userId, postId]
    );

    if (existingIndignacion) {
      // Remove
      await run('DELETE FROM indignaciones WHERE id = ?', [existingIndignacion.id]);
      res.json({ indignado: false });
    } else {
      // Add
      await run('INSERT INTO indignaciones (user_id, post_id, comment_id) VALUES (?, ?, NULL)', [userId, postId]);
      res.json({ indignado: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la indignación.' });
  }
});

// --- COMMENTS ROUTES ---

// Get all comments for a post (structured tree)
app.get('/api/posts/:id/comments', getOptionalUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user ? req.user.id : null;

  try {
    const dbComments = await query(`
      SELECT 
        c.*, 
        u.username as author_username,
        (SELECT COUNT(*) FROM indignaciones i WHERE i.comment_id = c.id) as indignados_count,
        (SELECT COUNT(*) FROM indignaciones i WHERE i.comment_id = c.id AND i.user_id = ?) as user_indignado
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [userId, postId]);

    // Group comments into level 0 (parents) and level 1 (replies)
    const parents = dbComments.filter(c => c.parent_id === null);
    const replies = dbComments.filter(c => c.parent_id !== null);

    parents.forEach(p => {
      p.replies = replies.filter(r => r.parent_id === p.id);
    });

    res.json(parents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los comentarios.' });
  }
});

// Create comment or reply
app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content, parent_id } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'El contenido del comentario es requerido.' });
  }

  try {
    // If replying, verify parent comment exists and does not already have a parent (to limit to max 1 level of response)
    if (parent_id) {
      const parentComment = await get('SELECT * FROM comments WHERE id = ?', [parent_id]);
      if (!parentComment) {
        return res.status(404).json({ error: 'El comentario al que intentas responder no existe.' });
      }
      if (parentComment.parent_id !== null) {
        return res.status(400).json({ error: 'No se permiten respuestas en cascada de más de un nivel.' });
      }
    }

    const result = await run(
      'INSERT INTO comments (post_id, parent_id, user_id, content) VALUES (?, ?, ?, ?)',
      [postId, parent_id || null, userId, content]
    );

    const newComment = await get(`
      SELECT 
        c.*, 
        u.username as author_username,
        0 as indignados_count,
        0 as user_indignado
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.id]);

    if (!parent_id) {
      newComment.replies = [];
    }

    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar el comentario.' });
  }
});

// Indignar/Desindignar a comentario
app.post('/api/comments/:id/indignar', authenticateToken, async (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  try {
    const comment = await get('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }

    const existingIndignacion = await get(
      'SELECT * FROM indignaciones WHERE user_id = ? AND comment_id = ? AND post_id IS NULL',
      [userId, commentId]
    );

    if (existingIndignacion) {
      // Remove
      await run('DELETE FROM indignaciones WHERE id = ?', [existingIndignacion.id]);
      res.json({ indignado: false });
    } else {
      // Add
      await run('INSERT INTO indignaciones (user_id, post_id, comment_id) VALUES (?, NULL, ?)', [userId, commentId]);
      res.json({ indignado: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la indignación.' });
  }
});

// --- ABOUT PAGE ROUTES ---

// Get about page content
app.get('/api/pages/sobre_movimiento', async (req, res) => {
  try {
    const page = await get("SELECT title, content, updated_at FROM pages WHERE key = 'sobre_movimiento'");
    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada.' });
    }
    res.json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la información de la página.' });
  }
});

// Update about page content (authenticated, any registered user can edit for now)
app.put('/api/pages/sobre_movimiento', authenticateToken, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios.' });
  }

  try {
    await run(
      "UPDATE pages SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'sobre_movimiento'",
      [title, content]
    );
    const updatedPage = await get("SELECT title, content, updated_at FROM pages WHERE key = 'sobre_movimiento'");
    res.json(updatedPage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la página.' });
  }
});

// SPA fallback — serve index.html for any non-API route so React Router works
if (fs.existsSync(clientBuildPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
