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
      '<path d="M16.02 3.2C8.95 3.2 3.2 8.86 3.2 15.82c0 2.23.6 4.42 1.75 6.33L3.1 28.8l6.86-1.78a12.98 12.98 0 0 0 6.06 1.51c7.07 0 12.82-5.66 12.82-12.62C28.84 8.86 23.09 3.2 16.02 3.2Zm0 22.98c-1.95 0-3.85-.52-5.52-1.5l-.4-.23-4.06 1.05 1.08-3.88-.26-.41a10.05 10.05 0 0 1-1.55-5.39c0-5.66 4.8-10.26 10.71-10.26 5.91 0 10.72 4.6 10.72 10.26 0 5.75-4.8 10.36-10.72 10.36Z" fill="currentColor"/>',
      '<path d="M22.42 18.83c-.35-.17-2.1-1.02-2.42-1.13-.32-.12-.55-.17-.78.17-.23.35-.9 1.12-1.1 1.35-.2.23-.41.26-.76.09-.35-.17-1.48-.54-2.82-1.72-1.04-.92-1.75-2.05-1.95-2.4-.2-.35-.02-.54.15-.71.16-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.17-.78-1.86-1.07-2.55-.28-.67-.57-.58-.78-.59h-.66c-.23 0-.6.09-.92.43-.32.35-1.22 1.18-1.22 2.87 0 1.7 1.25 3.34 1.42 3.57.17.23 2.46 3.7 5.96 5.19.83.35 1.48.56 1.99.72.84.26 1.6.22 2.2.14.67-.1 2.1-.85 2.39-1.67.29-.82.29-1.52.2-1.67-.08-.14-.31-.23-.67-.4Z" fill="currentColor"/>',
      "</svg>"
    ].join("");
  }

  function injectWhatsAppWidget() {
    if (pageId() === "contacto" || document.getElementById("whatsapp-widget")) return;

    var url = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(whatsappMessage);
    var node = document.createElement("div");
    node.className = "whatsapp-widget";
    node.id = "whatsapp-widget";
    node.innerHTML = [
      '<a class="sm-whatsapp-float" href="' + url + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">',
      whatsappIcon(),
      '<span>WhatsApp</span>',
      "</a>"
    ].join("");
    document.body.appendChild(node);
  }

  function initWhatsAppWidget() {
    var widget = document.getElementById("whatsapp-widget");
    if (!widget) return;

    function updateVisibility() {
      widget.classList.add("is-visible");
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
  }

  function injectFooter() {
    var slot = document.getElementById("site-footer-slot");
    if (!slot) return;

    slot.innerHTML = [
      '<footer class="sm-site-footer">',
      '<div class="sm-footer-shell">',
      '<div class="sm-footer-main">',
      '<section class="sm-footer-col">',
      '<h3>Vis&iacute;tanos en:</h3>',
      '<a class="sm-footer-item" href="https://www.google.com/maps/search/?api=1&query=Av.%20Oscar%20R.%20Benavides%20282%2C%20Cercado%20de%20Lima%2C%20Per%C3%BA" target="_blank" rel="noopener">',
      '<span class="sm-footer-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 0 0 5 9c0 5.9 7 12 7 12Zm0-8.2A3.8 3.8 0 1 1 12 5.2a3.8 3.8 0 0 1 0 7.6Z"/></svg></span>',
      '<span>Av. Oscar R. Benavides 282,<br>Cercado de Lima, Per&uacute;.</span>',
      '</a>',
      '</section>',
      '<section class="sm-footer-col">',
      '<h3>Tel&eacute;fono:</h3>',
      '<a class="sm-footer-item" href="tel:+51998265837"><span class="sm-footer-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.5 3 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1v3.6c0 .6-.4 1-1 1C10.8 21.7 3 13.9 3 4.5c0-.6.4-1 1-1h3.6c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.7.1.4 0 .8-.3 1.1l-2.3 1.5Z"/></svg></span><span>+51 998 265 837</span></a>',
      '<a class="sm-footer-item" href="https://wa.me/51955345973" target="_blank" rel="noopener"><span class="sm-footer-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.1 3.1A8.8 8.8 0 0 0 4.6 16.5L3.5 20.7l4.3-1.1a8.8 8.8 0 1 0 4.3-16.5Zm0 15.9c-1.4 0-2.8-.4-4-1.2l-.3-.2-2.5.7.7-2.4-.2-.4a7 7 0 1 1 6.3 3.5Zm4-5.2c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.1-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5 0-.1-.5-1.2-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.9 2.2 1 2.3c.1.2 1.7 2.7 4.3 3.7.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.3-.5 1.5-1 .2-.5.2-1 .1-1.1 0-.1-.2-.2-.5-.3Z"/></svg></span><span>+51 955 345 973</span></a>',
      '</section>',
      '<section class="sm-footer-col">',
      '<h3>E-mail</h3>',
      '<a class="sm-footer-item" href="mailto:ochoa@smindustrial.com.pe"><span class="sm-footer-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1Zm8 7.6L5.3 7H5v10h14V7h-.3L12 12.6Zm0-2.5L15.9 7H8.1l3.9 3.1Z"/></svg></span><span>ochoa@smindustrial.com.pe</span></a>',
      '</section>',
      '<section class="sm-footer-col">',
      '<h3>S&iacute;guenos</h3>',
      '<span class="sm-footer-item"><span class="sm-footer-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.3l.7-3h-3V9c0-.6.4-1 1-1Z"/></svg></span><span>Facebook</span></span>',
      '<span class="sm-footer-item"><span class="sm-footer-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10c2.8 0 5 2.2 5 5v10c0 2.8-2.2 5-5 5H7c-2.8 0-5-2.2-5-5V7c0-2.8 2.2-5 5-5Zm0 2c-1.7 0-3 1.3-3 3v10c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3V7c0-1.7-1.3-3-3-3H7Zm5 3.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm0 2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM17.4 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg></span><span>Instagram</span></span>',
      '</section>',
      '</div>',
      '<div class="sm-footer-bottom">Copyright &copy; 2026 Industriales El&eacute;ctricos S&amp;M E.I.R.L.</div>',
      '</div>',
      '</footer>'
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
