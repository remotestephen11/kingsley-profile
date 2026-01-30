(() => {
  "use strict";

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Scroll Progress =====
  const progressBar = $(".scroll-progress__bar");
  const updateProgress = () => {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${pct}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  // ===== Back to Top =====
  const toTopBtn = $(".toTop");
  const toggleToTop = () => {
    if (!toTopBtn) return;
    const y = window.scrollY || document.documentElement.scrollTop;
    if (y > 600) toTopBtn.classList.add("is-visible");
    else toTopBtn.classList.remove("is-visible");
  };
  window.addEventListener("scroll", toggleToTop, { passive: true });
  toggleToTop();

  if (toTopBtn) {
    toTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ===== Mobile Nav =====
  const navToggle = $(".nav__toggle");
  const navMenu = $(".nav__menu");

  const closeNav = () => {
    if (!navMenu) return;
    navMenu.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  };

  if (navToggle && navMenu) {
    navToggle.setAttribute("aria-expanded", "false");

    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("is-open");
      const open = navMenu.classList.contains("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close when a link is clicked (mobile)
    $$(".nav__link", navMenu).forEach((link) => {
      link.addEventListener("click", () => closeNav());
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      const clickedInside =
        navMenu.contains(target) || navToggle.contains(target);
      if (!clickedInside) closeNav();
    });

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  // ===== Smooth scrolling (guard against fixed header) =====
  const header = $(".header");
  const headerOffset = () => (header ? header.offsetHeight + 10 : 80);

  const smoothTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top =
      el.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    window.scrollTo({ top, behavior: "smooth" });
  };

  // Only handle same-page anchor links
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      smoothTo(id);
    });
  });

  // ===== Reveal on scroll =====
  const revealEls = $$(".reveal");
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.14 }
        )
      : null;

  if (io) {
    revealEls.forEach((el) => io.observe(el));
  } else {
    // Fallback: show everything
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ===== Animated counters (Hero stats) =====
  const counters = $$(".count[data-target]");
  const animateCounter = (el) => {
    const target = parseFloat(el.getAttribute("data-target") || "0");
    if (!Number.isFinite(target) || target <= 0) return;

    const duration = 900; // ms
    const start = 0;
    const t0 = performance.now();

    const step = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = String(value);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(Math.round(target));
    };

    requestAnimationFrame(step);
  };

  if (counters.length) {
    // Start when hero is visible (or immediately if no IO)
    const hero = $(".hero");
    if (hero && "IntersectionObserver" in window) {
      let started = false;
      const heroIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !started) {
              started = true;
              counters.forEach(animateCounter);
              heroIO.disconnect();
            }
          });
        },
        { threshold: 0.22 }
      );
      heroIO.observe(hero);
    } else {
      counters.forEach(animateCounter);
    }
  }

  // ===== Theme toggle (optional) =====
  // Works if your index.html has a button with class ".themeToggle"
  // and optional span ".themeLabel". If not present, it safely does nothing.
  const themeToggle = $(".themeToggle");
  const themeLabel = $(".themeLabel");

  const setTheme = (mode) => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem("k1_theme", mode);
    } catch {}
    if (themeLabel) themeLabel.textContent = mode === "light" ? "Light" : "Dark";
  };

  const initTheme = () => {
    let saved = null;
    try {
      saved = localStorage.getItem("k1_theme");
    } catch {}
    if (saved === "light" || saved === "dark") return setTheme(saved);

    // Default: dark (premium look). If user prefers light, respect it.
    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(prefersLight ? "light" : "dark");
  };

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  // ===== Copy-to-clipboard (optional, professional touch) =====
  // If your index has buttons with [data-copy] attributes, this will work.
  // Example: <button class="btn" data-copy="+234806..." type="button">Copy</button>
  const copyBtns = $$("[data-copy]");
  const toast = (msg) => {
    // Small internal toast without adding HTML:
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "18px";
    el.style.transform = "translateX(-50%)";
    el.style.padding = "10px 12px";
    el.style.border = "1px solid rgba(255,255,255,.16)";
    el.style.borderRadius = "14px";
    el.style.background = "rgba(0,0,0,.55)";
    el.style.backdropFilter = "blur(10px)";
    el.style.color = "#fff";
    el.style.fontWeight = "800";
    el.style.fontSize = "12px";
    el.style.zIndex = "5000";
    el.style.opacity = "0";
    el.style.transition = "opacity .2s ease, transform .2s ease";
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(-2px)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(6px)";
      setTimeout(() => el.remove(), 240);
    }, 1200);
  };

  if (copyBtns.length) {
    copyBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.getAttribute("data-copy") || "";
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          toast("Copied to clipboard");
        } catch {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            toast("Copied to clipboard");
          } catch {
            toast("Copy failed");
          }
          ta.remove();
        }
      });
    });
  }

  // ===== Safety: prevent empty "mailto:" / "tel:" =====
  // (If you accidentally leave placeholders in HTML, this avoids dead clicks.)
  $$('a[href^="mailto:"]').forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === "mailto:" || href === "mailto:#") a.setAttribute("href", "#");
  });
  $$('a[href^="tel:"]').forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === "tel:" || href === "tel:#") a.setAttribute("href", "#");
  });
})();
