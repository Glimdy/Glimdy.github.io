(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Theme */
  const toggle = document.getElementById("themeToggle");
  const label = () => toggle && toggle.setAttribute("aria-label",
    root.dataset.theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  label();

  function applyTheme(next) {
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    label();
  }

  let fadeTimer;
  toggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    if (reduced) return applyTheme(next);
    clearTimeout(fadeTimer);
    root.classList.add("theme-fade");
    applyTheme(next);
    // Keep the class until the palette has settled (0.4s) so element transitions stay paused.
    fadeTimer = setTimeout(() => root.classList.remove("theme-fade"), 480);
  });

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch {}
    if (!saved) { root.dataset.theme = e.matches ? "dark" : "light"; label(); }
  });

  /* Reveal on scroll */
  const reveals = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("in");
        io.unobserve(el);
        const settle = (ev) => {
          if (ev.target !== el) return;
          el.classList.remove("reveal", "in");
          el.removeEventListener("transitionend", settle);
        };
        el.addEventListener("transitionend", settle);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* Nav shadow + active section */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav?.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll('.nav-link[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => so.observe(s));
  }

  /* Card spotlight follows the pointer */
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  /* Copy buttons */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest?.("[data-copy]");
    if (!btn) return;
    const text = btn.dataset.copy;
    const done = btn.querySelector(".copy-label");
    try {
      await navigator.clipboard.writeText(text);
      if (done) { done.textContent = "Copied"; setTimeout(() => (done.textContent = "Copy"), 1600); }
    } catch {
      const target = document.getElementById(btn.dataset.copyTarget);
      if (target) getSelection().selectAllChildren(target);
    }
  });

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
