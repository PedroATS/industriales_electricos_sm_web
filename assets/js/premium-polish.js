(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("header");
  let lastScroll = window.scrollY;
  let ticking = false;

  function updateHeader() {
    if (!header) return;
    const current = window.scrollY;
    const movingDown = current > lastScroll;
    const menuOpen = header.classList.contains("sm-mobile-nav-open");
    header.classList.toggle("sm-header-condensed", current > 24);
    header.classList.toggle("sm-header-hidden", !menuOpen && movingDown && current > 180);
    lastScroll = Math.max(current, 0);
    ticking = false;
  }

  function initMobileNavigation() {
    const headers = document.querySelectorAll("header#top-nav, header#sm-main-header, header#main-nav");
    if (!headers.length) return;

    function setPageLock(locked) {
      document.documentElement.classList.toggle("sm-mobile-menu-active", locked);
      document.body.classList.toggle("sm-mobile-menu-active", locked);
    }

    function closeMenu(activeHeader, activeToggle) {
      activeHeader.classList.remove("sm-mobile-nav-open");
      const activePanel = document.getElementById(activeToggle.getAttribute("aria-controls"));
      if (activePanel) activePanel.classList.remove("is-open");
      activeToggle.setAttribute("aria-expanded", "false");
      activeToggle.setAttribute("aria-label", "Abrir menu principal");
      setPageLock(false);
    }

    headers.forEach(function (item, index) {
      const nav = item.querySelector(".sm-nav-scroll");
      const shell = item.firstElementChild;
      const brand = shell ? shell.querySelector("a") : null;
      if (!nav || !brand || item.querySelector(".sm-mobile-menu-toggle")) return;

      nav.classList.add("sm-desktop-nav-source");

      const panel = document.createElement("nav");
      panel.className = "sm-mobile-menu-panel";
      panel.id = "sm-mobile-menu-panel-" + (index + 1);
      panel.setAttribute("aria-label", "Menu principal movil");
      panel.innerHTML = nav.innerHTML;
      document.body.appendChild(panel);

      const toggle = document.createElement("button");
      toggle.className = "sm-mobile-menu-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-controls", panel.id);
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu principal");
      toggle.innerHTML = [
        '<span class="sm-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>',
        "<span>Menu</span>"
      ].join("");
      brand.insertAdjacentElement("afterend", toggle);

      toggle.addEventListener("click", function () {
        const open = !item.classList.contains("sm-mobile-nav-open");
        item.classList.toggle("sm-mobile-nav-open", open);
        panel.classList.toggle("is-open", open);
        item.classList.remove("sm-header-hidden");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Cerrar menu principal" : "Abrir menu principal");
        setPageLock(open);
      });

      panel.addEventListener("click", function (event) {
        if (event.target.closest("a")) closeMenu(item, toggle);
      });

      document.addEventListener("click", function (event) {
        if (!item.classList.contains("sm-mobile-nav-open")) return;
        if (item.contains(event.target)) return;
        if (panel.contains(event.target)) return;
        closeMenu(item, toggle);
      });

      window.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && item.classList.contains("sm-mobile-nav-open")) {
          closeMenu(item, toggle);
          toggle.focus();
        }
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 1099 && item.classList.contains("sm-mobile-nav-open")) {
          closeMenu(item, toggle);
        }
      });
    });
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true }
  );

  if (!prefersReducedMotion) {
    const targets = document.querySelectorAll(
      "main > section:not(:first-child), body > section:not(:first-of-type), .glass-panel, .glass-card, .industrial-card"
    );
    targets.forEach(function (element, index) {
      if (element.classList.contains("scroll-reveal")) return;
      element.classList.add("sm-reveal");
      element.style.transitionDelay = Math.min(index % 6, 4) * 45 + "ms";
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    document.querySelectorAll(".sm-reveal").forEach(function (element) {
      observer.observe(element);
    });
  }

  const serviceFilters = document.querySelectorAll("[data-service-filter]");
  const serviceCards = document.querySelectorAll("[data-service-category]");

  if (serviceFilters.length && serviceCards.length) {
    serviceFilters.forEach(function (button) {
      button.addEventListener("click", function () {
        const filter = button.dataset.serviceFilter;

        serviceFilters.forEach(function (item) {
          const active = item === button;
          item.classList.toggle("text-primary", active);
          item.classList.toggle("border-b", active);
          item.classList.toggle("border-primary", active);
          item.classList.toggle("font-bold", active);
          item.classList.toggle("text-on-surface-variant", !active);
        });

        serviceCards.forEach(function (card) {
          const visible = filter === "todos" || card.dataset.serviceCategory === filter;
          card.classList.toggle("hidden", !visible);
        });
      });
    });
  }

  function smWhatsAppIcon() {
    return [
      '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">',
      '<path d="M16.02 3.2C8.95 3.2 3.2 8.86 3.2 15.82c0 2.23.6 4.42 1.75 6.33L3.1 28.8l6.86-1.78a12.98 12.98 0 0 0 6.06 1.51c7.07 0 12.82-5.66 12.82-12.62C28.84 8.86 23.09 3.2 16.02 3.2Zm0 22.98c-1.95 0-3.85-.52-5.52-1.5l-.4-.23-4.06 1.05 1.08-3.88-.26-.41a10.05 10.05 0 0 1-1.55-5.39c0-5.66 4.8-10.26 10.71-10.26 5.91 0 10.72 4.6 10.72 10.26 0 5.75-4.8 10.36-10.72 10.36Z" fill="currentColor"/>',
      '<path d="M22.42 18.83c-.35-.17-2.1-1.02-2.42-1.13-.32-.12-.55-.17-.78.17-.23.35-.9 1.12-1.1 1.35-.2.23-.41.26-.76.09-.35-.17-1.48-.54-2.82-1.72-1.04-.92-1.75-2.05-1.95-2.4-.2-.35-.02-.54.15-.71.16-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.17-.78-1.86-1.07-2.55-.28-.67-.57-.58-.78-.59h-.66c-.23 0-.6.09-.92.43-.32.35-1.22 1.18-1.22 2.87 0 1.7 1.25 3.34 1.42 3.57.17.23 2.46 3.7 5.96 5.19.83.35 1.48.56 1.99.72.84.26 1.6.22 2.2.14.67-.1 2.1-.85 2.39-1.67.29-.82.29-1.52.2-1.67-.08-.14-.31-.23-.67-.4Z" fill="currentColor"/>',
      "</svg>"
    ].join("");
  }

  function injectFloatingWhatsApp() {
    if (document.body.dataset.page === "contacto" || document.getElementById("whatsapp-widget")) return;

    const message = "Hola, vengo de la pagina web de Industriales Electricos S&M. Deseo solicitar una cotizacion.";
    const url = "https://wa.me/51998265837?text=" + encodeURIComponent(message);
    const widget = document.createElement("div");
    widget.className = "whatsapp-widget is-visible";
    widget.id = "whatsapp-widget";
    widget.innerHTML = [
      '<a class="sm-whatsapp-float" href="' + url + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">',
      smWhatsAppIcon(),
      "<span>WhatsApp</span>",
      "</a>"
    ].join("");
    document.body.appendChild(widget);
  }

  function smFooterHtml() {
    return [
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

  function injectSmFooter() {
    if (document.querySelector(".sm-site-footer")) return;

    const existingFooter = document.querySelector("body > footer");
    if (existingFooter) {
      existingFooter.outerHTML = smFooterHtml();
      return;
    }

    document.body.insertAdjacentHTML("beforeend", smFooterHtml());
  }

  function initFooterVisibilityState() {
    const footer = document.querySelector(".sm-site-footer");
    const floatingSidebar = document.querySelector(".solutions-sidebar");
    if (!footer || !floatingSidebar || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          document.body.classList.toggle("sm-footer-in-view", entry.isIntersecting);
        });
      },
      { threshold: 0.04 }
    );

    observer.observe(footer);
  }

  initMobileNavigation();
  injectSmFooter();
  initFooterVisibilityState();
  injectFloatingWhatsApp();
})();
