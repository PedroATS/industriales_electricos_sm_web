const state = {
  content: null,
  activeSection: null,
  dirty: false,
  csrfToken: null,
  uploadNotes: new Map()
};

const pageLinks = {
  all: "../index.html",
  global: "../index.html",
  inicio: "../index.html",
  nosotros: "../nosotros.html",
  "por-que-elegirnos": "../por-que-elegirnos.html",
  servicios: "../servicios.html",
  marcas: "../marcas.html",
  preguntas: "../preguntas.html",
  contacto: "../contacto.html",
  productos: "../productos.html",
  tableros: "../tableros.html",
  proceso: "../proceso.html",
  cotizacion: "../cotizacion.html"
};

const bannerSections = [
  { id: "inicio", label: "Inicio", hint: "Portada, slider, servicios y trabajos." },
  { id: "nosotros", label: "Nosotros", hint: "Historia, quiénes somos, misión, visión e imágenes." },
  { id: "por-que-elegirnos", label: "Por qué elegirnos", hint: "Argumentos comerciales, fotos y botón de asesoría." },
  { id: "servicios", label: "Servicios y soluciones", hint: "Títulos, textos e imágenes de soluciones." },
  { id: "marcas", label: "Marcas", hint: "Banner, textos y logos de marcas." },
  { id: "preguntas", label: "Preguntas frecuentes", hint: "Preguntas y respuestas principales." },
  { id: "contacto", label: "Contacto", hint: "Canales, formulario, sedes y brochure." }
];

const $ = (selector) => document.querySelector(selector);

const mediaRules = {
  imageMaxInputBytes: 18 * 1024 * 1024,
  imageMaxEdge: 1800,
  imageTargetBytes: 720 * 1024,
  imageQualitySteps: [0.82, 0.74, 0.66],
  videoMaxBytes: 18 * 1024 * 1024,
  pdfMaxBytes: 16 * 1024 * 1024
};

let webpSupportPromise = null;

function api(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRF-Token"] = state.csrfToken;
  }
  return fetch(path, {
    credentials: "same-origin",
    ...options,
    headers
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || "Solicitud fallida");
    return data;
  });
}

function mediaUrl(value) {
  if (!value) return "";
  if (/^(https?:|data:|\/)/.test(value)) return value;
  return "../" + value.replace(/^\.?\//, "");
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtForMime(mime) {
  return {
    "image/webp": ".webp",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "application/pdf": ".pdf"
  }[String(mime || "").toLowerCase()] || "";
}

function replaceExtension(name, ext) {
  const safeExt = ext && ext.startsWith(".") ? ext : "";
  return String(name || "archivo").replace(/\.[a-z0-9]+$/i, "") + (safeExt || ".bin");
}

function acceptedTypes(type) {
  if (type === "video") return "video/mp4,video/webm";
  if (type === "pdf") return "application/pdf";
  return "image/png,image/jpeg,image/webp,image/gif";
}

function mediaHelpText(type, note) {
  if (note) return note;
  if (type === "video") return "El video se sube solo si esta optimizado para web. Se carga como metadata para que la pagina no se vuelva lenta.";
  if (type === "pdf") return "El PDF se valida antes de subirlo para mantener el portal ligero y seguro.";
  return "Las imagenes se redimensionan y comprimen automaticamente sin deformarlas antes de publicarlas.";
}

function createMediaNote(type, note) {
  const help = document.createElement("p");
  help.className = "media-smart-note";
  help.textContent = mediaHelpText(type, note);
  return help;
}

function setFileButtonText(label, text) {
  const node = label.querySelector(".file-button-text");
  if (node) node.textContent = text;
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("La imagen no se pudo procesar."));
    image.src = dataUrl;
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("No se pudo optimizar la imagen."));
        return;
      }
      resolve(blob);
    }, mime, quality);
  });
}

function supportsWebp() {
  if (!webpSupportPromise) {
    webpSupportPromise = new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      resolve(canvas.toDataURL("image/webp").startsWith("data:image/webp"));
    });
  }
  return webpSupportPromise;
}

