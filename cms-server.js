const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const SESSION_COOKIE = "sm_admin_session";
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MINUTES || 240) * 60 * 1000;
const MAX_JSON_BYTES = Number(process.env.MAX_JSON_MB || 8) * 1024 * 1024;
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 32) * 1024 * 1024;
const MAX_LOGIN_BYTES = 8 * 1024;
const MAX_FAILED_LOGINS = Number(process.env.MAX_FAILED_LOGINS || 5);
const LOGIN_LOCK_MS = Number(process.env.LOGIN_LOCK_MINUTES || 15) * 60 * 1000;
const PBKDF2_ITERATIONS = 310000;

const CONTENT_FILE = path.join(ROOT, "assets", "data", "site-content.json");
const PUBLIC_CONTENT_FILE = path.join(ROOT, "assets", "data", "public-content.json");
const BACKUP_DIR = path.join(ROOT, ".cms-backups");
const UPLOAD_DIR = path.join(ROOT, "assets", "uploads");

const sessions = new Map();
const rateBuckets = new Map();
const loginFailures = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon"
};

function ensureDirs() {
  [
    path.dirname(CONTENT_FILE),
    BACKUP_DIR,
    path.join(UPLOAD_DIR, "images"),
    path.join(UPLOAD_DIR, "videos"),
    path.join(UPLOAD_DIR, "docs")
  ].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashPassword(password, salt = crypto.randomBytes(24).toString("hex"), iterations = PBKDF2_ITERATIONS) {
  const hash = crypto.pbkdf2Sync(String(password), salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPasswordHash(password, encoded) {
  const parts = String(encoded || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expected = Buffer.from(parts[3], "hex");
  if (!iterations || !salt || expected.length !== 32) return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, iterations, expected.length, "sha256");
  return crypto.timingSafeEqual(actual, expected);
}

function verifyAdminPassword(password) {
  if (ADMIN_PASSWORD_HASH) return verifyPasswordHash(password, ADMIN_PASSWORD_HASH);
  if (ADMIN_PASSWORD) return safeEqual(password, ADMIN_PASSWORD);
  return false;
}

function assertAdminSecrets() {
  if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD) {
    throw new Error("Define ADMIN_PASSWORD_HASH o ADMIN_PASSWORD antes de iniciar el portal administrativo.");
  }
  if (IS_PRODUCTION && !ADMIN_PASSWORD_HASH) {
    throw new Error("Produccion bloqueada: usa ADMIN_PASSWORD_HASH y no una clave plana.");
  }
  if (IS_PRODUCTION && ADMIN_PASSWORD) {
    throw new Error("Produccion bloqueada: elimina ADMIN_PASSWORD y deja solo ADMIN_PASSWORD_HASH.");
  }
  if (IS_PRODUCTION && ADMIN_USER.toLowerCase() === "admin") {
    throw new Error("Produccion bloqueada: define ADMIN_USER con un usuario no obvio.");
  }
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function text(res, status, message) {
  const body = String(message || "");
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf("=");
        if (index === -1) return [item, ""];
        return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      })
  );
}

function safeEqual(a, b) {
  const left = crypto.createHash("sha256").update(String(a)).digest();
  const right = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

function getClientIp(req) {
  if (TRUST_PROXY && req.headers["x-forwarded-for"]) {
    return String(req.headers["x-forwarded-for"]).split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function isSecureRequest(req) {
  return Boolean(req.socket.encrypted) || (TRUST_PROXY && req.headers["x-forwarded-proto"] === "https");
}

function cookieFlags(req, maxAge) {
  const secure = IS_PRODUCTION || isSecureRequest(req);
  return [
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${Math.floor(maxAge / 1000)}`,
    secure ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

function makeSession(req, res) {
  const token = crypto.randomBytes(32).toString("hex");
  const csrf = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { user: ADMIN_USER, csrf, expires: Date.now() + SESSION_TTL_MS, ip: getClientIp(req) });
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieFlags(req, SESSION_TTL_MS)}`);
  return sessions.get(token);
}

function clearSession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  session.expires = Date.now() + SESSION_TTL_MS;
  return session;
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    json(res, 401, { ok: false, error: "No autenticado" });
    return null;
  }
  return session;
}

function requireCsrf(req, res, session) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return true;
  const token = req.headers["x-csrf-token"];
  if (!token || !safeEqual(token, session.csrf)) {
    json(res, 403, { ok: false, error: "Proteccion CSRF activa. Recarga el panel e intenta nuevamente." });
    return false;
  }
  return true;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function applySecurityHeaders(req, res, pathname) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'");
  if (IS_PRODUCTION || isSecureRequest(req)) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
}

