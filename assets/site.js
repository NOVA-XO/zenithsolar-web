(() => {
  "use strict";

  const gallery = document.getElementById("gallery");
  const figures = gallery ? [...gallery.querySelectorAll("figure")] : [];
  const filters = gallery
    ? [...gallery.closest("section").querySelectorAll(".filters button")]
    : [];

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.filter || "all";

      filters.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });

      gallery.classList.toggle("filtered", category !== "all");

      figures.forEach((figure) => {
        figure.hidden =
          category !== "all" && figure.dataset.cat !== category;
      });
    });
  });

  const box = document.getElementById("lightbox");
  const big = box?.querySelector("img");
  const closeButton = document.getElementById("lightbox-close");

  if (box && big && closeButton) {
    let returnFocus = null;
    let previousOverflow = "";
    const inertStates = new Map();

    const close = () => {
      if (box.hidden) return;

      box.hidden = true;
      big.removeAttribute("src");
      big.alt = "";
      document.body.style.overflow = previousOverflow;

      inertStates.forEach((wasInert, element) => {
        element.inert = wasInert;
      });
      inertStates.clear();

      if (returnFocus?.isConnected) {
        returnFocus.focus({ preventScroll: true });
      }

      returnFocus = null;
    };

    const open = (figure) => {
      const image = figure.querySelector("img");
      if (!image || figure.hidden || !box.hidden) return;

      returnFocus = figure;
      previousOverflow = document.body.style.overflow;
      big.src = image.currentSrc || image.src;
      big.alt = image.alt;
      box.hidden = false;

      [...document.body.children].forEach((element) => {
        if (
          element instanceof HTMLElement &&
          element !== box &&
          !element.contains(box) &&
          !["SCRIPT", "STYLE", "LINK"].includes(element.tagName)
        ) {
          inertStates.set(element, element.inert);
          element.inert = true;
        }
      });

      document.body.style.overflow = "hidden";
      closeButton.focus({ preventScroll: true });
    };

    figures.forEach((figure) => {
      const image = figure.querySelector("img");
      if (!image) return;

      figure.tabIndex = 0;
      figure.setAttribute("role", "button");
      figure.setAttribute("aria-haspopup", "dialog");
      figure.setAttribute("aria-controls", box.id);
      figure.setAttribute("aria-label", `${image.alt} — томоор харах`);

      figure.addEventListener("click", () => open(figure));

      figure.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(figure);
        }
      });
    });

    closeButton.addEventListener("click", close);

    box.addEventListener("click", (event) => {
      if (event.target === box) close();
    });

    document.addEventListener("keydown", (event) => {
      if (box.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButton.focus({ preventScroll: true });
      }
    });

    document.addEventListener("focusin", (event) => {
      if (
        !box.hidden &&
        event.target instanceof Node &&
        !box.contains(event.target)
      ) {
        closeButton.focus({ preventScroll: true });
      }
    });
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
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      }, {
        rootMargin: "0px 0px -24px 0px",
        threshold: 0
      });

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
          y: dot.top + dot.height / 2
        };
      });

      if (!points.length) return;

      const first = points[0];
      const last = points[points.length - 1];
      const axis = vertical.matches ? "y" : "x";
      const length = Math.max(0, last[axis] - first[axis]);

      steps.style.setProperty("--track-length", `${length}px`);
      steps.style.setProperty(
        "--track-left",
        `${first.x - rect.left - (vertical.matches ? 1 : 0)}px`
      );
      steps.style.setProperty(
        "--track-top",
        `${first.y - rect.top - (vertical.matches ? 0 : 1)}px`
      );

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