async function optimizeImageFile(file) {
  if (file.size > mediaRules.imageMaxInputBytes) {
    throw new Error(`La imagen pesa ${formatBytes(file.size)}. Sube una imagen menor a ${formatBytes(mediaRules.imageMaxInputBytes)}.`);
  }
  if (file.type === "image/gif") {
    if (file.size > mediaRules.imageTargetBytes) {
      throw new Error("Los GIF pesados hacen lenta la web. Usa un MP4/WebM corto o una imagen JPG/PNG.");
    }
    return {
      dataUrl: await readFileAsDataUrl(file),
      name: replaceExtension(file.name, ".gif"),
      originalBytes: file.size,
      outputBytes: file.size,
      summary: `GIF validado: ${formatBytes(file.size)}.`
    };
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(source);
  const maxSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const scale = Math.min(1, mediaRules.imageMaxEdge / Math.max(1, maxSide));
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  context.drawImage(image, 0, 0, width, height);

  const mime = (await supportsWebp()) ? "image/webp" : "image/jpeg";
  let best = null;
  for (const quality of mediaRules.imageQualitySteps) {
    const blob = await canvasToBlob(canvas, mime, quality);
    best = !best || blob.size < best.blob.size ? { blob, quality } : best;
    if (blob.size <= mediaRules.imageTargetBytes) break;
  }

  const dataUrl = await readFileAsDataUrl(best.blob);
  return {
    dataUrl,
    name: replaceExtension(file.name, fileExtForMime(best.blob.type || mime)),
    originalBytes: file.size,
    outputBytes: best.blob.size,
    width,
    height,
    summary: `Imagen optimizada: ${formatBytes(file.size)} -> ${formatBytes(best.blob.size)} (${width}x${height}).`
  };
}

async function prepareUploadFile(file, kind) {
  if (kind === "image") return optimizeImageFile(file);
  if (kind === "video") {
    if (file.size > mediaRules.videoMaxBytes) {
      throw new Error(`El video pesa ${formatBytes(file.size)}. Para una web rapida, sube MP4/WebM menor a ${formatBytes(mediaRules.videoMaxBytes)}.`);
    }
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      throw new Error("Formato de video no permitido. Usa MP4 o WebM.");
    }
    return {
      dataUrl: await readFileAsDataUrl(file),
      name: replaceExtension(file.name, fileExtForMime(file.type)),
      originalBytes: file.size,
      outputBytes: file.size,
      summary: `Video validado para web: ${formatBytes(file.size)}.`
    };
  }
  if (kind === "pdf") {
    if (file.size > mediaRules.pdfMaxBytes) {
      throw new Error(`El PDF pesa ${formatBytes(file.size)}. Usa un brochure menor a ${formatBytes(mediaRules.pdfMaxBytes)}.`);
    }
    return {
      dataUrl: await readFileAsDataUrl(file),
      name: replaceExtension(file.name, ".pdf"),
      originalBytes: file.size,
      outputBytes: file.size,
      summary: `PDF validado: ${formatBytes(file.size)}.`
    };
  }
  throw new Error("Tipo de archivo no permitido.");
}

async function uploadPreparedFile(file, kind) {
  const prepared = await prepareUploadFile(file, kind);
  const result = await api("/api/upload", {
    method: "POST",
    body: JSON.stringify({ name: prepared.name, kind, dataUrl: prepared.dataUrl })
  });
  return { ...result, prepared };
}

function setDirty(value = true) {
  state.dirty = value;
  $("#save-status").textContent = value ? "Cambios pendientes por guardar" : "Sin cambios pendientes";
}

function sectionById(id) {
  return (state.content.sections || []).find((section) => section.id === id);
}

function friendlyType(field) {
  const type = {
    text: "Texto",
    textarea: "Texto largo",
    html: "Texto con estilo",
    email: "Correo",
    url: "Enlace",
    image: "Imagen",
    video: "Video",
    pdf: "PDF"
  }[field.type] || "Campo";

  const property = {
    text: "contenido",
    html: "contenido",
    src: "archivo",
    href: "enlace",
    poster: "poster",
    alt: "descripción",
    title: "título",
    placeholder: "ayuda",
    backgroundImage: "fondo"
  }[field.property] || field.property;

  return `${type} / ${property}`;
}

function fieldKind(field) {
  if (field.type === "video") return "video";
  if (field.type === "pdf") return "pdf";
  return "image";
}

