import { buildEnquiry, CONTACT_EMAIL, SERVICE_LABELS } from "./enquiry.js";
(() => {
  "use strict";
  const gallery = document.getElementById("gallery");
  const figures = gallery ? [...gallery.querySelectorAll("figure")] : [];
  const filters = gallery ? [...gallery.closest("section").querySelectorAll(".filters button")] : [];
  const more = document.getElementById("gallery-more");
  const galleryStatus = document.getElementById("gallery-status");
  let category = "all";
  let expanded = false;
  const pageSize = 6;
  function updateGallery() {
    const matching = figures.filter((figure) => category === "all" || figure.dataset.cat === category);
    const shown = new Set(expanded ? matching : matching.slice(0, pageSize));
    for (const figure of figures) figure.hidden = !shown.has(figure);
    gallery.classList.toggle("filtered", category !== "all");
    if (galleryStatus)
      galleryStatus.textContent =
        matching.length === shown.size
          ? matching.length + " зураг"
          : matching.length + " зургаас " + shown.size + "-г харуулж байна";
    if (more) {
      more.hidden = matching.length <= pageSize;
      more.setAttribute("aria-expanded", String(expanded));
      more.textContent = expanded
        ? "Хурааж харах"
        : "Бусад " + (matching.length - pageSize) + " зургийг үзэх";
    }
    return matching;
  }
  for (const button of filters) {
    const filter = button.dataset.filter;
    const count = figures.filter((figure) => filter === "all" || figure.dataset.cat === filter).length;
    const badge = document.createElement("span");
    badge.className = "filter-count";
    badge.textContent = String(count);
    button.append(" ", badge);
    button.addEventListener("click", () => {
      category = filter || "all";
      expanded = false;
      for (const item of filters) item.setAttribute("aria-pressed", String(item === button));
      updateGallery();
    });
  }
  more?.addEventListener("click", () => {
    expanded = !expanded;
    const matching = updateGallery();
    if (expanded) {
      matching[pageSize]?.focus({ preventScroll: true });
      matching[pageSize]?.scrollIntoView({ behavior: "auto", block: "nearest" });
    } else {
      matching[0]?.focus({ preventScroll: true });
      gallery.scrollIntoView({ behavior: "auto", block: "start" });
    }
  });
  if (gallery) updateGallery();

  const box = document.getElementById("lightbox");
  const big = box?.querySelector("img");
  const closeButton = document.getElementById("lightbox-close");
  const previousButton = document.getElementById("lightbox-prev");
  const nextButton = document.getElementById("lightbox-next");
  const caption = document.getElementById("lightbox-caption");
  const counter = document.getElementById("lightbox-count");
  if (box && big && closeButton && previousButton && nextButton) {
    let returnFocus = null;
    let previousOverflow = "";
    let activeImages = [];
    let imageIndex = 0;
    const inertStates = new Map();
    const showImage = () => {
      const figure = activeImages[imageIndex];
      const image = figure.querySelector("img");
      big.src = image.currentSrc || image.src;
      big.alt = image.alt;
      caption.textContent = figure.querySelector("figcaption")?.textContent.trim() || image.alt;
      counter.textContent = imageIndex + 1 + " / " + activeImages.length;
      previousButton.hidden = nextButton.hidden = activeImages.length < 2;
    };
    const close = () => {
      if (box.hidden) return;
      box.hidden = true;
      big.removeAttribute("src");
      big.alt = "";
      caption.textContent = "Зураг";
      counter.textContent = "";
      document.body.style.overflow = previousOverflow;
      for (const [element, wasInert] of inertStates) element.inert = wasInert;
      inertStates.clear();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    };
    const move = (delta) => {
      if (box.hidden || !activeImages.length) return;
      imageIndex = (imageIndex + delta + activeImages.length) % activeImages.length;
      showImage();
    };
    const open = (figure) => {
      if (figure.hidden || !box.hidden) return;
      activeImages = figures.filter((item) => !item.hidden);
      imageIndex = activeImages.indexOf(figure);
      if (imageIndex < 0) return;
      returnFocus = figure;
      previousOverflow = document.body.style.overflow;
      showImage();
      box.hidden = false;
      for (const element of document.body.children) {
        if (
          element instanceof HTMLElement &&
          element !== box &&
          !element.contains(box) &&
          !["SCRIPT", "STYLE", "LINK"].includes(element.tagName)
        ) {
          inertStates.set(element, element.inert);
          element.inert = true;
        }
      }
      document.body.style.overflow = "hidden";
      closeButton.focus({ preventScroll: true });
    };
    for (const figure of figures) {
      const image = figure.querySelector("img");
      if (!image) continue;
      figure.tabIndex = 0;
      figure.setAttribute("role", "button");
      figure.setAttribute("aria-haspopup", "dialog");
      figure.setAttribute("aria-controls", box.id);
      figure.setAttribute("aria-label", image.alt + " — томоор харах");
      figure.addEventListener("click", () => open(figure));
      figure.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(figure);
        }
      });
    }
    closeButton.addEventListener("click", close);
    previousButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));
    box.addEventListener("click", (event) => {
      if (event.target === box) close();
    });
    document.addEventListener("keydown", (event) => {
      if (box.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "Tab") {
        event.preventDefault();
        const buttons = [...box.querySelectorAll("button")].filter(
          (button) => !button.hidden && !button.disabled,
        );
        const current = buttons.indexOf(document.activeElement);
        buttons[(current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    });
    document.addEventListener("focusin", (event) => {
      if (!box.hidden && event.target instanceof Node && !box.contains(event.target))
        closeButton.focus({ preventScroll: true });
    });
  }

  const form = document.getElementById("enquiry-form");
  const draft = document.getElementById("enquiry-draft");
  const formMessage = document.getElementById("enquiry-status");
  const draftText = document.getElementById("draft-text");
  const draftMessage = document.getElementById("draft-status");
  const emailLink = document.getElementById("open-enquiry-email");
  const copyDraft = document.getElementById("copy-enquiry");
  const fields = (id) => document.getElementById("enquiry-" + id);
  const showEditor = () => {
    if (!form || !draft) return;
    form.hidden = false;
    draft.hidden = true;
    formMessage.textContent = "";
  };
  for (const link of document.querySelectorAll("[data-service]")) {
    link.addEventListener("click", (event) => {
      if (!form || !Object.hasOwn(SERVICE_LABELS, link.dataset.service)) return;
      event.preventDefault();
      showEditor();
      fields("service").value = link.dataset.service;
      document.getElementById("contact").scrollIntoView({ behavior: "auto", block: "start" });
      fields("location").focus({ preventScroll: true });
    });
  }
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      const result = buildEnquiry(
        Object.fromEntries(
          ["service", "location", "details", "name", "contact"].map((id) => [id, fields(id).value]),
        ),
      );
      draftText.value = result.body;
      emailLink.setAttribute("href", result.mailto);
      emailLink.hidden = !result.canOpenEmail;
      copyDraft.classList.toggle("btn-sun", !result.canOpenEmail);
      copyDraft.classList.toggle("btn-line", result.canOpenEmail);
      draftMessage.textContent = result.canOpenEmail
        ? "Ноорог бэлэн. Шалгаад өөрийн имэйлээс илгээнэ үү."
        : "Ноорог бэлэн. Урт нооргийг хуулж өөрийн имэйлд оруулаад илгээгээрэй.";
      form.hidden = true;
      draft.hidden = false;
      document.getElementById("draft-title").focus({ preventScroll: true });
    } catch (error) {
      formMessage.textContent = error.message;
    }
  });
  if (form) {
    form.hidden = false;
    form.querySelector('button[type="submit"]').disabled = false;
  }
  document.getElementById("edit-enquiry")?.addEventListener("click", () => {
    showEditor();
    fields("details").focus({ preventScroll: true });
  });
  async function copyText(value, message, fallback) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      message.textContent = "Хуулагдлаа.";
    } catch {
      message.textContent = "Хуулж чадсангүй. Текстийг сонгоод Ctrl+C дарна уу.";
      fallback?.focus();
      fallback?.select();
    }
  }
  copyDraft?.addEventListener("click", () => copyText(draftText.value, draftMessage, draftText));
  document
    .getElementById("copy-email")
    ?.addEventListener("click", () => copyText(CONTACT_EMAIL, document.getElementById("copy-email-status")));

  const shortcut = document.querySelector(".mobile-contact");
  if (shortcut && "IntersectionObserver" in window) {
    let heroVisible = true;
    let contactVisible = false;
    const hero = document.querySelector(".hero");
    const contact = document.getElementById("contact");
    const shortcutObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) heroVisible = entry.isIntersecting;
          if (entry.target === contact) contactVisible = entry.isIntersecting;
        }
        shortcut.classList.toggle("is-visible", !heroVisible && !contactVisible);
      },
      { threshold: 0 },
    );
    shortcutObserver.observe(hero);
    shortcutObserver.observe(contact);
  }

  const items = [...document.querySelectorAll(".reveal")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let observer = null;

  const showAll = () => {
    observer?.disconnect();
    items.forEach((element) => {
      element.classList.remove("is-pending");
      element.classList.add("in");
    });
  };

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          });
        },
        {
          rootMargin: "0px 0px -24px 0px",
          threshold: 0,
        },
      );

      items.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) {
          element.classList.add("in");
        } else {
          element.classList.add("is-pending");
          observer.observe(element);
        }
      });
    } catch {
      showAll();
    }
  } else {
    showAll();
  }

  const handleMotionChange = (event) => {
    if (event.matches) showAll();
  };

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else {
    reducedMotion.addListener(handleMotionChange);
  }

  const steps = document.getElementById("steps");
  if (steps) {
    const stepItems = [...steps.children];
    const vertical = window.matchMedia("(max-width: 760px)");
    const clamp = (value) => Math.min(1, Math.max(0, value));
    let frame = 0;

    const updateSteps = () => {
      frame = 0;
      const rect = steps.getBoundingClientRect();
      const points = stepItems.map((item) => {
        const dot = item.querySelector(".step-dot").getBoundingClientRect();
        return {
          x: dot.left + dot.width / 2,
          y: dot.top + dot.height / 2,
        };
      });

      if (!points.length) return;

      const first = points[0];
      const last = points[points.length - 1];
      const axis = vertical.matches ? "y" : "x";
      const length = Math.max(0, last[axis] - first[axis]);

      steps.style.setProperty("--track-length", `${length}px`);
      steps.style.setProperty("--track-left", `${first.x - rect.left - (vertical.matches ? 1 : 0)}px`);
      steps.style.setProperty("--track-top", `${first.y - rect.top - (vertical.matches ? 0 : 1)}px`);

      let progress = 1;
      if (!reducedMotion.matches) {
        const trigger = window.innerHeight * 0.8;
        progress = vertical.matches
          ? clamp((trigger - first.y) / Math.max(1, length))
          : clamp((trigger - first.y) / Math.max(1, window.innerHeight * 0.45));
      }

      steps.style.setProperty("--p", String(progress));
      steps.classList.toggle("live", !reducedMotion.matches);

      stepItems.forEach((item, index) => {
        const at = length ? (points[index][axis] - first[axis]) / length : 0;
        item.classList.toggle("done", progress >= at);
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateSteps);
    };

    const syncMotion = () => {
      window.removeEventListener("scroll", requestUpdate);
      if (!reducedMotion.matches) {
        window.addEventListener("scroll", requestUpdate, { passive: true });
      }
      requestUpdate();
    };

    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", syncMotion);
    } else {
      reducedMotion.addListener(syncMotion);
    }

    window.addEventListener("resize", requestUpdate);
    if ("ResizeObserver" in window) {
      new ResizeObserver(requestUpdate).observe(steps);
    }

    updateSteps();
    syncMotion();
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
