(function () {
  var CONTENT_URL = "assets/data/public-content.json";
  var appliedSignature = "";
  var retryCount = 0;
  var loadedContent = null;
  var loadingContent = false;

  function currentPage() {
    return document.body ? document.body.getAttribute("data-page") || "inicio" : "inicio";
  }

  function normalizePages(pages) {
    if (!pages || pages === "all") return ["all"];
    if (Array.isArray(pages)) return pages;
    return [pages];
  }

  function fieldApplies(field, page) {
    var pages = normalizePages(field.pages);
    return pages.indexOf("all") !== -1 || pages.indexOf(page) !== -1;
  }

  function setText(element, value) {
    element.textContent = value == null ? "" : String(value);
  }

  function setHtml(element, value) {
    element.innerHTML = sanitizeHtml(value);
  }

  function setMedia(element, field, property) {
    var value = field.value || "";
    if (!value) return;
    element.setAttribute(property, value);
    element.dataset.cmsManaged = "true";
    if (field.fit && (element.tagName === "IMG" || element.tagName === "VIDEO")) {
      element.style.objectFit = field.fit;
    }
    if (field.position && (element.tagName === "IMG" || element.tagName === "VIDEO")) {
      element.style.objectPosition = field.position;
    }
    if (element.tagName === "IMG") {
      if (!element.hasAttribute("loading")) element.setAttribute("loading", "lazy");
      element.setAttribute("decoding", "async");
    }
    if (element.tagName === "VIDEO" && property === "src" && typeof element.load === "function") {
      element.setAttribute("preload", "metadata");
      element.setAttribute("playsinline", "");
      element.load();
      if (element.hasAttribute("autoplay")) {
        element.play && element.play().catch(function () {});
      }
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

  function slugify(value, fallback) {
    var slug = String(value || fallback || "item")
      .toLowerCase()
      .normalize ? String(value || fallback || "item").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : String(value || fallback || "item").toLowerCase();
    return slug.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback || "item";
  }

  function activeItems(collection) {
    return (collection.items || []).filter(function (item) {
      return item && item.enabled !== false;
    });
  }

  function textParagraphs(value) {
    return String(value || "")
      .split(/\n{2,}/)
      .map(function (part) {
        return part.trim();
      })
      .filter(Boolean)
      .map(function (part) {
        return "<p>" + escapeHtml(part).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function splitTextParagraphs(value) {
    return String(value || "")
      .split(/\n{2,}/)
      .map(function (part) {
        return part.trim();
      })
      .filter(Boolean);
  }

  function paragraphsHtml(parts) {
    return parts
      .map(function (part) {
        return "<p>" + escapeHtml(part).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function serviceBodyHtml(body, note) {
    var parts = splitTextParagraphs(body);
    var first = parts.slice(0, 1);
    var rest = parts.slice(1);
    var noteHtml = note ? '<p class="service-media-note">' + escapeHtml(note) + "</p>" : "";
    var details = rest.length || note
      ? [
        '<details class="service-details">',
        "<summary>Ver detalles t&eacute;cnicos</summary>",
        paragraphsHtml(rest),
        noteHtml,
        "</details>"
      ].join("")
      : "";

    return [
      '<div class="service-body-full">',
      paragraphsHtml(parts),
      noteHtml,
      "</div>",
      '<div class="service-body-mobile">',
      paragraphsHtml(first.length ? first : rest),
      details,
      "</div>"
    ].join("");
  }

  function htmlBlock(value) {
    var html = sanitizeHtml(value).trim();
    if (!html) return "";
    return /<\/?(p|ul|ol|table|div|h[1-6]|blockquote)\b/i.test(html) ? html : textParagraphs(html);
  }

  function renderHomeServices(collection) {
    var grid = document.querySelector(".home-service-grid");
    if (!grid) return;
    grid.innerHTML = activeItems(collection)
      .map(function (item, index) {
        return [
          '<article class="home-service-card rounded-xl scroll-reveal" style="transition-delay: ' + index * 60 + 'ms;">',
          '<div class="service-media"><img alt="' + escapeHtml(item.alt || item.title || "") + '" class="w-full h-full object-cover" src="' + escapeHtml(item.image || "") + '" loading="lazy" decoding="async"/></div>',
          '<div class="p-6">',
          '<h3 class="font-headline-md text-[22px] leading-tight text-on-surface mb-5">' + escapeHtml(item.title || "") + "</h3>",
          '<p class="text-on-surface-variant text-[14px] leading-6">' + escapeHtml(item.text || "") + "</p>",
          "</div>",
          "</article>"
        ].join("");
      })
      .join("");
  }

  function renderHomeWorks(collection) {
    var grid = document.querySelector("#trabajos-inicio .work-grid");
    if (!grid) return;
    grid.innerHTML = activeItems(collection)
      .map(function (item, index) {
        return [
          '<a class="work-card rounded-xl scroll-reveal" href="' + escapeHtml(item.href || "contacto.html") + '" style="transition-delay: ' + index * 80 + 'ms;">',
          '<img alt="' + escapeHtml(item.alt || item.title || "") + '" src="' + escapeHtml(item.image || "") + '" loading="lazy" decoding="async"/>',
          "<span>" + escapeHtml(item.title || "") + "</span>",
          "</a>"
        ].join("");
      })
      .join("");
  }

  function renderBrandLogos(collection) {
    var grid = document.querySelector(".brand-logo-grid");
    if (!grid) return;
    grid.innerHTML = activeItems(collection)
      .map(function (item) {
        return [
          '<div class="group glass-card brand-logo-hover p-8 h-48 flex items-center justify-center transition-all duration-500 rounded-xl relative overflow-hidden">',
          '<img src="' + escapeHtml(item.image || "") + '" alt="' + escapeHtml(item.name || "") + '" class="brand-logo-img opacity-85 group-hover:opacity-100 transition-all duration-500" loading="lazy" decoding="async"/>',
          '<div class="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>',
          "</div>"
        ].join("");
      })
      .join("");
  }

  function renderAboutServices(collection) {
    var list = document.querySelector(".service-list");
    if (!list) return;
    list.innerHTML = activeItems(collection)
      .map(function (item) {
        return "<li>" + escapeHtml(item.text || "") + "</li>";
      })
      .join("");
  }

  function renderAboutImageStack(collection) {
    var stack = document.querySelector(".image-stack");
    if (!stack) return;
    var items = activeItems(collection);
    if (!items.length) {
      stack.innerHTML = "";
      return;
    }
    stack.innerHTML = [
      '<figure class="image-card"><img src="' + escapeHtml(items[0].image || "") + '" alt="' + escapeHtml(items[0].alt || "") + '" loading="lazy" decoding="async"/></figure>',
      '<div class="image-column">',
      items.slice(1).map(function (item) {
        return '<figure class="image-card small"><img src="' + escapeHtml(item.image || "") + '" alt="' + escapeHtml(item.alt || "") + '" loading="lazy" decoding="async"/></figure>';
      }).join(""),
      "</div>"
    ].join("");
  }

  function renderAboutPhotoGrid(collection) {
    var grid = document.querySelector(".photo-grid");
    if (!grid) return;
    grid.innerHTML = activeItems(collection)
      .map(function (item) {
        return '<figure class="image-card' + (item.wide ? " wide" : "") + '"><img src="' + escapeHtml(item.image || "") + '" alt="' + escapeHtml(item.alt || "") + '" loading="lazy" decoding="async"/></figure>';
      })
      .join("");
  }

  function renderFaq(collection) {
    var questionColumn = document.querySelector(".faq-question-column");
    var stage = document.querySelector(".faq-answer-stage");
    if (!questionColumn || !stage) return;
    var items = activeItems(collection);
    questionColumn.innerHTML = items
      .map(function (item, index) {
        var selected = index === 0;
        return [
          '<button class="faq-question' + (selected ? " is-active" : "") + '" id="faq-question-' + index + '" type="button" role="tab" aria-selected="' + (selected ? "true" : "false") + '" aria-controls="faq-answer-' + index + '" data-faq-index="' + index + '">',
          '<span class="faq-number">' + String(index + 1).padStart(2, "0") + "</span>",
          "<span>" + escapeHtml(item.question || "") + "</span>",
          '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>',
          "</button>"
        ].join("");
      })
      .join("");
    stage.innerHTML = items
      .map(function (item, index) {
        return [
          '<article class="faq-panel faq-answer' + (index === 0 ? " is-active" : "") + '" id="faq-answer-' + index + '" role="tabpanel" aria-labelledby="faq-question-' + index + '" data-faq-panel="' + index + '">',
          "<h2>" + escapeHtml(item.answerTitle || item.question || "") + "</h2>",
          htmlBlock(item.answerHtml || item.answer || ""),
          "</article>"
        ].join("");
      })
      .join("");
    initCmsFaq();
  }

  function initCmsFaq() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".faq-question"));
    var panels = Array.prototype.slice.call(document.querySelectorAll(".faq-panel"));
    var stage = document.querySelector(".faq-answer-stage");
    var mobile = window.matchMedia("(max-width: 1024px)");
    var mobileSlot = document.querySelector(".faq-mobile-answer-slot");
    if (!mobileSlot) {
      mobileSlot = document.createElement("div");
      mobileSlot.className = "faq-mobile-answer-slot";
      mobileSlot.setAttribute("aria-live", "polite");
    }

    function collapse() {
      buttons.forEach(function (button) {
        button.classList.remove("is-active");
        button.setAttribute("aria-selected", "false");
      });
      panels.forEach(function (panel) {
        panel.classList.remove("is-active");
        if (stage && panel.parentElement !== stage) stage.appendChild(panel);
      });
      if (mobileSlot.parentElement) mobileSlot.remove();
      if (stage) stage.setAttribute("aria-hidden", "true");
    }

    function activate(index) {
      var panel = panels[index];
      var button = buttons[index];
      if (!panel || !button) return;
      if (mobile.matches && button.classList.contains("is-active")) {
        collapse();
        return;
      }
      buttons.forEach(function (item, itemIndex) {
        item.classList.toggle("is-active", itemIndex === index);
        item.setAttribute("aria-selected", itemIndex === index ? "true" : "false");
      });
      panels.forEach(function (item, itemIndex) {
        item.classList.toggle("is-active", itemIndex === index);
      });
      if (mobile.matches) {
        button.insertAdjacentElement("afterend", mobileSlot);
        mobileSlot.appendChild(panel);
        if (stage) stage.setAttribute("aria-hidden", "true");
      } else if (stage) {
        if (mobileSlot.parentElement) mobileSlot.remove();
        panels.forEach(function (item) {
          if (item.parentElement !== stage) stage.appendChild(item);
        });
        stage.removeAttribute("aria-hidden");
      }
    }

    buttons.forEach(function (button, index) {
      button.addEventListener("click", function () {
        activate(index);
      });
    });
    if (buttons[0]) activate(0);
  }

  function renderServices(collection) {
    var sidebar = document.querySelector(".solutions-sidebar");
    var page = document.querySelector(".services-page");
    if (!sidebar || !page) return;
    var items = activeItems(collection);
    if (!items.length) return;
    var title = sidebar.querySelector("p") ? sidebar.querySelector("p").textContent : "Nuestras Soluciones";
    sidebar.innerHTML = "<p>" + escapeHtml(title) + "</p>" + items
      .map(function (item, index) {
        var id = slugify(item.slug || item.title, "servicio-" + index);
        return '<a href="#' + escapeHtml(id) + '" class="solution-link' + (index === 0 ? " is-active" : "") + '" data-service-index="' + index + '"><span>' + escapeHtml(item.title || "") + "</span></a>";
      })
      .join("");
    page.innerHTML = items
      .map(function (item, index) {
        var id = slugify(item.slug || item.title, "servicio-" + index);
        var images = [item.image1, item.image2, item.image3].filter(Boolean);
        var mediaClass = item.compact ? "service-media media-feature" : "service-media";
        return [
          '<section class="service-block' + (item.compact ? " service-compact" : "") + '" id="' + escapeHtml(id) + '">',
          '<article class="service-copy">',
          index === 0 ? "<h1>" + escapeHtml(item.title || "") + "</h1>" : "<h2>" + escapeHtml(item.title || "") + "</h2>",
          serviceBodyHtml(item.body || "", item.note || ""),
          "</article>",
          '<div class="' + mediaClass + '">',
          images.map(function (src) {
            return '<figure><img src="' + escapeHtml(src) + '" alt="' + escapeHtml(item.title || "") + '" loading="lazy" decoding="async"/></figure>';
          }).join(""),
          "</div>",
          "</section>"
        ].join("");
      })
      .join("");
    Array.prototype.slice.call(page.querySelectorAll(".service-block")).forEach(function (block) {
      block.classList.add("is-visible");
    });
    initCmsServices();
  }

  function initCmsServices() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".solution-link"));
    var blocks = Array.prototype.slice.call(document.querySelectorAll(".service-block"));
    if (!links.length || !blocks.length) return;
    var desktop = window.matchMedia("(min-width: 1041px)");
    var sidebar = document.querySelector(".solutions-sidebar");

    function setActive(index) {
      links.forEach(function (link, linkIndex) {
        link.classList.toggle("is-active", linkIndex === index);
      });
    }

    function headerOffset() {
      var header = document.getElementById("sm-main-header");
      var headerHeight = header ? header.offsetHeight : 72;
      var sidebarHeight = !desktop.matches && sidebar ? sidebar.offsetHeight : 0;
      return headerHeight + sidebarHeight + (desktop.matches ? 26 : 16);
    }

    function centerMobileLink(index, behavior) {
      if (desktop.matches || !sidebar || !links[index]) return;
      var link = links[index];
      var left = link.offsetLeft - (sidebar.clientWidth - link.clientWidth) / 2;
      sidebar.scrollTo({ left: Math.max(0, left), behavior: behavior || "smooth" });
    }

    function scrollToBlock(index) {
      var target = blocks[index];
      if (!target) return;
      setActive(index);
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      centerMobileLink(index, "smooth");
      if (history.replaceState && target.id) history.replaceState(null, "", "#" + target.id);
    }

    links.forEach(function (link, index) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        scrollToBlock(index);
      });
    });

    window.addEventListener("wheel", function (event) {
      if (document.body.getAttribute("data-page") !== "servicios") return;
      if (window.innerWidth < 901 || Math.abs(event.deltaY) < 28 || event.ctrlKey || event.metaKey || event.altKey) return;
      event.stopImmediatePropagation();
    }, { capture: true, passive: true });

    window.addEventListener("scroll", function () {
      var best = 0;
      var bestDistance = Infinity;
      var offset = headerOffset();
      blocks.forEach(function (block, index) {
        var distance = Math.abs(block.getBoundingClientRect().top - offset);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setActive(best);
      centerMobileLink(best, "smooth");
    }, { passive: true });

    if (window.location.hash) {
      var hash = window.location.hash.slice(1);
      var hashIndex = blocks.findIndex(function (block) {
        return block.id === hash;
      });
      if (hashIndex >= 0) {
        window.setTimeout(function () {
          scrollToBlock(hashIndex);
        }, 120);
      }
    }
  }

  function renderWhySlides(collection) {
    var slider = document.querySelector("[data-why-slider]");
    if (!slider) return;
    var items = activeItems(collection);
    var image = slider.querySelector(".why-slide-image");
    var kicker = slider.querySelector("[data-slide-kicker]");
    var thumbs = slider.querySelector(".slide-thumbs");
    if (!items.length || !image || !thumbs) return;
    image.loading = "lazy";
    image.decoding = "async";
    image.src = items[0].image || "";
    image.alt = items[0].alt || "";
    if (kicker) kicker.textContent = items[0].label || "";
    var stage = slider.querySelector(".slide-stage");
    if (stage) stage.style.setProperty("--active-slide", "url('" + (items[0].image || "") + "')");
    thumbs.innerHTML = items
      .map(function (item, index) {
        return [
          '<button class="slide-thumb' + (index === 0 ? " is-active" : "") + '" type="button" data-src="' + escapeHtml(item.image || "") + '" data-alt="' + escapeHtml(item.alt || "") + '" data-label="' + escapeHtml(item.label || "") + '" aria-label="Imagen ' + (index + 1) + '">',
          '<img src="' + escapeHtml(item.image || "") + '" alt="" loading="lazy" decoding="async"/>',
          "</button>"
        ].join("");
      })
      .join("");
    initCmsWhySlides(slider, items);
  }

  function initCmsWhySlides(slider, items) {
    var stage = slider.querySelector(".slide-stage");
    var image = slider.querySelector(".why-slide-image");
    var kicker = slider.querySelector("[data-slide-kicker]");
    var prev = slider.querySelector(".slide-prev");
    var next = slider.querySelector(".slide-next");
    var thumbs = Array.prototype.slice.call(slider.querySelectorAll(".slide-thumb"));
    var index = 0;
    if (!stage || !image || !items.length) return;

    function setActive(nextIndex) {
      index = (nextIndex + items.length) % items.length;
      var item = items[index];
      image.src = item.image || "";
      image.alt = item.alt || "";
      if (kicker) kicker.textContent = item.label || "";
      stage.style.setProperty("--active-slide", "url('" + (item.image || "") + "')");
      thumbs.forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle("is-active", thumbIndex === index);
      });
    }

    thumbs.forEach(function (thumb, thumbIndex) {
      thumb.addEventListener("click", function (event) {
        event.stopImmediatePropagation();
        setActive(thumbIndex);
      }, true);
    });

    if (prev) {
      prev.addEventListener("click", function (event) {
        event.stopImmediatePropagation();
        setActive(index - 1);
      }, true);
    }
    if (next) {
      next.addEventListener("click", function (event) {
        event.stopImmediatePropagation();
        setActive(index + 1);
      }, true);
    }
  }

  function renderLocations(collection) {
    var grid = document.querySelector(".sm-location-grid");
    if (!grid) return;
    grid.innerHTML = activeItems(collection)
      .map(function (item, index) {
        var query = encodeURIComponent(item.address || item.title || "");
        var mapUrl = item.mapEmbed || ("https://maps.google.com/maps?hl=es&q=" + query + "&t=&z=17&ie=UTF8&iwloc=B&output=embed");
        return [
          '<article class="sm-location-spot">',
          '<div class="sm-location-spot-copy">',
          '<div class="sm-branch-top"><span>Sede ' + String(index + 1).padStart(2, "0") + '</span><span class="material-symbols-outlined" aria-hidden="true">' + escapeHtml(item.icon || "storefront") + "</span></div>",
          "<h3>" + escapeHtml(item.title || "") + "</h3>",
          "<p>" + escapeHtml(item.address || "").replace(/\n/g, "<br>") + "</p>",
          '<div class="sm-location-actions" aria-label="Rutas para ' + escapeHtml(item.title || "") + '">',
          '<a class="sm-location-btn sm-location-btn-primary" href="' + escapeHtml(item.googleMaps || ("https://www.google.com/maps/search/?api=1&query=" + query)) + '" target="_blank" rel="noopener"><span class="material-symbols-outlined" aria-hidden="true">map</span>Google Maps</a>',
          '<a class="sm-location-btn" href="' + escapeHtml(item.waze || ("https://www.waze.com/ul?q=" + query + "&navigate=yes")) + '" target="_blank" rel="noopener"><span class="material-symbols-outlined" aria-hidden="true">near_me</span>Waze</a>',
          "</div></div>",
          '<div class="sm-map-card sm-location-spot-map"><div class="sm-map-status"><span>Mapa de sede</span><strong>' + escapeHtml(item.title || "") + '</strong></div>',
          '<iframe title="Mapa de ' + escapeHtml(item.title || "") + '" src="' + escapeHtml(mapUrl) + '" loading="eager" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>',
          "</div></article>"
        ].join("");
      })
      .join("");
  }

  function renderContactChannels(collection) {
    var list = document.querySelector(".contact-channel-list");
    if (!list) return;
    list.innerHTML = activeItems(collection)
      .map(function (item) {
        var lines = String(item.lines || "")
          .split(/\n+/)
          .map(function (line) {
            return line.trim();
          })
          .filter(Boolean);
        return [
          '<a class="contact-channel-card group" style="--channel-rgb: ' + escapeHtml(item.color || "242 202 80") + ';" href="' + escapeHtml(item.href || "#") + '" target="' + (item.newTab === false ? "_self" : "_blank") + '" rel="noopener" aria-label="' + escapeHtml(item.label || "") + '">',
          '<span class="contact-channel-icon" aria-hidden="true"><span class="material-symbols-outlined">' + escapeHtml(item.icon || "chevron_right") + "</span></span>",
          "<span>",
          '<span class="font-label-caps text-label-caps contact-channel-label block mb-2">' + escapeHtml(item.label || "") + "</span>",
          lines.map(function (line) {
            return '<span class="font-body-md text-on-surface block">' + escapeHtml(line) + "</span>";
          }).join(""),
          "</span>",
          '<span class="material-symbols-outlined contact-channel-arrow" aria-hidden="true">chevron_right</span>',
          "</a>"
        ].join("");
      })
      .join("");
  }

  function applyCollection(collection) {
    if (!collection || !collection.renderer) return;
    switch (collection.renderer) {
      case "homeServices":
        renderHomeServices(collection);
        break;
      case "homeWorks":
        renderHomeWorks(collection);
        break;
      case "brandLogos":
        renderBrandLogos(collection);
        break;
      case "aboutServices":
        renderAboutServices(collection);
        break;
      case "aboutImageStack":
        renderAboutImageStack(collection);
        break;
      case "aboutPhotoGrid":
        renderAboutPhotoGrid(collection);
        break;
      case "faqInteractive":
        renderFaq(collection);
        break;
      case "servicesList":
        renderServices(collection);
        break;
      case "whySlides":
        renderWhySlides(collection);
        break;
      case "locations":
        renderLocations(collection);
        break;
      case "contactChannels":
        renderContactChannels(collection);
        break;
    }
  }

  function applyField(field) {
    if (!field || !field.selector || !field.property) return;
    var nodes;
    try {
      nodes = document.querySelectorAll(field.selector);
    } catch (error) {
      return;
    }
    nodes.forEach(function (element) {
      switch (field.property) {
        case "text":
          setText(element, field.value);
          break;
        case "html":
          setHtml(element, field.value);
          break;
        case "src":
        case "poster":
        case "href":
        case "alt":
        case "title":
        case "placeholder":
          setMedia(element, field, field.property);
          break;
        case "backgroundImage":
          if (field.value) element.style.backgroundImage = 'url("' + field.value + '")';
          break;
        case "value":
          element.value = field.value == null ? "" : String(field.value);
          break;
        default:
          if (field.property.indexOf("attr:") === 0) {
            element.setAttribute(field.property.slice(5), field.value || "");
          }
      }
    });
  }

  function flattenFields(content) {
    return (content.sections || []).reduce(function (acc, section) {
      return acc.concat(section.fields || []);
    }, []);
  }

  function flattenCollections(content) {
    return (content.sections || []).reduce(function (acc, section) {
      return acc.concat(section.collections || []);
    }, []);
  }

  function applyContent(content) {
    var page = currentPage();
    var fields = flattenFields(content).filter(function (field) {
      return field.enabled !== false && fieldApplies(field, page);
    });
    var collections = flattenCollections(content).filter(function (collection) {
      return collection.enabled !== false && fieldApplies(collection, page);
    });
    var signature = fields
      .map(function (field) {
        return [field.id, field.value, field.selector, field.property, field.fit, field.position].join("|");
      })
      .join("~") + collections.map(function (collection) {
        return collection.id + ":" + JSON.stringify(collection.items || []);
      }).join("~");

    if (signature === appliedSignature && retryCount > 4) return;
    appliedSignature = signature;
    fields.forEach(applyField);
    collections.forEach(applyCollection);
  }

  function loadContent() {
    if (loadingContent) return;
    loadingContent = true;
    fetch(CONTENT_URL, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("Contenido CMS no disponible");
        return response.json();
      })
      .then(function (content) {
        loadedContent = content;
        applyContent(content);
        window.setTimeout(function () {
          retryCount += 1;
          applyContent(loadedContent);
        }, 250);
        window.setTimeout(function () {
          retryCount += 1;
          applyContent(loadedContent);
        }, 1000);
      })
      .catch(function () {})
      .finally(function () {
        loadingContent = false;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadContent);
  } else {
    loadContent();
  }

  if ("MutationObserver" in window) {
    var observer = new MutationObserver(function () {
      if (retryCount < 8 && loadedContent) {
        retryCount += 1;
        applyContent(loadedContent);
      }
    });
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }
})();
