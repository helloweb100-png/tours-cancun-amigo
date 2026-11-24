/* ==========================================================
   Tours Cancún Amigo · «Zarpar»
   Un solo bucle rAF, módulos aislados con try/catch y
   respaldos por geometría para que nada quede oculto.
   ========================================================== */
const WHATSAPP_NUMERO = "529984576356"; // única fuente del número (con lada de país, sin +)

const TOURS = {
  isla:    { nombre: "Isla Mujeres en catamarán", precio: 850 },
  chichen: { nombre: "Chichén Itzá Clásico",      precio: 1550 },
  xcaret:  { nombre: "Xcaret Plus",               precio: 3500 },
  xelha:   { nombre: "Xel-Há",                    precio: null }
};

const VISOR = {
  "cartel-isla-bebida":    { src: "assets/img/cartel-isla-bebida.jpg",    alt: "Cartel oficial del tour a Isla Mujeres con bebida libre a bordo, $850 por persona", cap: "Isla Mujeres · Bebida libre", tour: "isla" },
  "cartel-isla-catamaran": { src: "assets/img/cartel-isla-catamaran.jpg", alt: "Cartel oficial del catamarán a Isla Mujeres con buffet, snorkel y 2 horas libres", cap: "Isla Mujeres · Catamarán", tour: "isla" },
  "cartel-isla-encuentro": { src: "assets/img/cartel-isla-encuentro.jpg", alt: "Cartel con el punto de encuentro, horarios y qué traer al tour de Isla Mujeres", cap: "Isla Mujeres · Punto de encuentro", tour: "isla" },
  "cartel-chichen":        { src: "assets/img/cartel-chichen.jpg",        alt: "Cartel oficial de Chichén Itzá Clásico, $1,550 por persona", cap: "Chichén Itzá Clásico", tour: "chichen" },
  "cartel-xcaret":         { src: "assets/img/cartel-xcaret.jpg",         alt: "Cartel oficial de Xcaret Plus todo incluido, $3,500 por persona", cap: "Xcaret Plus", tour: "xcaret" },
  "g-cat-gente":      { src: "assets/img/cat-gente.jpg",       alt: "Amigos brindando a bordo del catamarán a Isla Mujeres", cap: "Catamarán a Isla Mujeres", tour: "isla" },
  "g-piramide":       { src: "assets/img/piramide-chichen.jpg", alt: "Pirámide de Kukulkán en Chichén Itzá", cap: "Chichén Itzá", tour: "chichen" },
  "g-show-maya":      { src: "assets/img/show-maya.jpg",        alt: "Show maya nocturno con espectáculo de fuego", cap: "Show maya nocturno", tour: "xcaret" },
  "g-cenote-xcaret":  { src: "assets/img/cenote-xcaret.jpg",    alt: "Ríos subterráneos de Xcaret con agua cristalina", cap: "Ríos subterráneos de Xcaret", tour: "xcaret" },
  "g-cat-isla":       { src: "assets/img/cat-isla.jpg",         alt: "Catamarán navegando rumbo a Isla Mujeres", cap: "Rumbo a la isla", tour: "isla" },
  "g-cenote-chichen": { src: "assets/img/cenote-chichen.jpg",   alt: "Cenote en la ruta de Chichén Itzá", cap: "Cenote", tour: "chichen" }
};
const ORDEN = Object.keys(VISOR);

