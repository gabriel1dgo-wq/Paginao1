(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const section = document.querySelector('#mapa');
  const status = document.querySelector('#map-status');
  const container = document.querySelector('#city-map');
  const intro = document.querySelector('.map-intro');
  const ui = document.querySelector('.map-ui');
  const tools = document.querySelector('.map-tools');
  const progress = [...document.querySelectorAll('.map-progress i')];
  const catalog = window.OLIVER_CATALOG || [];
  const clientes = window.OLIVER_CLIENTES || [];
  const mobile = () => innerWidth < 700;

  const regions = {
    oeste: { name: 'Zona Oeste', center: [-46.692, -23.522], zoom: 13.5, bearing: -24, description: 'Lapa, Barra Funda, Perdizes e Água Branca: metrô, trem e parques perto de casa.' },
    leste: { name: 'Zona Leste', center: [-46.556, -23.540], zoom: 13, bearing: 16, description: 'Tatuapé, Mooca, Carrão e Penha: do studio ao alto padrão, perto do metrô.' },
    itaquera: { name: 'Itaquera e extremo leste', center: [-46.466, -23.566], zoom: 12.6, bearing: -12, description: 'Itaquera, Parque do Carmo, Guaianases e São Mateus: condomínios-clube para sair do aluguel.' },
    sudeste: { name: 'Ipiranga e Vila Prudente', center: [-46.588, -23.594], zoom: 13.2, bearing: 22, description: 'Ipiranga, Vila Prudente e Vila Ema: Linha Verde e monotrilho na porta.' }
  };
  const keys = Object.keys(regions);
  const overview = { center: [-46.585, -23.552], zoom: mobile() ? 9.9 : 10.8, pitch: 0, bearing: 0 };
  const pins = new Map();
  let map = null, ready = false, selected = 'oeste', userMoved = false, lastIdx = -1, visible = false;

  /* ---------- side panel ---------- */
  function renderRegion(key) {
    const r = regions[key];
    document.querySelector('#district-title').textContent = r.name;
    document.querySelector('#district-description').textContent = r.description;
    const list = document.querySelector('#district-projects');
    const items = catalog.filter(p => p.region === key);
    document.querySelector('#map-title').textContent = `${items.length} empreendimentos nesta região`;
    list.replaceChildren();
    items.forEach(p => {
      const row = document.createElement('div');
      row.className = 'gm-item'; row.dataset.pid = p.id;
      row.innerHTML = `<img src="${p.cover}" alt="" loading="lazy"><div><strong>${p.name}</strong><span>${p.bairro} · ${p.area}</span><div class="gm-actions"><button type="button" data-go>Ver no mapa</button><button type="button" data-gallery>Galeria</button></div></div>`;
      row.querySelector('[data-go]').addEventListener('click', () => focusProject(p.id));
      row.querySelector('[data-gallery]').addEventListener('click', () => document.querySelector(`.project [data-open-project="${p.id}"]`)?.click());
      row.addEventListener('mouseenter', () => pins.get(p.id)?.classList.add('hover'));
      row.addEventListener('mouseleave', () => pins.get(p.id)?.classList.remove('hover'));
      list.append(row);
    });
    document.querySelectorAll('[data-district]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.district === key)));
    progress.forEach((d, i) => d.classList.toggle('on', i === keys.indexOf(key)));
  }
  function focusRegion(key, fly = true) {
    if (!regions[key]) return;
    selected = key;
    renderRegion(key);
    if (map && ready && fly) {
      const r = regions[key];
      map.flyTo({ center: r.center, zoom: mobile() ? r.zoom - .8 : r.zoom, pitch: 55, bearing: r.bearing, duration: reduced ? 0 : 2200, essential: true });
    }
  }
  function focusProject(id) {
    const p = catalog.find(x => x.id === id);
    if (!p) return;
    if (p.region !== selected) { selected = p.region; renderRegion(p.region); }
    userMoved = true;
    pins.forEach((el, k) => el.classList.toggle('selected', k === id));
    document.querySelectorAll('.gm-item').forEach(el => el.classList.toggle('on', Number(el.dataset.pid) === id));
    document.querySelector(`.gm-item[data-pid="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    if (map && ready) map.flyTo({ center: p.ll, zoom: 16, pitch: 60, duration: reduced ? 0 : 1800, essential: true });
  }
  document.querySelectorAll('[data-district]').forEach(b => b.addEventListener('click', () => { userMoved = true; focusRegion(b.dataset.district); }));
  renderRegion(selected);

  /* ---------- search ---------- */
  const search = document.querySelector('#map-search');
  const dl = document.querySelector('#map-suggest');
  const bairros = [...new Set(catalog.map(p => p.bairro))];
  [...catalog.map(p => p.name), ...bairros].forEach(v => { const o = document.createElement('option'); o.value = v; dl.append(o); });
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function runSearch() {
    const q = norm(search.value.trim()); if (q.length < 2) return;
    const p = catalog.find(x => norm(x.name) === q) || catalog.find(x => norm(x.name).includes(q)) || catalog.find(x => norm(x.bairro).includes(q));
    if (p) focusProject(p.id);
  }
  search.addEventListener('change', runSearch);
  search.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });

  /* ---------- Google-like light style ---------- */
  function lightStyle(style) {
    style.layers = style.layers.filter(l => l.type !== 'fill-extrusion');
    style.layers.forEach(l => {
      l.paint = l.paint || {}; l.layout = l.layout || {};
      if (l.type === 'symbol' && /poi|housenumber/.test(l.id)) l.layout.visibility = 'none';
      if (l.type === 'background') l.paint['background-color'] = '#f3f1ec';
      if (l.type === 'fill' && /water/.test(l.id)) l.paint['fill-color'] = '#aadaff';
      if (l.type === 'fill' && /park|wood|grass|forest|landcover/.test(l.id)) l.paint['fill-color'] = '#c8e6c0';
    });
    return style;
  }
  function addLayers() {
    map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: .35, position: [1.3, 210, 40] });
    map.addLayer({
      id: 'oliver-buildings', source: 'openmaptiles', 'source-layer': 'building', type: 'fill-extrusion', minzoom: 13,
      paint: {
        'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, '#e6e2da', 40, '#dcd8cf', 120, '#cfd4da'],
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.4, ['coalesce', ['get', 'render_height'], 6]],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': .92, 'fill-extrusion-vertical-gradient': true
      }
    });
    catalog.forEach(p => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'gm-pin';
      el.setAttribute('aria-label', `${p.name}, ${p.bairro}`);
      el.innerHTML = `<span class="gm-pin-card"><img src="${p.cover}" alt=""><span><b>${p.name}</b><i>${p.area}</i></span></span><span class="gm-pin-tip"></span>`;
      el.addEventListener('click', e => { e.stopPropagation(); focusProject(p.id); });
      pins.set(p.id, el);
      new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(p.ll).addTo(map);
    });
    clientes.forEach(c => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'gm-client';
      el.setAttribute('aria-label', `${c.titulo} em ${c.bairro}`);
      el.innerHTML = `<span class="ring"></span><img src="${c.foto}" alt="">`;
      el.addEventListener('click', e => { e.stopPropagation(); showProof(c); });
      new maplibregl.Marker({ element: el }).setLngLat(c.ll).addTo(map);
    });
    const updateScale = () => { const z = map.getZoom(); container.classList.toggle('far', z < 12.4); container.classList.toggle('mid', z >= 12.4 && z < 14.8); };
    map.on('zoom', updateScale); updateScale();
  }
  function showProof(c) {
    const box = document.querySelector('#map-proof');
    if (!c) return;
    box.hidden = false;
    document.querySelector('#proof-img').src = c.foto;
    document.querySelector('#proof-title').textContent = c.titulo;
    document.querySelector('#proof-detail').textContent = `${c.detalhe} · ${c.bairro}`;
  }
  if (clientes[0]) showProof(clientes[0]);

  async function init() {
    if (map) return;
    if (!window.maplibregl) { status.textContent = 'O mapa não carregou. Explore os empreendimentos logo abaixo.'; return; }
    let style = 'https://tiles.openfreemap.org/styles/liberty';
    try { const res = await fetch(style); if (res.ok) style = lightStyle(await res.json()); } catch {}
    try {
      map = new maplibregl.Map({
        container, style, ...overview,
        maxBounds: [[-46.95, -23.80], [-46.30, -23.35]], minZoom: 9.5, maxZoom: 18, maxPitch: 70,
        attributionControl: { compact: true }, cooperativeGestures: true
      });
      map.on('load', () => { ready = true; status.hidden = true; container.classList.add('ready'); addLayers(); onScroll(); });
      ['dragstart', 'rotatestart', 'pitchstart'].forEach(ev => map.on(ev, e => { if (e.originalEvent) userMoved = true; }));
      map.on('zoomstart', e => { if (e.originalEvent) userMoved = true; });
      map.on('error', () => { if (!ready) { status.hidden = false; status.textContent = 'Mapa indisponível no momento. Os empreendimentos continuam logo abaixo.'; } });
    } catch { status.textContent = 'Seu navegador não exibiu o mapa. Os empreendimentos continuam logo abaixo.'; }
  }

  tools.addEventListener('click', e => {
    const b = e.target.closest('[data-map-action]');
    if (!b || !map || !ready) return;
    userMoved = true;
    const a = b.dataset.mapAction, d = reduced ? 0 : 600;
    if (a === 'in') map.easeTo({ zoom: map.getZoom() + 1, duration: d });
    if (a === 'out') map.easeTo({ zoom: map.getZoom() - 1, duration: d });
    if (a === 'rotate') map.easeTo({ bearing: map.getBearing() + 45, duration: d });
    if (a === 'pitch') map.easeTo({ pitch: map.getPitch() > 20 ? 0 : 58, duration: d });
  });

  /* ---------- scroll: city overview → tilt → region tour ---------- */
  function onScroll() {
    const r = section.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    intro.style.opacity = reduced ? 0 : 1 - clamp((p - .04) / .1);
    intro.style.transform = `translate(-50%, calc(-50% - ${p * 200}px))`;
    ui.style.opacity = reduced ? 1 : clamp((p - .08) / .1);
    ui.classList.toggle('live', reduced || p > .12);
    if (!map || !ready || reduced || userMoved) return;
    if (p < .2) {
      const t = clamp(p / .2), e = t * t * (3 - 2 * t);
      const reg = regions.oeste;
      map.jumpTo({
        center: [lerp(overview.center[0], reg.center[0], e), lerp(overview.center[1], reg.center[1], e)],
        zoom: lerp(overview.zoom, mobile() ? reg.zoom - .8 : reg.zoom, e), pitch: lerp(0, 55, e), bearing: lerp(0, reg.bearing, e)
      });
      if (lastIdx !== -1) { lastIdx = -1; selected = 'oeste'; renderRegion('oeste'); }
    } else {
      const idx = Math.min(3, Math.floor((p - .2) / .8 * 4));
      if (idx !== lastIdx) { lastIdx = idx; focusRegion(keys[idx]); }
    }
  }
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) init(); }, { rootMargin: '1200px' }).observe(section);
  new IntersectionObserver(e => { visible = e[0].isIntersecting; if (!visible) { userMoved = false; lastIdx = -2; } }).observe(section);
  onScroll();

  window.OliverMap = { focusRegion, focusProject };
})();
