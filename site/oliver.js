(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const isMobile = () => innerWidth <= 900;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const inView = el => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height)); };
  const sticky = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };

  /* ---------- floaters: 3D marble cubes, leaves and flow lines on every section ---------- */
  const T = { W: 'assets/oliver/tex-marble-white.jpg', D: 'assets/oliver/tex-marble-dark.jpg', D2: 'assets/oliver/tex-marble-dark-2.jpg', N: 'assets/oliver/tex-walnut.jpg' };
  const C = (x, y, s, t, d, extra = {}) => ({ k: 'c', x, y, s, t, d, ...extra });
  const L = (x, y, s, r, d, extra = {}) => ({ k: 'l', x, y, s, r, d, ...extra });
  const layouts = {
    hero: [
      C(5, 60, 54, 'D', .9), C(11, 80, 72, 'D2', 1.2, { a: .1 }), C(3, 38, 30, 'W', .5), C(41, 74, 46, 'D', 1, { a: .22 }),
      C(49, 26, 24, 'D', .45), C(64, 70, 58, 'W', 1.1, { a: .3 }), C(90, 46, 40, 'W', .8, { a: .05 }), C(80, 80, 96, 'W', 1.4, { a: .36, blur: 1 }),
      C(30, 90, 40, 'N', 1.3, { a: .18 }), C(93, 14, 30, 'D', .4), C(58, 88, 28, 'D2', 1, { a: .42 }), C(20, 16, 22, 'W', .6, { a: .26 }),
      L(37, 80, 46, -20, 1.1, { a: .12 }), L(50, 46, 36, 30, .7), L(95, 62, 54, -10, 1.3, { blur: 1, a: .2 }), L(16, 28, 30, 40, .6, { a: .3 }),
      L(55, 10, 28, -30, .5), L(26, 60, 34, 160, .9, { a: .4 })
    ],
    journey: [C(3, 12, 56, 'W', 1), C(46, 30, 26, 'D', .6), C(94, 22, 40, 'D2', .9), C(90, 78, 80, 'W', 1.3, { blur: 1 }), C(6, 88, 36, 'N', .8), C(52, 92, 30, 'D', 1.1),
      L(40, 8, 40, 20, .9), L(96, 50, 46, -30, 1.1), L(4, 56, 34, 50, .7), L(60, 70, 30, -10, .6)],
    projects: [C(2, 8, 50, 'W', .9), C(94, 14, 34, 'D', .7), L(88, 4, 46, -20, 1), L(6, 90, 40, 30, .8), C(90, 88, 64, 'W', 1.2, { blur: 1 }), C(40, 4, 26, 'D2', .5), L(60, 94, 36, 10, .9)],
    amb: [C(3, 20, 60, 'D2', 1), C(94, 10, 44, 'W', .8), L(8, 70, 50, -30, 1.1), L(92, 60, 40, 20, .9), C(84, 86, 30, 'D', .6), C(20, 90, 36, 'W', .9), L(50, 6, 34, 40, .7)],
    profile: [C(2, 30, 44, 'W', .9), C(48, 6, 28, 'D', .6), L(4, 80, 44, 30, 1), L(96, 10, 36, -20, .8), C(95, 90, 56, 'D2', 1.1)],
    about: [C(92, 6, 48, 'W', 1), C(46, 40, 34, 'D2', .7), L(90, 30, 50, -20, 1.2), L(40, 4, 30, 40, .6), C(4, 50, 40, 'W', .9), L(6, 76, 44, 10, 1), C(94, 70, 70, 'W', 1.3, { blur: 1 }), L(60, 96, 38, -40, .8), C(30, 94, 30, 'N', .7)],
    footer: [L(6, 30, 60, -20, 1, { blur: 1 }), L(88, 12, 40, 30, .8), C(94, 60, 44, 'W', .9), C(40, 8, 26, 'D2', .6)]
  };
  const flows = {
    journey: ['M-20 180C200 120 320 260 520 220S860 80 1060 150 1300 260 1460 200', 'M1100 760C1200 720 1260 660 1330 600', 'M90 620C160 560 220 600 260 540'],
    projects: ['M-20 120C240 60 420 180 700 130S1100 40 1460 110', 'M1200 900C1260 840 1320 820 1380 760'],
    amb: ['M-20 800C260 700 520 860 760 780S1200 640 1460 720', 'M120 120C180 80 240 110 300 70'],
    profile: ['M-20 700C200 640 360 740 560 690S900 560 1100 620 1300 700 1460 640', 'M1180 120C1240 90 1290 100 1340 60'],
    about: ['M-20 300C220 220 380 360 620 300S1000 160 1460 240', 'M100 1500C200 1420 280 1480 360 1400', 'M1100 1100C1180 1060 1240 1080 1320 1020'],
    footer: ['M-20 200C300 120 600 260 900 180S1300 100 1460 160']
  };
  const floaters = [];
  $$('[data-floaters]').forEach(layer => {
    const key = layer.dataset.floaters;
    const host = layer.closest('section, footer');
    if (flows[key]) {
      const dark = host.dataset.theme === 'dark';
      const svg = `<svg class="flow-lines lite${dark ? ' on-dark' : ''}" viewBox="0 0 1440 ${key === 'about' ? 1600 : 900}" preserveAspectRatio="none"><defs><marker id="ah-${key}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10" fill="none" stroke="currentColor" stroke-width="1.4"/></marker></defs>${flows[key].map((d, i) => `<path class="flow" d="${d}" ${i ? `marker-end="url(#ah-${key})"` : ''}/>`).join('')}</svg>`;
      layer.insertAdjacentHTML('beforeend', svg);
    }
    (layouts[key] || []).forEach((f, i) => {
      if (isMobile() && f.s > 60) f.s *= .7;
      if (isMobile() && i % 3 === 2) return;
      const el = document.createElement('div');
      el.style.setProperty('--x', f.x + '%'); el.style.setProperty('--y', f.y + '%'); el.style.setProperty('--s', f.s + 'px');
      if (f.k === 'c') {
        el.className = 'cube-wrap' + (f.blur ? ' blur' : '');
        el.style.setProperty('--tex', `url(${T[f.t]})`);
        const cube = document.createElement('div');
        cube.className = 'cube'; cube.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
        el.append(cube);
        f.rx = 20 + Math.random() * 40; f.ry = Math.random() * 360; f.rz = Math.random() * 30;
        f.spin = (Math.random() * .5 + .25) * (Math.random() > .5 ? 1 : -1); f.cube = cube;
      } else {
        el.className = 'leaf-wrap' + (f.blur ? ' blur' : '');
        el.style.setProperty('--r', f.r + 'deg');
        el.style.setProperty('--dur', (5 + Math.random() * 4).toFixed(1) + 's');
        el.innerHTML = '<svg viewBox="0 0 60 30"><use href="#i-leaf"/></svg>';
        f.drift = Math.random() * Math.PI * 2;
      }
      f.el = el; f.host = host; f.key = key;
      layer.append(el); floaters.push(f);
    });
  });
  $$('.flow').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch {} });
  const fio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); fio.unobserve(e.target); } }), { threshold: .1 });
  $$('.flow-lines.lite, .blueprint').forEach(s => fio.observe(s));

  /* ---------- pointer ---------- */
  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  /* ---------- scroll choreography ---------- */
  const header = $('[data-header]'), hud = $('#scroll-depth');
  const hero = $('#inicio');
  const heroCopy = $('.hero-copy'), heroCards = $$('[data-hero-card]'), heroDots = $('.hero-dots'), cue = $('.scroll-cue');
  const depthEls = $$('.hero [data-depth]'), tower = $('.hero .tower');
  const themed = $$('[data-theme]');
  const railLinks = $$('.rail a'), navLinks = $$('.main-nav a');
  const sectionsFor = railLinks.map(a => $(a.getAttribute('href')));
  const timeline = $('[data-timeline]'), marcos = timeline ? $$('.marco', timeline) : [];
  const fill = timeline && $('.cheio', timeline), stepOut = $('#journey-step'), stepBar = $('#journey-bar');
  const build = $('[data-build]'), buildFrames = $('.build-frames'), buildPct = $('#build-pct'), buildSteps = build ? $$('.build-steps li', build) : [];
  let heroP = 0;

  const scenes = Array.from({ length: 9 }, (_, i) => `assets/construction-realistic/scene-0${i + 1}.webp`);
  if (buildFrames) buildFrames.innerHTML = scenes.map((s, i) => `<img src="${s}" alt="" loading="lazy" style="opacity:${i ? 0 : 1}">`).join('');
  const frameImgs = buildFrames ? $$('img', buildFrames) : [];

  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    hud.textContent = Math.round(max > 0 ? y / max * 100 : 0) + '%';
    header.classList.toggle('scrolled', y > 20);

    const probe = py => { for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= py && r.bottom > py) return s.dataset.theme; } return 'light'; };
    header.classList.toggle('dark', probe(36) === 'dark');
    document.body.classList.toggle('on-dark', probe(innerHeight / 2) === 'dark');

    let current = 0;
    sectionsFor.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .5) current = i; });
    railLinks.forEach((a, i) => a.classList.toggle('on', i === current));
    const id = railLinks[current]?.getAttribute('href');
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));

    // timeline that draws itself as you scroll
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const line = innerHeight * .6 - r.top;
      const trilho = $('.trilho', timeline);
      const k = clamp((line - trilho.offsetTop) / trilho.offsetHeight);
      fill.style.height = (reduced ? 100 : k * 100) + '%';
      let lit = 0;
      marcos.forEach(m => { const on = reduced || m.offsetTop + 14 < line; m.classList.toggle('aceso', on); if (on) lit++; });
      stepOut.textContent = String(Math.max(1, lit)).padStart(2, '0');
      stepBar.style.width = Math.max(1, lit) / 5 * 100 + '%';
    }

    // building rises with the scroll
    if (build) {
      const p = clamp((innerHeight * .8 - build.getBoundingClientRect().top) / (build.offsetHeight + innerHeight * .2));
      const f = p * (frameImgs.length - 1);
      frameImgs.forEach((img, i) => { img.style.opacity = i === 0 ? 1 : clamp(1 - Math.abs(f - i) + (f > i ? 1 : 0)); });
      buildPct.textContent = Math.round(p * 100) + '%';
      buildSteps.forEach((li, i) => li.classList.toggle('on', p >= i / buildSteps.length));
    }

    if (reduced) { heroCards.forEach(c => c.style.opacity = 1); return; }

    heroP = sticky(hero);
    const hp = heroP;
    heroCopy.style.transform = isMobile() ? `translateY(${-hp * 80}px)` : `translateY(calc(-50% - ${hp * 190}px))`;
    heroCopy.style.opacity = 1 - clamp((hp - .5) * 2.4);
    const k = isMobile() ? 110 : 520;
    depthEls.forEach(el => { el.style.transform = `translateY(${-hp * parseFloat(el.dataset.depth) * k}px)`; });
    if (tower) tower.style.transform = `translateY(${-hp * (isMobile() ? 40 : 120)}px) scale(${1 + hp * .05})`;
    heroCards.forEach(c => {
      const start = { 1: .18, 2: .34, 3: .1 }[c.dataset.heroCard];
      const t = clamp((hp - start) / .2);
      c.style.opacity = t;
      c.style.transform = `translateY(${(1 - t) * 70 - hp * 60}px) scale(${.94 + t * .06})`;
    });
    heroDots.style.opacity = clamp((hp - .25) * 4);
    cue.style.opacity = 1 - clamp(hp * 6);
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- floaters loop ---------- */
  const visible = new Set();
  const io = new IntersectionObserver(entries => entries.forEach(en => en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)), { rootMargin: '200px' });
  new Set(floaters.map(f => f.host)).forEach(h => io.observe(h));
  function frameLoop(t) {
    smx = lerp(smx, mx, .06); smy = lerp(smy, my, .06);
    const time = t / 1000;
    for (const f of floaters) {
      if (!visible.has(f.host)) continue;
      let tx = -smx * 26 * f.d, ty = -smy * 20 * f.d, op = 1, p;
      if (f.key === 'hero') {
        p = heroP;
        tx += (f.x - 50) / 50 * p * 140 * f.d;
        ty += -p * 360 * f.d;
        if (f.a) op = clamp((p - f.a) / .12 + (f.a < .06 ? 1 : 0));
      } else {
        p = inView(f.host);
        ty += (.5 - p) * (f.key === 'about' ? 900 : 420) * f.d;
      }
      if (f.k === 'l') {
        tx += Math.sin(time * .6 + f.drift) * 14 * f.d;
        ty += Math.cos(time * .5 + f.drift) * 10 * f.d;
        f.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${(p * 120 * f.d).toFixed(1)}deg)`;
      } else {
        ty += Math.sin(time * .8 + f.ry) * 6;
        f.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`;
        const rx = f.rx + p * 160 * f.d + smy * 12, ry = f.ry + time * 12 * f.spin + p * 220 * f.d + smx * 16;
        f.cube.style.transform = `rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${f.rz}deg)`;
      }
      f.el.style.opacity = op;
    }
    requestAnimationFrame(frameLoop);
  }
  if (!reduced) requestAnimationFrame(frameLoop);
  else floaters.forEach(f => { if (f.cube) f.cube.style.transform = `rotateX(${f.rx}deg) rotateY(${f.ry}deg)`; });

  /* ---------- reveal + counters ---------- */
  const rio = new IntersectionObserver(entries => entries.forEach(en => { if (!en.isIntersecting) return; en.target.classList.add('in-view'); rio.unobserve(en.target); }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .reveal-up').forEach(el => { if (!el.closest('.hero')) rio.observe(el); });
  const cio = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, to = Number(el.dataset.count); cio.unobserve(el);
    if (reduced) return;
    const t0 = performance.now();
    const step = now => { const k = clamp((now - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- mobile menu ---------- */
  const toggle = $('.menu-toggle'), menu = $('#mobile-menu');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); menu.hidden = true; document.body.style.overflow = ''; } });

  /* ---------- projects carousel with depth ---------- */
  const track = $('.projects');
  const cards = $$('.project', track);
  const counter = $('#car-counter'), prog = $('#car-progress');
  const visibleCards = () => cards.filter(c => !c.hidden);
  function syncCounter() {
    const vis = visibleCards(); if (!vis.length) return;
    const w = vis[0].offsetWidth + 26;
    const i = Math.min(vis.length - 1, Math.round(track.scrollLeft / w));
    counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(vis.length).padStart(2, '0')}`;
    const maxS = track.scrollWidth - track.clientWidth;
    prog.style.width = (maxS > 0 ? (track.scrollLeft / maxS) * 100 : 100) + '%';
    const box = track.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    vis.forEach(c => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--depth', clamp(Math.abs(r.left + r.width / 2 - mid) / (box.width * .75)).toFixed(3));
      c.style.setProperty('--side', Math.sign(r.left + r.width / 2 - mid));
    });
  }
  track.addEventListener('scroll', () => requestAnimationFrame(syncCounter), { passive: true });
  addEventListener('resize', syncCounter);
  $$('[data-step]').forEach(b => b.addEventListener('click', () => {
    const w = (visibleCards()[0]?.offsetWidth || 300) + 26;
    track.scrollBy({ left: Number(b.dataset.step) * w, behavior: reduced ? 'auto' : 'smooth' });
  }));
  function applyFilter(key) {
    $$('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filter === key)));
    cards.forEach(c => c.hidden = key !== 'all' && c.dataset.region !== key);
    track.scrollTo({ left: 0 });
    const n = visibleCards().length;
    $('#project-count').textContent = `${n} projeto${n > 1 ? 's' : ''} na seleção`;
    requestAnimationFrame(syncCounter);
  }
  window.OliverFilter = applyFilter;
  $$('[data-filter]').forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
  $$('[data-filter-link]').forEach(a => a.addEventListener('click', () => applyFilter(a.dataset.filterLink)));
  syncCounter();

  if (finePointer && !reduced) cards.forEach(card => {
    const tilt = $('.p-tilt', card);
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 10}deg) translateZ(30px)`;
      tilt.style.setProperty('--gx', (px + .5) * 100 + '%'); tilt.style.setProperty('--gy', (py + .5) * 100 + '%');
      tilt.style.setProperty('--px', px.toFixed(3)); tilt.style.setProperty('--py', py.toFixed(3));
      card.classList.add('tilting');
    });
    card.addEventListener('pointerleave', () => { tilt.style.transform = ''; tilt.style.setProperty('--px', 0); tilt.style.setProperty('--py', 0); card.classList.remove('tilting'); });
  });

  const favs = new Set(store.get('oliver-favs') || []);
  $$('.fav').forEach(btn => {
    const id = btn.closest('.project').dataset.project;
    btn.setAttribute('aria-pressed', String(favs.has(id)));
    btn.addEventListener('click', e => {
      e.stopPropagation();
      favs.has(id) ? favs.delete(id) : favs.add(id);
      btn.setAttribute('aria-pressed', String(favs.has(id)));
      store.set('oliver-favs', [...favs]);
    });
  });

  /* ---------- coverflow (dark + neon ambilight) ---------- */
  const scenesAmb = [
    ['assets/gallery/0-1.jpg', 'Living', 0], ['assets/books/conx-mooca/02.jpg', 'Living', 10],
    ['assets/gallery/0-0.jpg', 'Salão de festas', 0], ['assets/books/plazas-madrid/01.jpg', 'Cozinha gourmet', 32],
    ['assets/books/hug-vitality/04.jpg', 'Espaço gourmet', 17], ['assets/gallery/6-page-8-0.jpg', 'Lounge', 6],
    ['assets/books/merito-lapa/03.jpg', 'Brinquedoteca', 22], ['assets/gallery/4-1.jpg', 'Coworking', 4],
    ['assets/books/gran-arena/05.jpg', 'Living decorado', 16], ['assets/gallery/3-0.jpg', 'Piscina com raia', 3]
  ];
  const cfTrack = $('.cf-track'), cfDots = $('[data-dots="cf"]'), cfTitle = $('#cf-title');
  const projName = id => (window.OLIVER_CATALOG || []).find(p => p.id === id)?.name || '';
  let cf = 0;
  const items = scenesAmb.map(([src, label, pid], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cf-item';
    b.innerHTML = `<span class="cf-glow" style="background-image:url('${src}')"></span><span class="cf-frame"><img src="${src}" alt="${label} — ${projName(pid)}" loading="lazy"></span><span class="cf-label">${label} · ${projName(pid)}</span>`;
    b.addEventListener('click', () => { if (i === cf) document.querySelector(`.project [data-open-project="${pid}"]`)?.click(); else setCf(i); });
    cfTrack.append(b); cfDots.append(document.createElement('i'));
    return b;
  });
  function setCf(i) {
    const n = items.length; cf = (i + n) % n;
    items.forEach((el, k) => {
      let o = k - cf; if (o > n / 2) o -= n; if (o < -n / 2) o += n;
      el.style.setProperty('--o', o); el.style.setProperty('--a', Math.abs(o));
      el.classList.toggle('center', o === 0); el.toggleAttribute('data-far', Math.abs(o) > 2);
      el.tabIndex = Math.abs(o) > 1 ? -1 : 0;
    });
    [...cfDots.children].forEach((d, k) => d.classList.toggle('on', k === cf));
    cfTitle.textContent = `${scenesAmb[cf][1]} · ${projName(scenesAmb[cf][2])}`;
  }
  let pauseCf = false, cfVisible = false, sx = null;
  const cfEl = $('.coverflow');
  $$('[data-cf]').forEach(b => b.addEventListener('click', () => { setCf(cf + Number(b.dataset.cf)); pauseCf = true; }));
  new IntersectionObserver(e => { cfVisible = e[0].isIntersecting; }).observe(cfEl);
  cfEl.addEventListener('pointerenter', () => pauseCf = true);
  cfEl.addEventListener('pointerleave', () => pauseCf = false);
  cfEl.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  cfEl.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) setCf(cf + (dx < 0 ? 1 : -1)); sx = null; }, { passive: true });
  if (!reduced) setInterval(() => { if (cfVisible && !pauseCf && !document.hidden) setCf(cf + 1); }, 4800);
  setCf(0);

  /* ---------- footer quick start ---------- */
  $('[data-quick]').addEventListener('submit', e => {
    e.preventDefault();
    const form = $('#lead-profile');
    const name = e.currentTarget.elements.nome.value.trim();
    if (name) form.elements.nome.value = name;
    $('#perfil').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => (name ? form.elements.objetivo : form.elements.nome).focus({ preventScroll: true }), reduced ? 0 : 700);
  });
})();