function checkRateLimit(req, res, name, limit, windowMs) {
  const now = Date.now();
  const key = `${name}:${getClientIp(req)}`;
  const bucket = rateBuckets.get(key) || { count: 0, reset: now + windowMs };
  if (bucket.reset <= now) {
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > limit) {
    res.setHeader("Retry-After", Math.ceil((bucket.reset - now) / 1000));
    json(res, 429, { ok: false, error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." });
    return false;
  }
  return true;
}

function pruneMemoryStores() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expires < now) sessions.delete(token);
  }
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.reset < now) rateBuckets.delete(key);
  }
  for (const [key, value] of loginFailures.entries()) {
    if ((value.lockedUntil || 0) < now && value.fails <= 0) loginFailures.delete(key);
  }
}

function loginKey(req, username) {
  return `${getClientIp(req)}:${String(username || "").toLowerCase().slice(0, 80)}`;
}

function isLoginLocked(req, username) {
  const entry = loginFailures.get(loginKey(req, username));
  return entry && entry.lockedUntil && entry.lockedUntil > Date.now();
}

function recordLoginFailure(req, username) {
  const key = loginKey(req, username);
  const entry = loginFailures.get(key) || { fails: 0, lockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= MAX_FAILED_LOGINS) {
    entry.lockedUntil = Date.now() + LOGIN_LOCK_MS;
  }
  loginFailures.set(key, entry);
}

function clearLoginFailures(req, username) {
  loginFailures.delete(loginKey(req, username));
}

