# Lo Que Neura Quiere Borrar 🌐✊

Este proyecto universitario es una plataforma web (estilo foro/red social) de promoción y acompañamiento para un cortometraje.

## Concepto
**Neura** es una pastilla farmacéutica ficticia creada para borrar recuerdos dolorosos. Este sitio web simula ser la resistencia real de un movimiento de protesta social que denuncia los efectos secundarios dañinos de Neura (como demencias tempranas y la deshumanización de la memoria) y defiende fervientemente el derecho a recordar.

## Estética y Diseño
El sitio web está diseñado simulando un portal web corporativo farmacéutico de Neura que ha sido **vandalizado por activistas**:
*   **Diseño Base Oficial Pharma:** Estilo limpio corporativo usando la tipografía sans-serif Inter, colores teales (`#2CA6A4`) y gris hueso/claro (`#F4F5F0`).
*   **Intervención de Protesta:** Elementos tachados, stickers superpuestos inclinados, sellos virtuales de `"CENSURADO"` y `"PROPAGANDA MENTIROSA"` usando tipografía de máquina de escribir/marcador (`Special Elite` y `Permanent Marker`) en rojo vibrante (`#E63946`).

---

## Tecnologías Utilizadas (Stack)
*   **Frontend:** React (construido con Vite y configurado con Vanilla CSS puro).
*   **Backend:** Node.js + Express API.
*   **Base de Datos:** SQLite (mediante la librería `sqlite3`).
*   **Subida de archivos:** `multer` (para imágenes locales de posts).
*   **Autenticación:** Autenticación local simple (password hash mediante `bcryptjs` y sesiones con `jsonwebtoken`).

---

## Instrucciones para Ejecución Local

### Prerrequisitos
Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

### Paso 1: Instalar y ejecutar el Servidor (Backend + Frontend en uno)
```bash
cd server
npm install
npm run build   # Construye el frontend React en client/dist
npm start       # Inicia el servidor unificado en http://localhost:3001
```
El sitio completo quedará en **http://localhost:3001**.

---

## 🚀 Deploy en Railway (acceso público en internet)

Railway es el servicio de hosting recomendado. El proyecto incluye `railway.json` ya configurado.

### Paso 1 — Subir el código a GitHub

> Si ya tenés Git instalado, ejecutá estos comandos en la raíz del proyecto:

```bash
git init
git add .
git commit -m "feat: initial deploy setup"
```

Luego creá un repositorio en [github.com/new](https://github.com/new) (puede ser **privado**) y ejecutá:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

> 💡 Si no tenés Git instalado: descargá el instalador desde [git-scm.com](https://git-scm.com/) e instalalo. Después reiniciá la terminal y ejecutá los comandos de arriba.

---

### Paso 2 — Crear cuenta en Railway

1. Andá a [railway.com](https://railway.com) y creá una cuenta (podés entrar con tu cuenta de GitHub — recomendado).
2. En el dashboard hacé clic en **"New Project"**.
3. Elegí **"Deploy from GitHub repo"** y autorizá el acceso a tu repositorio.
4. Seleccioná el repositorio que acabás de crear.

Railway va a detectar el `railway.json` en la raíz automáticamente.

---

### Paso 3 — Agregar Volumen Persistente (para la base de datos e imágenes)

> Este paso es **crítico**: sin volumen, la base de datos y las imágenes se borran cada vez que Railway reinicia el servicio.

1. En tu servicio de Railway, andá a la pestaña **"Volumes"**.
2. Hacé clic en **"Add Volume"**.
3. Configurá:
   - **Mount Path:** `/data`
   - **Size:** 1 GB (más que suficiente)
4. Guardá. Railway automáticamente montará ese disco en `/data` cuando arranque el servidor.

La aplicación guardará la base de datos en `/data/database.sqlite` y las imágenes en `/data/uploads/`.

---

### Paso 4 — Configurar Variables de Entorno

En tu servicio de Railway, andá a la pestaña **"Variables"** y agregá:

| Variable | Valor | Descripción |
|---|---|---|
| `NODE_ENV` | `production` | Activa modo producción (SQLite en /data, CORS restringido) |
| `JWT_SECRET` | `una-frase-larga-y-secreta-aqui` | Secreto para firmar tokens JWT. **Cambiá este valor por uno propio.** |
| `CORS_ORIGIN` | *(completar después del deploy)* | URL pública de tu app (ver Paso 5) |

> ⚠️ **Importante:** `JWT_SECRET` debe ser una cadena larga y aleatoria. Nunca uses el valor por defecto en producción.

---

### Paso 5 — Obtener la URL pública y completar CORS_ORIGIN

1. Después del primer deploy exitoso, Railway te asigna automáticamente una URL pública con formato:
   ```
   https://tu-proyecto-production.up.railway.app
   ```
2. Copiá esa URL desde la pestaña **"Settings"** → **"Networking"** → **"Public Domain"**.
3. Volvé a la pestaña **"Variables"** y completá `CORS_ORIGIN` con esa URL **exacta** (sin barra final):
   ```
   CORS_ORIGIN=https://tu-proyecto-production.up.railway.app
   ```
4. Railway hará un redeploy automático con la variable actualizada.

¡Listo! Tu sitio estará accesible públicamente en esa URL.

---

### Variables de entorno resumen (copiar y pegar en Railway)

```
NODE_ENV=production
JWT_SECRET=CAMBIA-ESTO-POR-UN-SECRETO-LARGO-Y-ALEATORIO
CORS_ORIGIN=https://TU-URL.up.railway.app
```

---

## Carga Manual de Contenido (Base de datos vacía)
El proyecto se entrega sin registros ni imágenes de prueba en la base de datos:
1. Abrí el sitio en tu navegador (la URL pública de Railway o http://localhost:3001 en local).
2. Hacé clic en **"UNIRSE AL FORO"** en el encabezado.
3. Seleccioná **"Registrate aquí"** y creá tu primer usuario.
4. Una vez logueado, podrás:
   *   Hacer clic en **"DENUNCIAR"** para crear publicaciones con títulos, categorías, relatos e imágenes.
   *   Hacer clic en **"Me indigna"** en posts y comentarios.
   *   Agregar comentarios e interactuar con respuestas anidadas (máximo 1 nivel).
   *   Ir a la pestaña **"Sobre el movimiento"** y editar la misión/manifiesto directamente in-situ.