(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const safe = (fn, name) => { try { return fn(); } catch (e) { console.warn("[módulo " + name + "]", e); } };
  const hasWA = typeof WHATSAPP_NUMERO === "string" && /^\d{10,15}$/.test(WHATSAPP_NUMERO);
  const waUrl = (t) => `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(t)}`;
  const money = (v) => "$" + Math.round(v).toLocaleString("es-MX");
  const SVGNS = "http://www.w3.org/2000/svg";

  let vh = innerHeight, vw = innerWidth;
  let lenis = null, lastY = -1, dirty = true, velocity = 0;
  const updaters = [];   // dependen del scroll
  const loops = [];      // se ejecutan cada cuadro

  function tween(from, to, dur, fn, done) {
    const t0 = performance.now();
    (function s(now) {
      const p = clamp((now - t0) / dur);
      fn(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(s); else if (done) done();
    })(t0);
  }
  function near(el, m = 1) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return (r.bottom < -vh * m || r.top > vh * (1 + m)) ? null : r;
  }

  /* ---------- WhatsApp ---------- */
  safe(() => {
    if (!hasWA) {
      $("#waFloat").classList.add("is-off");
      $$(".btn--wa").forEach((b) => (b.hidden = true));
      const send = $("#fSend"); if (send) send.hidden = true;
      return;
    }
    $$("[data-wa]").forEach((a) => {
      a.href = waUrl(a.dataset.wa);
      a.target = "_blank";
      a.rel = "noopener";
    });
  }, "whatsapp");

  /* ---------- Cargador ---------- */
  function ready() { root.classList.add("ready"); }
  safe(() => {
    const L = $("#loader");
    if (!L) return ready();
    const num = $("#ldNum"), draw = $("#ldDraw");
    const t0 = performance.now(), dur = 1500;
    let done = false;
    function finish() {
      if (done) return; done = true;
      L.classList.add("is-out");
      ready();
      setTimeout(() => L.classList.add("is-gone"), 1000);
    }
    (function step(now) {
      if (done) return;
      const p = clamp((now - t0) / dur);
      num.textContent = Math.round(p * 100);
      draw.style.strokeDashoffset = String(578 * (1 - p));
      L.style.setProperty("--ld", String(p * 100));
      if (p < 1) requestAnimationFrame(step); else setTimeout(finish, 180);
    })(t0);
    setTimeout(finish, 2100);
  }, "cargador");
  setTimeout(ready, 2300);

  /* ---------- Generadores SVG (rayos, relojes) ---------- */
  safe(() => {
    const g = $("#rays");
    for (let i = 0; i < 24; i++) {
      const gr = document.createElementNS(SVGNS, "g");
      gr.setAttribute("transform", `rotate(${i * 15} 200 200)`);
      const r = document.createElementNS(SVGNS, "rect");
      r.setAttribute("x", "194"); r.setAttribute("y", "4"); r.setAttribute("width", "12");
      r.setAttribute("height", "28"); r.setAttribute("rx", "6");
      r.style.animationDelay = ((i % 8) * 0.375) + "s";
      gr.appendChild(r); g.appendChild(gr);
    }
    const cs = $("#csunRays");
    if (cs) for (let i = 0; i < 24; i++) {
      const l = document.createElementNS(SVGNS, "line");
      l.setAttribute("x1", "200"); l.setAttribute("y1", "100"); l.setAttribute("x2", "200"); l.setAttribute("y2", i % 2 ? "58" : "40");
      l.setAttribute("transform", `rotate(${i * 15} 200 200)`);
      l.style.animationDelay = ((i % 6) * 0.4) + "s";
      cs.appendChild(l);
    }
    const t24 = $("#ticks24");
    if (t24) {
      const ring = document.createElementNS(SVGNS, "circle");
      ring.setAttribute("cx", "100"); ring.setAttribute("cy", "100"); ring.setAttribute("r", "94");
      ring.setAttribute("fill", "#F4FBFD"); ring.setAttribute("stroke", "#00A8CC"); ring.setAttribute("stroke-width", "5");
      t24.appendChild(ring);
      for (let i = 0; i < 24; i++) {
        const l = document.createElementNS(SVGNS, "line");
        const major = i % 6 === 0;
        l.setAttribute("x1", "100"); l.setAttribute("x2", "100");
        l.setAttribute("y1", major ? "14" : "18"); l.setAttribute("y2", major ? "28" : "26");
        l.setAttribute("stroke", major ? "#062A4D" : "#006F8C"); l.setAttribute("stroke-width", major ? "4" : "2.5");
        l.setAttribute("stroke-linecap", "round");
        l.setAttribute("transform", `rotate(${i * 15} 100 100)`);
        t24.appendChild(l);
      }
    }
    const t12 = $("#ticks12");
    if (t12) for (let i = 0; i < 12; i++) {
      const l = document.createElementNS(SVGNS, "line");
      l.setAttribute("x1", "150"); l.setAttribute("x2", "150"); l.setAttribute("y1", "30"); l.setAttribute("y2", i % 3 === 0 ? "48" : "40");
      l.setAttribute("stroke", "#062A4D"); l.setAttribute("stroke-width", i % 3 === 0 ? "5" : "3"); l.setAttribute("stroke-linecap", "round");
      l.setAttribute("transform", `rotate(${i * 30} 150 150)`);
      t12.appendChild(l);
    }
  }, "svg-gen");

  /* ---------- Smooth scroll (Lenis) ---------- */
  safe(() => {
    if (reduced || typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
  }, "lenis");

  function goTo(target) {
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: target.id === "inicio" ? 0 : -60, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.wa) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    closeMenu();
    goTo(t);
  });

  /* ---------- Menú móvil ---------- */
  const burger = $("#burger"), menu = $("#menu");
  function closeMenu() {
    if (!menu || !menu.classList.contains("open")) return;
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menú");
    menu.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
  }
  safe(() => {
    burger.addEventListener("click", () => {
      const open = !menu.classList.contains("open");
      if (!open) return closeMenu();
      menu.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Cerrar menú");
      menu.setAttribute("aria-hidden", "false");
      if (lenis) lenis.stop();
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }, "menu");

  /* ---------- Rotador del hero ---------- */
  safe(() => {
    const words = $$("#rot b");
    if (words.length < 2 || reduced) return;
    let i = 0;
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      cur.classList.remove("on"); cur.classList.add("out");
      words[i].classList.remove("out"); words[i].classList.add("on");
      setTimeout(() => cur.classList.remove("out"), 700);
    }, 2600);
  }, "rotador");

  /* ---------- Emblema 3D (inclinación) ---------- */
  safe(() => {
    const tilt = $("#tilt");
    if (!tilt || reduced) return;
    let px = 0, py = 0, lastMove = -9999, cx = 0, cy = 0, visible = true;
    const hero = $("#inicio");
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(hero);
    if (finePointer) window.addEventListener("pointermove", (e) => {
      px = (e.clientX / vw - 0.5) * 2; py = (e.clientY / vh - 0.5) * 2; lastMove = performance.now();
    }, { passive: true });
    loops.push((t) => {
      if (!visible) return;
      let tx, ty;
      if (finePointer && t - lastMove < 2500) { tx = px * 7; ty = -py * 7; }
      else { const a = (t / 9000) * Math.PI * 2; tx = Math.sin(a) * 5; ty = Math.cos(a * 1.3) * 4; }
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      tilt.style.transform = `rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`;
    });
  }, "emblema");

  /* ---------- Chispas (canvas) ---------- */
  safe(() => {
    const cv = $("#chispas");
    if (!cv || reduced || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const hero = $("#inicio");
    let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), parts = [], running = true, mx = -999, my = -999;
    function build() {
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = vw < 700 ? 26 : 55;
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 2 + Math.random() * 6, vy: 0.15 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.25,
        ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.4, star: Math.random() < 0.4
      }));
    }
    build();
    window.addEventListener("resize", build);
    new IntersectionObserver((en) => { running = en[0].isIntersecting && !document.hidden; }).observe(hero);
    document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; });
    if (finePointer) hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { mx = my = -999; });
    function star(x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i - Math.PI / 2, rr = i % 2 ? r * 0.28 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    }
    loops.push((t) => {
      if (!running) { if (!document.hidden && hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < vh) running = true; return; }
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy; p.x += p.vx + Math.sin(t / 1400 + p.ph) * 0.2;
        const dx = mx - p.x, dy = my - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) { p.x += dx * 0.0035; p.y += dy * 0.0035; }
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
        const a = 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * p.sp + p.ph));
        if (p.star) {
          ctx.fillStyle = `rgba(255,190,20,${a})`; ctx.shadowColor = "rgba(255,209,41,.9)"; ctx.shadowBlur = 12;
          star(p.x, p.y, p.r * 1.5);
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = `rgba(0,168,204,${a * 0.55})`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.stroke();
          ctx.fillStyle = `rgba(255,255,255,${a * 0.7})`;
          ctx.beginPath(); ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.22, 0, 6.283); ctx.fill();
        }
      }
    });
  }, "chispas");

  /* ---------- Cintas (marquee) ---------- */
  const marquees = [];
  safe(() => {
    $$("[data-marquee]").forEach((track) => {
      const row = track.firstElementChild;
      const orig = row.innerHTML;
      let n = 0;
      while (row.scrollWidth < Math.max(vw, 900) * 1.2 && n < 8) { row.innerHTML += orig; n++; }
      const clone = row.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
      marquees.push(track);
    });
  }, "cintas");
  updaters.push(() => {
    velocity *= 0.9;
    marquees.forEach((t) => {
      const an = t.getAnimations && t.getAnimations()[0];
      if (an) an.playbackRate = 1 + Math.min(7, Math.abs(velocity) * 0.18);
    });
  });

  /* ---------- Manifiesto ---------- */
  safe(() => {
    const sec = $("#nosotros"), p = $("#maniP");
    if (!sec || !p) return;
    (function wrap(node) {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) wrap(c);
      });
    })(p);
    const words = $$(".w", p), tags = $("#maniTags"), sun = $("#maniSun");
    let shown = -1;
    updaters.push(() => {
      const r = near(sec, 0.5); if (!r) return;
      const s = reduced ? 1 : clamp(-r.top / Math.max(1, r.height - vh));
      const act = Math.floor(clamp(s / 0.82) * words.length);
      if (act !== shown) {
        shown = act;
        words.forEach((w, i) => { w.classList.toggle("on", i < act); w.classList.toggle("edge", i === act - 1 && act < words.length); });
      }
      tags.classList.toggle("on", s > 0.88);
      if (sun) sun.style.transform = `rotate(${s * 360}deg)`;
    });
  }, "manifiesto");

  /* ---------- Tours: carril fijado ---------- */
  let pinDist = 0, pinned = false;
  const toursSec = $("#tours");
  function setupTours() {
    if (!toursSec) return;
    const track = $("#toursTrack");
    pinned = vw >= 900 && !reduced;
    toursSec.classList.toggle("is-pin", pinned);
    if (pinned) {
      pinDist = Math.max(0, track.offsetWidth - vw);
      toursSec.style.height = (pinDist + vh) + "px";
    } else {
      toursSec.style.height = "";
      track.style.transform = "";
    }
    $$(".tour", toursSec).forEach((t, i) => {
      t.classList.remove("no-stick");
      if (!pinned && vw < 900 && t.offsetHeight > vh - (76 + i * 14) - 24) t.classList.add("no-stick");
    });
  }
  safe(() => {
    if (!toursSec) return;
    const track = $("#toursTrack"), hudNum = $("#hudNum"), hudFill = $("#hudFill"), marks = $$(".hud__bar b");
    let lastIdx = -1;
    updaters.push(() => {
      if (!pinned) return;
      const r = near(toursSec, 0.5); if (!r) return;
      const s = clamp(-r.top / Math.max(1, toursSec.offsetHeight - vh));
      track.style.transform = `translate3d(${(-s * pinDist).toFixed(1)}px,0,0)`;
      hudFill.parentElement.style.setProperty("--tp", s.toFixed(3));
      const idx = Math.min(3, Math.floor(s * 4));
      if (idx !== lastIdx) {
        lastIdx = idx;
        hudNum.textContent = "0" + (idx + 1) + "/04";
        marks.forEach((m, i) => m.classList.toggle("on", i <= idx));
      }
    });
  }, "tours");

  /* ---------- Contadores (anime.js si existe) ---------- */
  safe(() => {
    const els = $$("[data-count]").map((el) => ({ el, done: false, v: +el.dataset.count }));
    function run(o) {
      o.done = true;
      const apply = (v) => { o.el.textContent = money(v); };
      if (reduced) return apply(o.v);
      if (window.anime) {
        const obj = { v: 0 };
        window.anime({ targets: obj, v: o.v, duration: 1400, easing: "easeOutExpo", round: 1, update: () => apply(obj.v), complete: () => apply(o.v) });
      } else tween(0, o.v, 1300, apply, () => apply(o.v));
    }
    updaters.push(() => {
      els.forEach((o) => {
        if (o.done) return;
        const r = o.el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0 && r.left < vw * 0.92 && r.right > 0) run(o);
      });
    });
  }, "contadores");

  /* ---------- Zoom «A bordo» ---------- */
  safe(() => {
    const sec = $("#a-bordo"), tags = $("#zoomTags"), cta = $("#zoomCta");
    if (!sec) return;
    if (reduced) { tags.classList.add("on"); cta.classList.add("on"); return; }
    updaters.push(() => {
      const r = near(sec, 0.3); if (!r) return;
      const s = clamp(-r.top / Math.max(1, r.height - vh));
      sec.style.setProperty("--zp", clamp(s / 0.55).toFixed(4));
      tags.classList.toggle("on", s > 0.6);
      cta.classList.toggle("on", s > 0.82);
    });
  }, "zoom");

  /* ---------- Bento: foco e inclinación ---------- */
  safe(() => {
    if (!finePointer || reduced) return;
    $$(".bcard").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty("--mx", x + "px"); c.style.setProperty("--my", y + "px");
        c.style.setProperty("--rx", ((y / r.height - 0.5) * -8).toFixed(2) + "deg");
        c.style.setProperty("--ry", ((x / r.width - 0.5) * 8).toFixed(2) + "deg");
      });
      c.addEventListener("pointerleave", () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    });
  }, "bento");

  /* ---------- Xcaret ---------- */
  safe(() => {
    const sec = $("#xcaret"); if (!sec) return;
    const ff = $(".fireflies", sec);
    for (let i = 0; i < 20; i++) {
      const f = document.createElement("i");
      f.style.left = (Math.random() * 100).toFixed(1) + "%";
      f.style.top = (Math.random() * 100).toFixed(1) + "%";
      f.style.animationDuration = (7 + Math.random() * 8).toFixed(1) + "s," + (2 + Math.random() * 3).toFixed(1) + "s";
      f.style.animationDelay = (-Math.random() * 8).toFixed(1) + "s";
      ff.appendChild(f);
    }
    const cards = $$(".xc-card", sec), ring = $("#xcRing"), num = $("#xcNum");
    let last = -1;
    updaters.push(() => {
      const r = near(sec, 0.3); if (!r) return;
      let best = 0, bd = 1e9;
      cards.forEach((c, i) => {
        const cr = c.getBoundingClientRect();
        const d = cr.top + cr.height / 2 - vh / 2;
        if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
        const img = c.querySelector(".xc-card__img img");
        if (img && !reduced) img.style.transform = `translate3d(0,${(clamp(d / vh, -1, 1) * -6).toFixed(2)}%,0)`;
      });
      if (best !== last) {
        last = best;
        ring.style.strokeDashoffset = String(276.5 * (1 - (best + 1) / 4));
        num.textContent = "0" + (best + 1) + "/04";
      }
    });
  }, "xcaret");

  /* ---------- Isla Mujeres: tarjetas que giran ---------- */
  safe(() => {
    $$(".flip__in").forEach((b) => b.addEventListener("click", () => b.classList.toggle("is-flipped")));
  }, "flips");

  /* ---------- Trayecto ---------- */
  const route = { svg: null, path: null, draw: null, len: 0, Ls: [], vb: null, mobile: false };
  function setupRoute() {
    const wrap = $("#routeWrap"); if (!wrap) return;
    const d = $("#routeD"), m = $("#routeM");
    const mobile = getComputedStyle(d).display === "none";
    const svg = mobile ? m : d;
    route.svg = svg; route.mobile = mobile;
    route.path = $(".r-base", svg); route.draw = $(".r-draw", svg);
    route.len = route.path.getTotalLength();
    route.vb = svg.viewBox.baseVal;
    route.draw.style.strokeDasharray = route.len;
    const steps = $$(".step", wrap);
    const wr = wrap.getBoundingClientRect();
    route.Ls = steps.map((st, i) => {
      if (!mobile) return route.len * [0.1, 0.37, 0.63, 0.9][i];
      const sr = st.getBoundingClientRect();
      const yv = ((sr.top + sr.height / 2 - wr.top) / wr.height) * route.vb.height;
      let lo = 0, hi = route.len;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (route.path.getPointAtLength(mid).y < yv) lo = mid; else hi = mid;
      }
      return lo;
    });
    $$(".buoy", wrap).forEach((b, i) => { const p = place(route.Ls[i]); b.style.transform = `translate3d(${p.x}px,${p.y}px,0)`; });
    const gp = place(route.len);
    $("#goal").style.transform = `translate3d(${gp.x}px,${gp.y}px,0)`;
  }
  function place(L) {
    const wrap = $("#routeWrap"), wr = wrap.getBoundingClientRect(), r = route.svg.getBoundingClientRect();
    const pt = route.path.getPointAtLength(clamp(L, 0, route.len));
    return {
      x: r.left - wr.left + (pt.x / route.vb.width) * r.width,
      y: r.top - wr.top + (pt.y / route.vb.height) * r.height,
      pt
    };
  }
  safe(() => {
    const sec = $("#como-reservar"); if (!sec) return;
    const wrap = $("#routeWrap"), boat = $("#boat"), goal = $("#goal");
    const buoys = $$(".buoy", wrap), steps = $$(".step", wrap);
    // Estado inicial seguro: tarjetas visibles
    updaters.push(() => {
      if (!route.svg) return;
      const r = near(sec, 0.3); if (!r) return;
      let p;
      if (!route.mobile && vw >= 900 && !reduced) p = clamp(-r.top / Math.max(1, r.height - vh)) / 0.92;
      else { const wr = wrap.getBoundingClientRect(); p = (vh * 0.7 - wr.top) / wr.height; }
      p = reduced ? 1 : clamp(p);
      const L = p * route.len;
      route.draw.style.strokeDashoffset = String(route.len * (1 - p));
      const pos = place(L), p2 = route.path.getPointAtLength(clamp(L + 2, 0, route.len));
      let ang;
      if (route.mobile) ang = clamp(((p2.x - pos.pt.x) / ((p2.y - pos.pt.y) || 1)) * 14, -14, 14);
      else {
        const rr = route.svg.getBoundingClientRect();
        ang = clamp(Math.atan2((p2.y - pos.pt.y) * (rr.height / route.vb.height), (p2.x - pos.pt.x) * (rr.width / route.vb.width)) * 57.3, -35, 35);
      }
      boat.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${ang.toFixed(1)}deg)`;
      buoys.forEach((b, i) => { const on = L >= route.Ls[i] - 2; b.classList.toggle("on", on); if (steps[i]) steps[i].classList.toggle("on", on); });
      goal.classList.toggle("on", p > 0.985);
    });
  }, "trayecto");

  /* ---------- Galería en parallax ---------- */
  safe(() => {
    const sec = $("#galeria"); if (!sec) return;
    const cols = $$(".gal__col", sec), amps = [60, -60, 45];
    updaters.push(() => {
      if (vw < 900 || reduced) { cols.forEach((c) => c.style.removeProperty("--shift")); return; }
      const r = near(sec, 0.3); if (!r) return;
      const d = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      cols.forEach((c, i) => c.style.setProperty("--shift", (d * amps[i % 3]).toFixed(1) + "px"));
    });
  }, "galeria");

  /* ---------- FAQ animado ---------- */
  safe(() => {
    $$(".qa").forEach((d) => {
      d.classList.add("js-acc");
      let timer = 0;
      $("summary", d).addEventListener("click", (e) => {
        e.preventDefault();
        clearTimeout(timer);
        if (d.open && d.classList.contains("is-open")) {
          d.classList.remove("is-open");
          timer = setTimeout(() => { d.open = false; }, 520);
        } else {
          d.open = true;
          requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("is-open")));
        }
      });
    });
  }, "faq");

  /* ---------- Contacto: sol que se hunde ---------- */
  safe(() => {
    const sec = $("#reservar"), sun = $("#csun"); if (!sec || !sun) return;
    updaters.push(() => {
      const r = near(sec, 0.3); if (!r) return;
      const p = clamp((vh - r.top) / (r.height + vh));
      sun.style.transform = `translate3d(0,${(clamp((p - 0.35) / 0.65) * 38).toFixed(1)}%,0)`;
    });
  }, "sol");

  /* ---------- Formulario boleto ---------- */
  safe(() => {
    const form = $("#form"); if (!form) return;
    const fTour = $("#fTour"), fN = $("#fN"), fNombre = $("#fNombre"), fFecha = $("#fFecha"), fNotas = $("#fNotas"), err = $("#fErr");
    const sTour = $("#sTour"), sPrecio = $("#sPrecio"), sTotal = $("#sTotal");
    let n = 2;
    function refresh() {
      const t = TOURS[fTour.value];
      fN.textContent = n;
      sTour.textContent = t.nombre;
      if (t.precio) { sPrecio.textContent = money(t.precio) + " MXN"; sTotal.textContent = money(t.precio * n) + " MXN"; }
      else { sPrecio.textContent = "Cotiza por WhatsApp"; sTotal.textContent = "Cotización por WhatsApp"; }
      sTotal.style.fontSize = t.precio ? "" : "1.4rem";
    }
    $("#fMenos").addEventListener("click", () => { n = Math.max(1, n - 1); refresh(); });
    $("#fMas").addEventListener("click", () => { n = Math.min(20, n + 1); refresh(); });
    fTour.addEventListener("change", refresh);
    fNombre.addEventListener("input", () => { err.hidden = true; });
    refresh();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = fNombre.value.trim();
      if (!nombre) { err.hidden = false; fNombre.focus(); return; }
      if (!hasWA) return;
      const t = TOURS[fTour.value];
      let fecha = "";
      if (fFecha.value) { const [y, m, d] = fFecha.value.split("-"); fecha = ` para el ${d}/${m}/${y}`; }
      const notas = fNotas.value.trim();
      const verbo = t.precio ? "reservar" : "cotizar";
      const msg = `Hola, amigo 👋 Soy ${nombre}. Quiero ${verbo} ${t.nombre} para ${n} persona${n > 1 ? "s" : ""}${fecha}.${notas ? " " + notas : ""}`;
      window.open(waUrl(msg), "_blank", "noopener");
    });
  }, "formulario");

  /* ---------- Botón flotante: burbuja ---------- */
  safe(() => {
    const b = $("#waBubble"); if (!b || !hasWA) return;
    const show = () => { b.classList.add("show"); setTimeout(() => b.classList.remove("show"), 6000); };
    setTimeout(show, 4000);
    setInterval(show, 25000);
  }, "burbuja");

  /* ---------- Visor ---------- */
  safe(() => {
    const dlg = $("#viewer"); if (!dlg) return;
    const img = $("#vImg"), cap = $("#vCap"), cta = $("#vCta"), inner = $("#viewerIn");
    let idx = 0, opener = null, tx = 0;
    function show(i) {
      idx = (i + ORDEN.length) % ORDEN.length;
      const it = VISOR[ORDEN[idx]];
      img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
      img.src = it.src; img.alt = it.alt; cap.textContent = it.cap;
      if (hasWA && it.tour) {
        cta.hidden = false;
        cta.href = waUrl(`Hola, amigo 👋 Quiero este tour: ${TOURS[it.tour].nombre}. ¿Qué días hay lugar?`);
      } else cta.hidden = true;
    }
    function open(id, from) {
      opener = from; show(ORDEN.indexOf(id));
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      if (lenis) lenis.stop();
    }
    function close() { if (dlg.open) dlg.close(); }
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-view]");
      if (t && VISOR[t.dataset.view]) open(t.dataset.view, t);
    });
    $("#vX").addEventListener("click", close);
    $("#vP").addEventListener("click", () => show(idx - 1));
    $("#vN").addEventListener("click", () => show(idx + 1));
    inner.addEventListener("click", (e) => { if (!e.target.closest("img,button,a,figcaption")) close(); });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener("close", () => { if (lenis) lenis.start(); if (opener && opener.focus) opener.focus(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    dlg.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }, "visor");

  /* ---------- Cursor «sol» ---------- */
  safe(() => {
    const c = $("#cursor");
    if (!c || !finePointer || reduced) return;
    let tx = -100, ty = -100, x = -100, y = -100;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; c.classList.add("is-on"); }, { passive: true });
    document.addEventListener("pointerover", (e) => { c.classList.toggle("is-big", !!e.target.closest(".btn:not(.nav__cta)")); });
    document.addEventListener("pointerleave", () => c.classList.remove("is-on"));
    loops.push(() => {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      c.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
  }, "cursor");

  /* ---------- Scroll global ---------- */
  const nav = $("#nav"), dusk = $("#dusk"), emb = $("#emb"), heroSun = $("#heroSun");
  let lastSp = -1;
  function globalUpdate(y) {
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const sp = clamp(y / max);
    if (Math.abs(sp - lastSp) > 0.0003) {
      lastSp = sp;
      root.style.setProperty("--sp", sp.toFixed(4));
      dusk.style.opacity = clamp((sp - 0.78) / 0.18).toFixed(3);
    }
    nav.classList.toggle("is-solid", y > 40);
    if (!reduced && y < vh * 1.3) {
      if (emb) emb.style.transform = `translate3d(0,${(y * 0.12).toFixed(1)}px,0) scale(${(1 - 0.08 * clamp(y / vh)).toFixed(3)})`;
      if (heroSun) heroSun.style.transform = `translate3d(0,${(y * 0.25).toFixed(1)}px,0)`;
    }
  }

  /* ---------- Revelado con respaldo por geometría ---------- */
  const pending = new Set($$("[data-reveal],[data-curtain]"));
  function reveal(el) { el.classList.add("is-in"); pending.delete(el); }
  safe(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((en) => {
      en.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    pending.forEach((el) => io.observe(el));
  }, "revelado");
  function revealGeometry(all) {
    pending.forEach((el) => {
      if (all) return reveal(el);
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) reveal(el);
    });
  }
  window.addEventListener("load", () => setTimeout(() => revealGeometry(false), 2000));
  setTimeout(() => revealGeometry(true), 9000); // red de seguridad final

  /* ---------- Bucle único + resize ---------- */
  function runUpdaters(y) {
    globalUpdate(y);
    for (const f of updaters) { try { f(y); } catch (e) { /* un módulo no rompe a los demás */ } }
    if (pending.size) revealGeometry(false);
  }
  function frame(t) {
    if (lenis) lenis.raf(t);
    const y = window.scrollY || window.pageYOffset;
    if (y !== lastY || dirty) {
      velocity = y - (lastY < 0 ? y : lastY);
      lastY = y; dirty = false;
      runUpdaters(y);
    }
    for (const f of loops) { try { f(t); } catch (e) { /* idem */ } }
    requestAnimationFrame(frame);
  }
  let rt = 0;
  function onResize() {
    vh = innerHeight; vw = innerWidth;
    safe(setupTours, "setupTours");
    safe(setupRoute, "setupRoute");
    dirty = true;
  }
  window.addEventListener("resize", () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(onResize); });
  window.addEventListener("load", onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  onResize();
  requestAnimationFrame(frame);
})();
