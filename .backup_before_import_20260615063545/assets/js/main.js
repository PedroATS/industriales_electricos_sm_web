(function () {
  var pages = [
    { id: "inicio", label: "Inicio", href: "index.html", icon: "home" },
    { id: "nosotros", label: "Nosotros", href: "nosotros.html", icon: "building-2" },
    { id: "por-que", label: "Por qu&eacute; elegirnos", href: "por-que-elegirnos.html", icon: "badge-check" },
    { id: "servicios", label: "Servicios y soluciones", href: "servicios.html", icon: "settings-2" },
    { id: "marcas", label: "Marcas", href: "marcas.html", icon: "award" },
    { id: "preguntas", label: "Preguntas frecuentes", href: "preguntas.html", icon: "circle-help" },
    { id: "contacto", label: "Contacto", href: "contacto.html", icon: "phone-call" }
  ];
  var whatsappNumber = "51998265837";
  var whatsappMessage = "Hola, vengo de la pagina web de Industriales Electricos S&M. Deseo solicitar una cotizacion.";

  function pageId() {
    return document.body.getAttribute("data-page") || "inicio";
  }

  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function injectHeader() {
    var slot = document.getElementById("site-header-slot");
    if (!slot) return;

    var current = pageId();
    var nav = pages.map(function (page) {
      var active = page.id === current ? " is-active" : "";
      return '<a class="page-link' + active + '" data-nav="' + page.id + '" href="' + page.href + '"><i data-lucide="' + page.icon + '"></i><span>' + page.label + "</span></a>";
    }).join("");

    slot.innerHTML = [
      '<div class="scroll-progress" id="scroll-progress"></div>',
      '<header class="site-header">',
      '<a class="brand page-link" href="index.html" aria-label="Industriales Electricos S&M">',
      '<span class="brand-mark">S&amp;M</span>',
      '<span><strong>Industriales El&eacute;ctricos S&amp;M</strong><small>Componentes, tableros y asesor&iacute;a</small></span>',
      "</a>",
      '<nav class="site-nav" aria-label="Menu principal">' + nav + "</nav>",
      "</header>"
    ].join("");
  }

  function whatsappIcon() {
    return [
      '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">',
      '<path d="M16 3.4A12.4 12.4 0 0 0 5.4 22.2L4 28l5.9-1.5A12.4 12.4 0 1 0 16 3.4Z" fill="currentColor"/>',
      '<path d="M22.7 18.9c-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.2.4-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.5-.5-2.8-1.7-1-.9-1.7-2-1.9-2.4-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.7.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.4 3.6 1.6 3.9c.2.2 2.7 4.1 6.6 5.7.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.3-.3-.4-.7-.6Z" fill="#fff"/>',
      "</svg>"
    ].join("");
  }

  function injectWhatsAppWidget() {
    if (document.getElementById("whatsapp-widget")) return;

    var url = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(whatsappMessage);
    var node = document.createElement("div");
    node.className = "whatsapp-widget";
    node.id = "whatsapp-widget";
    node.innerHTML = [
      '<section class="whatsapp-panel" aria-hidden="true" aria-label="Chat de WhatsApp">',
      '<div class="whatsapp-panel-head">',
      '<span class="whatsapp-avatar">S&amp;M<i></i></span>',
      '<span><strong>Industriales El&eacute;ctricos S&amp;M</strong><small>Normalmente respondemos r&aacute;pido</small></span>',
      '<button class="whatsapp-close" type="button" aria-label="Cerrar chat"><i data-lucide="x"></i></button>',
      "</div>",
      '<div class="whatsapp-panel-body">',
      '<div class="whatsapp-message">',
      '<strong>Hola, somos S&amp;M</strong>',
      '<span>Cu&eacute;ntanos qu&eacute; componente o tablero necesitas y te ayudamos.</span>',
      '<time>Ahora</time>',
      "</div>",
      "</div>",
      '<div class="whatsapp-panel-action">',
      '<a href="' + url + '" target="_blank" rel="noopener">' + whatsappIcon() + "<span>Iniciar chat</span></a>",
      "</div>",
      "</section>",
      '<button class="whatsapp-toggle" type="button" aria-label="Abrir chat de WhatsApp" aria-expanded="false">' + whatsappIcon() + "</button>"
    ].join("");
    document.body.appendChild(node);
  }

  function initWhatsAppWidget() {
    var widget = document.getElementById("whatsapp-widget");
    if (!widget) return;

    var panel = widget.querySelector(".whatsapp-panel");
    var toggle = widget.querySelector(".whatsapp-toggle");
    var close = widget.querySelector(".whatsapp-close");

    function setOpen(open) {
      widget.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function updateVisibility() {
      widget.classList.add("is-visible");
    }

    toggle.addEventListener("click", function () {
      setOpen(!widget.classList.contains("is-open"));
      updateVisibility();
    });

    close.addEventListener("click", function () {
      setOpen(false);
      updateVisibility();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setOpen(false);
        updateVisibility();
      }
    });

    document.addEventListener("click", function (event) {
      if (!widget.contains(event.target)) {
        setOpen(false);
      }
    });

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
  }

  function injectFooter() {
    var slot = document.getElementById("site-footer-slot");
    if (!slot) return;

    slot.innerHTML = [
      '<footer class="site-footer">',
      '<div class="site-shell footer-grid">',
      "<div>",
      '<span class="brand-mark">S&amp;M</span>',
      "<strong>Industriales El&eacute;ctricos S&amp;M</strong>",
      "<p>Industriales El&eacute;ctricos S&amp;M E.I.R.L. RUC: 20552965028. Venta de componentes el&eacute;ctricos industriales, automatizaci&oacute;n y fabricaci&oacute;n de tableros a medida.</p>",
      "</div>",
      '<div class="footer-links">',
      "<strong>Contacto</strong>",
      '<a href="https://wa.me/51998265837" target="_blank" rel="noopener">WhatsApp: 998 265 837</a>',
      '<a href="https://wa.me/51955345973" target="_blank" rel="noopener">WhatsApp: 955 345 973</a>',
      '<a href="https://wa.me/51947342139" target="_blank" rel="noopener">WhatsApp: 947 342 139</a>',
      '<a href="mailto:ochoa@smindustrial.com.pe">ochoa@smindustrial.com.pe</a>',
      '<a href="https://smindustrial.com.pe" target="_blank" rel="noopener">smindustrial.com.pe</a>',
      "</div>",
      "<div>",
      "<strong>Ubicaci&oacute;n</strong>",
      "<p>Av. Oscar R. Benavides 282, Cercado de Lima.</p>",
      "<p>Lunes a s&aacute;bado de 9:00 a.m. a 6:30 p.m. Atenci&oacute;n para Lima, provincias y todo el Per&uacute;.</p>",
      "</div>",
      "</div>",
      "</footer>"
    ].join("");
  }

  function smoothPageLinks() {
    return;
  }

  function initHeroSlider() {
    var slides = Array.from(document.querySelectorAll(".hero-slide"));
    var dots = Array.from(document.querySelectorAll(".hero-dots span"));
    if (slides.length < 2) return;

    var active = 0;
    window.setInterval(function () {
      slides[active].classList.remove("is-active");
      if (dots[active]) dots[active].classList.remove("is-active");
      active = (active + 1) % slides.length;
      slides[active].classList.add("is-active");
      if (dots[active]) dots[active].classList.add("is-active");
    }, 4200);
  }

  function initScrollProgress() {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;

    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      bar.style.transform = "scaleX(" + Math.min(Math.max(progress, 0), 100) / 100 + ")";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initSmartHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var lastY = window.scrollY || 0;
    var ticking = false;

    function update() {
      var currentY = window.scrollY || 0;
      var goingDown = currentY > lastY;
      var pastHeroStart = currentY > 120;

      header.classList.toggle("is-hidden", goingDown && pastHeroStart);
      header.classList.toggle("is-compact", currentY > 24);
      lastY = currentY;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function revealOnScroll() {
    var items = Array.from(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    items.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index * 60, 240) + "ms";
      observer.observe(item);
    });
  }

  function initPointerLighting() {
    var cards = Array.from(document.querySelectorAll(".quick-card,.product-card,.tablero-card,.service-grid article,.contact-card,.step-card,.solution-card"));
    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) * 100;
        var y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mx", x.toFixed(2) + "%");
        card.style.setProperty("--my", y.toFixed(2) + "%");
      });
    });
  }

  function listFiles(input) {
    if (!input || !input.files || input.files.length === 0) {
      return "Sin archivos seleccionados";
    }

    return Array.from(input.files).map(function (file) {
      return file.name;
    }).join(", ");
  }

  function formValue(form, name) {
    var field = form.elements[name];
    return field ? String(field.value || "").trim() : "";
  }

  function quoteMessage(form) {
    var files = form.elements["Fotos o planos"];
    var count = files && files.files ? files.files.length : 0;
    return [
      "Hola Industriales Electricos S&M, solicito una cotizacion tecnica.",
      "",
      "Tipo de requerimiento: " + formValue(form, "Tipo de tablero"),
      "Tension: " + formValue(form, "Tension"),
      "Carga HP/kW: " + formValue(form, "Carga HP/kW"),
      "Cantidad de motores: " + formValue(form, "Cantidad de motores"),
      "Tipo de control: " + formValue(form, "Tipo de control"),
      "Fotos o planos: " + (count ? count + " archivo(s) para enviar" : "sin adjuntos"),
      "",
      "Nombre: " + formValue(form, "Nombre"),
      "Empresa: " + formValue(form, "Empresa"),
      "Telefono: " + formValue(form, "Telefono"),
      "Correo: " + formValue(form, "Correo")
    ].join("\n");
  }

  function initQuoteForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;

    var fileInput = form.elements["Fotos o planos"];
    var fileLabel = document.getElementById("file-label");

    if (fileInput && fileLabel) {
      fileInput.addEventListener("change", function () {
        fileLabel.textContent = listFiles(fileInput);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var message = encodeURIComponent(quoteMessage(form));
      window.open("https://wa.me/51998265837?text=" + message, "_blank", "noopener");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectHeader();
    injectFooter();
    injectWhatsAppWidget();
    initScrollProgress();
    initSmartHeader();
    smoothPageLinks();
    initHeroSlider();
    revealOnScroll();
    initPointerLighting();
    initQuoteForm();
    initWhatsAppWidget();
    initIcons();
    window.setTimeout(function () {
      document.body.classList.add("is-loaded");
    }, 30);
  });

  window.addEventListener("load", initIcons);
}());

