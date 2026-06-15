(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("header");
  let lastScroll = window.scrollY;
  let ticking = false;

  function updateHeader() {
    if (!header) return;
    const current = window.scrollY;
    const movingDown = current > lastScroll;
    header.classList.toggle("sm-header-condensed", current > 24);
    header.classList.toggle("sm-header-hidden", movingDown && current > 180);
    lastScroll = Math.max(current, 0);
    ticking = false;
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
})();