function readBody(req, limit = MAX_JSON_BYTES) {
  return new Promise((resolve, reject) => {
    const contentLength = Number(req.headers["content-length"] || 0);
    if (contentLength > limit) {
      reject(httpError(413, "La solicitud excede el limite permitido."));
      req.resume();
      return;
    }
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(httpError(413, "La solicitud excede el limite permitido."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function readJson(req, limit) {
  const raw = await readBody(req, limit);
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function backupContent() {
  if (!fs.existsSync(CONTENT_FILE)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(CONTENT_FILE, path.join(BACKUP_DIR, `site-content-${stamp}.json`));
}

function atomicWrite(file, value) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, value, "utf8");
  fs.renameSync(tmp, file);
}

function sanitizeFileName(name) {
  const ext = path.extname(name || "").toLowerCase();
  const base = path
    .basename(name || "archivo", ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "archivo"}-${Date.now()}${ext}`;
}

function uploadFolder(kind, mime) {
  if (kind === "video" || /^video\//.test(mime)) return "videos";
  if (kind === "pdf" || mime === "application/pdf") return "docs";
  return "images";
}

function hasValidMagic(buffer, ext, mime) {
  if (ext === ".pdf") return buffer.subarray(0, 5).toString("utf8") === "%PDF-";
  if (ext === ".png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === ".jpg" || ext === ".jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === ".gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (ext === ".webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (ext === ".mp4") return buffer.includes(Buffer.from("ftyp"), 0, Math.min(buffer.length, 32));
  if (ext === ".webm") return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  return /^image\//.test(mime) || /^video\//.test(mime);
}

function isAllowedUpload(kind, mime, ext, buffer) {
  const imageExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const videoExt = [".mp4", ".webm"];
  const docExt = [".pdf"];
  if (kind === "video") return /^video\//.test(mime) && videoExt.includes(ext) && hasValidMagic(buffer, ext, mime);
  if (kind === "pdf") return mime === "application/pdf" && docExt.includes(ext) && hasValidMagic(buffer, ext, mime);
  return /^image\//.test(mime) && imageExt.includes(ext) && hasValidMagic(buffer, ext, mime);
}

function sanitizeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/<\s*(script|iframe|object|embed|link|meta|style)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|link|meta|style)[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s+(href|src)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, "");
}

function sanitizeContent(content) {
  const copy = JSON.parse(JSON.stringify(content));
  for (const section of copy.sections || []) {
    for (const field of section.fields || []) {
      if (field.property === "html" || field.type === "html") field.value = sanitizeHtml(field.value);
    }
    for (const collection of section.collections || []) {
      for (const item of collection.items || []) {
        for (const key of Object.keys(item)) {
          if (/html/i.test(key)) item[key] = sanitizeHtml(item[key]);
        }
      }
    }
  }
  return copy;
}

function publicContentFrom(content) {
  return {
    version: content.version || 1,
    updatedAt: content.updatedAt || new Date().toISOString(),
    sections: (content.sections || [])
      .map((section) => ({
        id: section.id,
        fields: (section.fields || []).map((field) => ({
          id: field.id,
          pages: field.pages,
          selector: field.selector,
          property: field.property,
          value: field.value,
          fit: field.fit,
          position: field.position,
          enabled: field.enabled
        })),
        collections: (section.collections || []).map((collection) => ({
          id: collection.id,
          pages: collection.pages,
          renderer: collection.renderer,
          enabled: collection.enabled,
          items: collection.items || []
        }))
      }))
      .filter((section) => section.fields.length || section.collections.length)
  };
}

function writePublicContent(content) {
  atomicWrite(PUBLIC_CONTENT_FILE, JSON.stringify(publicContentFrom(content), null, 2));
}

function loadContentObject() {
  if (!fs.existsSync(CONTENT_FILE)) return { version: 1, updatedAt: new Date().toISOString(), sections: [] };
  return JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
}

function isSensitivePath(pathname) {
  const normalized = pathname.replace(/\\/g, "/").toLowerCase();
  const parts = normalized.split("/").filter(Boolean);
  if (parts.some((part) => part.startsWith("."))) return true;
  if (parts.includes("node_modules")) return true;
  if (["/cms-server.js", "/admin-cms.md", "/package.json", "/package-lock.json"].includes(normalized)) return true;
  if (normalized === "/assets/data/site-content.json") return true;
  if (normalized.startsWith("/assets/data/") && normalized !== "/assets/data/public-content.json") return true;
  return false;
}

function staticHeaders(pathname, ext) {
  const headers = { "Content-Type": mimeTypes[ext] || "application/octet-stream" };
  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    headers["Cache-Control"] = "no-store";
  } else if (pathname === "/assets/data/public-content.json") {
    headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300";
  } else if ([".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".mp4", ".webm", ".pdf", ".ico"].includes(ext)) {
    headers["Cache-Control"] = "public, max-age=604800, immutable";
  } else {
    headers["Cache-Control"] = "no-cache";
  }
  return headers;
}

function serveStatic(req, res, url) {
  if (!["GET", "HEAD"].includes(req.method)) {
    text(res, 405, "Metodo no permitido");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    text(res, 400, "Ruta invalida");
    return;
  }

  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/admin") {
    res.writeHead(302, { Location: "/admin/" });
    res.end();
    return;
  }
  if (pathname === "/admin/") pathname = "/admin/index.html";

  if (isSensitivePath(pathname)) {
    text(res, 404, "Archivo no encontrado");
    return;
  }

  const target = path.normalize(path.join(ROOT, pathname));
  if (!target.startsWith(ROOT)) {
    text(res, 403, "Ruta no permitida");
    return;
  }

  fs.stat(target, (error, stat) => {
    if (error || !stat.isFile()) {
      text(res, 404, "Archivo no encontrado");
      return;
    }
    const ext = path.extname(target).toLowerCase();
    const headers = staticHeaders(pathname, ext);
    headers["Content-Length"] = stat.size;
    res.writeHead(200, headers);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(target).pipe(res);
  });
}

async function handleLogin(req, res) {
  if (!checkRateLimit(req, res, "login", 12, 10 * 60 * 1000)) return;
  const body = await readJson(req, MAX_LOGIN_BYTES);
  const username = String(body.username || "");

  if (isLoginLocked(req, username)) {
    await delay(700);
    json(res, 429, { ok: false, error: "Demasiados intentos. Espera unos minutos e intenta nuevamente." });
    return;
  }

  const validUser = safeEqual(username, ADMIN_USER);
  const validPassword = verifyAdminPassword(body.password || "");
  if (!validUser || !validPassword) {
    recordLoginFailure(req, username);
    await delay(700);
    json(res, 401, { ok: false, error: "Usuario o contrasena incorrectos" });
    return;
  }

  clearLoginFailures(req, username);
  const session = makeSession(req, res);
  json(res, 200, { ok: true, user: ADMIN_USER, csrfToken: session.csrf });
}

async function handleApi(req, res, url) {
  try {
    if (!sameOrigin(req) && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      json(res, 403, { ok: false, error: "Origen no permitido" });
      return;
    }

    if (url.pathname === "/api/session" && req.method === "GET") {
      const session = getSession(req);
      json(res, 200, { ok: true, authenticated: Boolean(session), user: session ? session.user : null, csrfToken: session ? session.csrf : null });
      return;
    }

    if (url.pathname === "/api/login" && req.method === "POST") {
      await handleLogin(req, res);
      return;
    }

    if (url.pathname === "/api/logout" && req.method === "POST") {
      const session = requireAuth(req, res);
      if (!session || !requireCsrf(req, res, session)) return;
      clearSession(req, res);
      json(res, 200, { ok: true });
      return;
    }

    if (url.pathname === "/api/content" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const data = fs.existsSync(CONTENT_FILE) ? fs.readFileSync(CONTENT_FILE, "utf8") : "{}";
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(data);
      return;
    }

    if (url.pathname === "/api/content" && req.method === "PUT") {
      const session = requireAuth(req, res);
      if (!session || !requireCsrf(req, res, session)) return;
      const body = await readJson(req, MAX_JSON_BYTES);
      if (!body || !Array.isArray(body.sections)) {
        json(res, 400, { ok: false, error: "Formato de contenido invalido" });
        return;
      }
      const safeBody = sanitizeContent(body);
      safeBody.updatedAt = new Date().toISOString();
      backupContent();
      atomicWrite(CONTENT_FILE, JSON.stringify(safeBody, null, 2));
      writePublicContent(safeBody);
      json(res, 200, { ok: true, updatedAt: safeBody.updatedAt });
      return;
    }

    if (url.pathname === "/api/upload" && req.method === "POST") {
      const session = requireAuth(req, res);
      if (!session || !requireCsrf(req, res, session)) return;
      if (!checkRateLimit(req, res, "upload", 30, 10 * 60 * 1000)) return;
      const body = await readJson(req, Math.ceil(MAX_UPLOAD_BYTES * 1.4) + 4096);
      const match = String(body.dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        json(res, 400, { ok: false, error: "Archivo invalido" });
        return;
      }
      const mime = match[1].toLowerCase();
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > MAX_UPLOAD_BYTES) {
        json(res, 413, { ok: false, error: "Archivo demasiado grande" });
        return;
      }
      const safeName = sanitizeFileName(body.name || "archivo");
      const ext = path.extname(safeName).toLowerCase();
      const kind = body.kind || "image";
      if (!isAllowedUpload(kind, mime, ext, buffer)) {
        json(res, 400, { ok: false, error: "Tipo de archivo no permitido" });
        return;
      }
      const folder = uploadFolder(kind, mime);
      const absolute = path.join(UPLOAD_DIR, folder, safeName);
      fs.writeFileSync(absolute, buffer, { flag: "wx" });
      json(res, 200, {
        ok: true,
        path: `assets/uploads/${folder}/${safeName}`,
        name: safeName,
        bytes: buffer.length
      });
      return;
    }

    json(res, 404, { ok: false, error: "API no encontrada" });
  } catch (error) {
    const status = error.status || (error instanceof SyntaxError ? 400 : 500);
    json(res, status, { ok: false, error: status >= 500 ? "Error interno" : error.message });
  }
}

function bootstrapPublicContent() {
  const content = sanitizeContent(loadContentObject());
  writePublicContent(content);
}

if (process.argv.includes("--hash-password")) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("Define ADMIN_PASSWORD para generar el hash.");
    process.exit(1);
  }
  console.log(hashPassword(password));
  process.exit(0);
}

assertAdminSecrets();
ensureDirs();
bootstrapPublicContent();
setInterval(pruneMemoryStores, 60 * 1000).unref();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  applySecurityHeaders(req, res, url.pathname);

  if (!checkRateLimit(req, res, "global", 900, 60 * 1000)) return;
  if (url.pathname.startsWith("/api/") && !checkRateLimit(req, res, "api", 240, 60 * 1000)) return;
  if (url.pathname.startsWith("/admin") && !checkRateLimit(req, res, "admin", 240, 60 * 1000)) return;
  if (url.pathname === "/assets/data/public-content.json" && !checkRateLimit(req, res, "public-content", 180, 60 * 1000)) return;

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
    return;
  }
  serveStatic(req, res, url);
});

server.headersTimeout = 10000;
server.requestTimeout = 30000;
server.keepAliveTimeout = 5000;
server.maxHeadersCount = 60;

server.listen(PORT, () => {
  console.log(`SM CMS listo en http://127.0.0.1:${PORT}/admin/`);
  console.log(`Usuario: ${ADMIN_USER}`);
  console.log("Credenciales cargadas desde variables de entorno.");
});
