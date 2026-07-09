// Detects if running in dev (Vite) or production (Express serving the build)
// In dev: calls http://localhost:3001/api/...
// In production: calls /api/... (same server)
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
export default API_BASE;