function makeInput(field) {
  let control;
  if (field.type === "textarea" || field.type === "html") {
    control = document.createElement("textarea");
    control.value = field.value || "";
  } else {
    control = document.createElement("input");
    control.value = field.value || "";
    control.type = field.type === "email" ? "email" : field.type === "url" ? "url" : "text";
  }
  control.addEventListener("input", () => {
    field.value = control.value;
    setDirty(true);
    renderPreview(control.closest(".field-card"), field);
  });
  return control;
}

function makeUploadButton(field, input) {
  const label = document.createElement("label");
  label.className = "ghost file-button";
  const labelText = document.createElement("span");
  labelText.className = "file-button-text";
  labelText.textContent = field.type === "video" ? "Subir video" : field.type === "pdf" ? "Subir PDF" : "Subir imagen";

  const file = document.createElement("input");
  file.type = "file";
  file.accept = acceptedTypes(field.type);

  file.addEventListener("change", async () => {
    const selected = file.files && file.files[0];
    if (!selected) return;
    const defaultText = labelText.textContent;
    label.classList.add("is-loading");
    label.setAttribute("aria-busy", "true");
    setFileButtonText(label, field.type === "image" ? "Optimizando..." : "Validando...");
    try {
      const result = await uploadPreparedFile(selected, fieldKind(field));
      field.value = result.path;
      input.value = result.path;
      state.uploadNotes.set(`field:${field.id}`, result.prepared.summary);
      setDirty(true);
      renderEditor();
    } catch (error) {
      alert(error.message);
    } finally {
      label.classList.remove("is-loading");
      label.removeAttribute("aria-busy");
      setFileButtonText(label, defaultText);
      file.value = "";
    }
  });

  label.appendChild(labelText);
  label.appendChild(file);
  return label;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

function renderPreview(card, field) {
  const existing = card.querySelector(".media-preview");
  if (existing) existing.remove();
  if (!["image", "video"].includes(field.type) || !field.value) return;

  const preview = document.createElement("div");
  preview.className = "media-preview";
  if (field.type === "video") {
    const video = document.createElement("video");
    video.src = mediaUrl(field.value);
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.style.objectFit = field.fit || "cover";
    video.style.objectPosition = field.position || "center";
    preview.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = mediaUrl(field.value);
    img.alt = "";
    img.style.objectFit = field.fit || "cover";
    img.style.objectPosition = field.position || "center";
    preview.appendChild(img);
  }
  card.querySelector(".field-control").appendChild(preview);
}

function renderFitTools(field) {
  if (!["image", "video"].includes(field.type)) return null;
  const row = document.createElement("div");
  row.className = "fit-row";
  const fit = document.createElement("select");
  fit.innerHTML = '<option value="cover">Llenar sin deformar</option><option value="contain">Mostrar completa</option>';
  fit.value = field.fit || "cover";
  fit.addEventListener("change", () => {
    field.fit = fit.value;
    setDirty(true);
    renderEditor();
  });
  const position = document.createElement("select");
  position.innerHTML = [
    '<option value="center">Centro</option>',
    '<option value="top">Arriba</option>',
    '<option value="bottom">Abajo</option>',
    '<option value="left">Izquierda</option>',
    '<option value="right">Derecha</option>'
  ].join("");
  position.value = field.position || "center";
  position.addEventListener("change", () => {
    field.position = position.value;
    setDirty(true);
    renderEditor();
  });
  row.append(fit, position);
  return row;
}

function collectionTitle(item, collection) {
  return item.title || item.question || item.name || item.label || collection.itemLabel || "Elemento";
}

function makeCollectionInput(collection, item, schema) {
  let control;
  const value = item[schema.key] ?? schema.default ?? "";
  if (schema.type === "textarea" || schema.type === "html") {
    control = document.createElement("textarea");
    control.value = value;
  } else if (schema.type === "checkbox") {
    control = document.createElement("input");
    control.type = "checkbox";
    control.checked = Boolean(value);
  } else if (schema.type === "select") {
    control = document.createElement("select");
    (schema.options || []).forEach((option) => {
      const choice = document.createElement("option");
      choice.value = option.value;
      choice.textContent = option.label;
      control.appendChild(choice);
    });
    control.value = value;
  } else {
    control = document.createElement("input");
    control.value = value;
    control.type = schema.type === "email" ? "email" : schema.type === "url" ? "url" : "text";
  }

  control.addEventListener(schema.type === "checkbox" ? "change" : "input", () => {
    item[schema.key] = schema.type === "checkbox" ? control.checked : control.value;
    setDirty(true);
    if (["image", "video"].includes(schema.type)) {
      renderCollectionPreview(control.closest(".collection-item"), item, schema);
    }
  });

  return control;
}

function makeCollectionUploadButton(collection, item, schema, input) {
  const label = document.createElement("label");
  label.className = "ghost file-button";
  const labelText = document.createElement("span");
  labelText.className = "file-button-text";
  labelText.textContent = schema.type === "video" ? "Subir video" : schema.type === "pdf" ? "Subir PDF" : "Subir imagen";

  const file = document.createElement("input");
  file.type = "file";
  file.accept = acceptedTypes(schema.type);

  file.addEventListener("change", async () => {
    const selected = file.files && file.files[0];
    if (!selected) return;
    const defaultText = labelText.textContent;
    label.classList.add("is-loading");
    label.setAttribute("aria-busy", "true");
    setFileButtonText(label, schema.type === "image" ? "Optimizando..." : "Validando...");
    try {
      const kind = schema.type === "pdf" ? "pdf" : schema.type === "video" ? "video" : "image";
      const result = await uploadPreparedFile(selected, kind);
      item[schema.key] = result.path;
      input.value = result.path;
      state.uploadNotes.set(`collection:${collection.id}:${item.id}:${schema.key}`, result.prepared.summary);
      setDirty(true);
      renderEditor();
    } catch (error) {
      alert(error.message);
    } finally {
      label.classList.remove("is-loading");
      label.removeAttribute("aria-busy");
      setFileButtonText(label, defaultText);
      file.value = "";
    }
  });

  label.appendChild(labelText);
  label.appendChild(file);
  return label;
}

function renderCollectionPreview(card, item, schema) {
  const old = card.querySelector(`[data-preview-for="${schema.key}"]`);
  if (old) old.remove();
  if (!["image", "video"].includes(schema.type) || !item[schema.key]) return;

  const preview = document.createElement("div");
  preview.className = "media-preview collection-preview";
  preview.dataset.previewFor = schema.key;
  if (schema.type === "video") {
    const video = document.createElement("video");
    video.src = mediaUrl(item[schema.key]);
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.style.objectFit = item.fit || "cover";
    video.style.objectPosition = item.position || "center";
    preview.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = mediaUrl(item[schema.key]);
    img.alt = "";
    img.style.objectFit = item.fit || "cover";
    img.style.objectPosition = item.position || "center";
    preview.appendChild(img);
  }
  card.querySelector(".collection-item-body").appendChild(preview);
}

function createCollectionItem(collection) {
  const item = { id: "item-" + Date.now(), enabled: true };
  (collection.itemFields || []).forEach((schema) => {
    item[schema.key] = schema.default ?? (schema.type === "checkbox" ? false : "");
  });
  if (!item.title && collection.itemLabel) item.title = "Nuevo " + collection.itemLabel.toLowerCase();
  if (!item.question && collection.id && collection.id.includes("preguntas")) item.question = "Nueva pregunta";
  if (!item.name && collection.id && collection.id.includes("marcas")) item.name = "Nueva marca";
  return item;
}

function renderCollection(collection, section) {
  const card = document.createElement("article");
  card.className = "collection-card";
  card.innerHTML = [
    '<div class="collection-head">',
    '<div><span class="field-type">Bloque administrable</span><h3></h3><p></p></div>',
    '<button class="primary collection-add" type="button"></button>',
    "</div>",
    '<div class="collection-list"></div>'
  ].join("");

  card.querySelector("h3").textContent = collection.label || collection.id;
  card.querySelector("p").textContent = collection.help || "Puedes editar, ordenar, ocultar o eliminar elementos manteniendo el diseño premium.";
  const add = card.querySelector(".collection-add");
  add.textContent = collection.addLabel || "Agregar";
  add.addEventListener("click", () => {
    collection.items = collection.items || [];
    collection.items.push(createCollectionItem(collection));
    setDirty(true);
    renderEditor();
  });

  const list = card.querySelector(".collection-list");
  (collection.items || []).forEach((item, index) => {
    const itemCard = document.createElement("section");
    itemCard.className = "collection-item" + (item.enabled === false ? " is-disabled" : "");
    itemCard.innerHTML = [
      '<div class="collection-item-top">',
      '<div><span></span><strong></strong></div>',
      '<div class="collection-actions"></div>',
      "</div>",
      '<div class="collection-item-body"></div>'
    ].join("");
    itemCard.querySelector(".collection-item-top span").textContent = String(index + 1).padStart(2, "0");
    itemCard.querySelector(".collection-item-top strong").textContent = collectionTitle(item, collection);

    const actions = itemCard.querySelector(".collection-actions");
    const moveUp = document.createElement("button");
    moveUp.type = "button";
    moveUp.className = "ghost";
    moveUp.textContent = "Subir";
    moveUp.disabled = index === 0;
    moveUp.addEventListener("click", () => {
      collection.items.splice(index - 1, 0, collection.items.splice(index, 1)[0]);
      setDirty(true);
      renderEditor();
    });

    const moveDown = document.createElement("button");
    moveDown.type = "button";
    moveDown.className = "ghost";
    moveDown.textContent = "Bajar";
    moveDown.disabled = index === collection.items.length - 1;
    moveDown.addEventListener("click", () => {
      collection.items.splice(index + 1, 0, collection.items.splice(index, 1)[0]);
      setDirty(true);
      renderEditor();
    });

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ghost";
    toggle.textContent = item.enabled === false ? "Mostrar" : "Ocultar";
    toggle.addEventListener("click", () => {
      item.enabled = item.enabled === false;
      setDirty(true);
      renderEditor();
    });

    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.className = "ghost";
    duplicate.textContent = "Duplicar";
    duplicate.addEventListener("click", () => {
      const copy = JSON.parse(JSON.stringify(item));
      copy.id = "item-" + Date.now();
      if (copy.title) copy.title += " copia";
      if (copy.question) copy.question += " copia";
      if (copy.name) copy.name += " copia";
      collection.items.splice(index + 1, 0, copy);
      setDirty(true);
      renderEditor();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost danger";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", () => {
      if (!confirm("¿Eliminar este elemento de la web?")) return;
      collection.items.splice(index, 1);
      setDirty(true);
      renderEditor();
    });

    actions.append(moveUp, moveDown, toggle, duplicate, remove);

    const body = itemCard.querySelector(".collection-item-body");
    (collection.itemFields || []).forEach((schema) => {
      const label = document.createElement("label");
      const span = document.createElement("span");
      span.textContent = schema.label || schema.key;
      label.appendChild(span);
      const input = makeCollectionInput(collection, item, schema);
      label.appendChild(input);
      body.appendChild(label);
      if (["image", "video", "pdf"].includes(schema.type)) {
        const tools = document.createElement("div");
        tools.className = "field-tools";
        tools.appendChild(makeCollectionUploadButton(collection, item, schema, input));
        tools.appendChild(createMediaNote(schema.type, state.uploadNotes.get(`collection:${collection.id}:${item.id}:${schema.key}`)));
        body.appendChild(tools);
      }
      renderCollectionPreview(itemCard, item, schema);
    });

    list.appendChild(itemCard);
  });

  return card;
}

function renderCollections(section, grid) {
  (section.collections || []).forEach((collection) => {
    grid.appendChild(renderCollection(collection, section));
  });
}

function renderEditor() {
  const section = sectionById(state.activeSection);
  if (!section) return;

  $("#section-title").textContent = section.label;
  $("#section-description").textContent = section.description || "";
  $("#updated-at").textContent = state.content.updatedAt ? "Última actualización: " + new Date(state.content.updatedAt).toLocaleString() : "";
  const preview = $("#preview-link");
  if (preview) {
    preview.href = pageLinks[section.id] || "../index.html";
    preview.textContent = section.id === "global" || section.id === "avanzado" ? "Ver web" : "Ver " + section.label;
  }
  const advancedCard = $(".advanced-card");
  if (advancedCard) advancedCard.classList.toggle("is-hidden", section.id !== "avanzado");

  const grid = $("#editor-grid");
  grid.innerHTML = "";
  (section.fields || []).forEach((field) => {
    const template = $("#field-template").content.firstElementChild.cloneNode(true);
    template.querySelector("h3").textContent = field.label || field.id;
    template.querySelector(".field-type").textContent = friendlyType(field);
    template.querySelector(".field-help").textContent =
      section.id === "avanzado"
        ? `${field.selector} (${field.pages || "all"})`
        : field.help || "Edita este campo y presiona Guardar cambios. La web conserva el diseño responsive.";

    const control = makeInput(field);
    template.querySelector(".field-control").appendChild(control);
    renderPreview(template, field);

    const tools = template.querySelector(".field-tools");
    if (["image", "video", "pdf"].includes(field.type)) {
      tools.appendChild(makeUploadButton(field, control));
      tools.appendChild(createMediaNote(field.type, state.uploadNotes.get(`field:${field.id}`)));
    }
    const fitTools = renderFitTools(field);
    if (fitTools) tools.appendChild(fitTools);

    const remove = template.querySelector(".remove-field");
    if (section.id !== "avanzado") {
      remove.remove();
    } else {
      remove.addEventListener("click", () => {
        if (!confirm("¿Eliminar este campo avanzado?")) return;
        section.fields = section.fields.filter((item) => item !== field);
        setDirty(true);
        renderEditor();
      });
    }

    grid.appendChild(template);
  });
  renderCollections(section, grid);
}

function renderBannerTabs() {
  const nav = $("#banner-tabs");
  if (!nav) return;
  nav.innerHTML = "";
  bannerSections.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "banner-tab" + (item.id === state.activeSection ? " is-active" : "");
    button.innerHTML = `<span>${item.label}</span><small>${item.hint}</small>`;
    button.disabled = !sectionById(item.id);
    button.addEventListener("click", () => {
      state.activeSection = item.id;
      renderTabs();
      renderBannerTabs();
      renderEditor();
    });
    nav.appendChild(button);
  });
}

