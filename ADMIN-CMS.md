# Portal administrativo S&M

## Iniciar en local

```powershell
$env:PORT="8010"
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="UNA_CLAVE_LOCAL_TEMPORAL"
node cms-server.js
```

Abrir:

```text
http://127.0.0.1:8010/admin/
```

## Publicar con seguridad

No publiques usando la clave local. Para produccion usa una clave larga, genera un hash y guarda solo ese hash:

```powershell
$env:ADMIN_PASSWORD="TU_CLAVE_LARGA_UNICA"
node cms-server.js --hash-password
```

Luego usa el resultado en el servidor:

```powershell
$env:NODE_ENV="production"
$env:PORT="8010"
$env:ADMIN_USER="usuario_no_obvio"
$env:ADMIN_PASSWORD_HASH="pbkdf2$..."
node cms-server.js
```

En produccion el servidor se bloquea si intentas usar `ADMIN_PASSWORD` plano o si dejas `ADMIN_USER=admin`.

Si usas proxy HTTPS como Nginx, Cloudflare Tunnel, Railway, Render o similar:

```powershell
$env:TRUST_PROXY="1"
```

## Protecciones incluidas

- Bloqueo de archivos sensibles: `.git`, `.env`, `.cms-backups`, `cms-server.js`, `ADMIN-CMS.md` y el JSON privado del CMS.
- Contenido publico separado en `assets/data/public-content.json`.
- Rate limit por IP para web, admin, API, login, uploads y contenido publico.
- Bloqueo temporal por intentos fallidos de login.
- Cookies `HttpOnly`, `SameSite=Strict` y `Secure` en produccion/HTTPS.
- Token CSRF para guardar contenido, subir archivos y cerrar sesion.
- Validacion de origen para peticiones de escritura.
- Cabeceras de seguridad: `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` en HTTPS.
- Sanitizado basico de HTML editable para reducir riesgo de scripts inyectados.
- Uploads restringidos por tipo, extension y firma de archivo. No se aceptan SVG subidos desde el admin.
- Backups automaticos antes de guardar cambios.

## Proteccion contra ataques masivos

El servidor ya limita consultas por IP, pero ataques de millones de solicitudes deben frenarse antes de llegar a Node. Antes de publicar, coloca la web detras de:

- Cloudflare con WAF, Bot Fight Mode/rate limiting y proteccion DDoS.
- O Nginx/Caddy con rate limit y limite de conexiones.
- HTTPS obligatorio.
- Firewall permitiendo solo puertos publicos necesarios.

## Que administra

- Textos y HTML simple.
- Links.
- Imagenes, videos y PDF.
- Colecciones completas: preguntas, servicios, marcas, trabajos, sedes y canales.
- Ajuste de medios con `cover` o `contain` para que no se deformen.
- Campos avanzados por selector CSS para casos tecnicos.

## Medios optimizados

- El panel comprime y redimensiona imagenes antes de subirlas, manteniendo proporcion y evitando deformacion.
- Las imagenes se guardan en formato web ligero cuando el navegador lo permite.
- Los videos se aceptan solo en MP4/WebM y con limite de peso para no volver lenta la web.
- Los videos publicados cargan con `preload="metadata"` salvo que el bloque ya sea un video de portada con autoplay.
- Si necesitas videos muy pesados, usa una version optimizada para web o un proveedor externo y pega el enlace desde el campo avanzado.

Limites por defecto:

- Imagen: entrada maxima `18 MB`, archivo guardado maximo `4 MB`.
- Video: `18 MB`.
- PDF: `16 MB`.

Puedes ajustar estos limites con `MAX_IMAGE_MB`, `MAX_VIDEO_MB`, `MAX_PDF_MB` y `MAX_UPLOAD_MB`.

## Archivos importantes

- `cms-server.js`: servidor con login, guardado, seguridad y subida de archivos.
- `admin/`: interfaz del portal.
- `assets/data/site-content.json`: contenido privado editable por el admin.
- `assets/data/public-content.json`: contenido publico generado automaticamente.
- `assets/js/cms-runtime.js`: aplica el contenido publico en la web.
- `assets/uploads/`: archivos subidos desde el admin.