function renderTabs() {
  const tabs = $("#section-tabs");
  tabs.innerHTML = "";
  (state.content.sections || []).forEach((section) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-tab" + (section.id === state.activeSection ? " is-active" : "");
    button.innerHTML = `<span>${section.label}</span><small>${section.id === "global" ? "Datos generales" : section.id === "avanzado" ? "Uso técnico" : "Página del menú"}</small>`;
    button.addEventListener("click", () => {
      state.activeSection = section.id;
      renderTabs();
      renderBannerTabs();
      renderEditor();
    });
    tabs.appendChild(button);
  });
}

async function loadContent() {
  state.content = await api("/api/content");
  state.activeSection = sectionById("inicio") ? "inicio" : state.content.sections[0] ? state.content.sections[0].id : null;
  renderTabs();
  renderBannerTabs();
  renderEditor();
  setDirty(false);
}

async function saveContent() {
  const result = await api("/api/content", {
    method: "PUT",
    body: JSON.stringify(state.content)
  });
  state.content.updatedAt = result.updatedAt;
  renderEditor();
  setDirty(false);
}

function addAdvancedField(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.label || !data.selector || !data.property) {
    alert("Completa etiqueta, selector y propiedad.");
    return;
  }
  let section = sectionById("avanzado");
  if (!section) {
    section = { id: "avanzado", label: "Avanzado", description: "Campos personalizados.", fields: [] };
    state.content.sections.push(section);
  }
  section.fields.push({
    id: "custom." + Date.now(),
    label: data.label,
    type: data.type || "text",
    pages: data.pages || "all",
    selector: data.selector,
    property: data.property,
    value: "",
    fit: ["image", "video"].includes(data.type) ? "cover" : undefined,
    position: ["image", "video"].includes(data.type) ? "center" : undefined
  });
  state.activeSection = "avanzado";
  form.reset();
  setDirty(true);
  renderTabs();
  renderBannerTabs();
  renderEditor();
}

async function initSession() {
  const session = await api("/api/session");
  if (session.authenticated) {
    state.csrfToken = session.csrfToken || null;
    $("#login-view").classList.add("is-hidden");
    $("#dashboard").classList.remove("is-hidden");
    await loadContent();
  }
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#login-message").textContent = "";
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("#login-user").value.trim(),
        password: $("#login-password").value
      })
    }).then((session) => {
      state.csrfToken = session.csrfToken || null;
    });
    $("#login-view").classList.add("is-hidden");
    $("#dashboard").classList.remove("is-hidden");
    await loadContent();
  } catch (error) {
    $("#login-message").textContent = error.message;
  }
});

$("#logout-button").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" });
  location.reload();
});

$("#save-button").addEventListener("click", () => {
  saveContent().catch((error) => alert(error.message));
});

$("#advanced-form").addEventListener("submit", addAdvancedField);

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

initSession().catch(() => {});
