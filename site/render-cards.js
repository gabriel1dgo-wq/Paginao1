/* Gera os cards de empreendimentos a partir do catálogo (antes de gallery.js). */
(() => {
  const cat = window.OLIVER_CATALOG || [];
  const track = document.querySelector('.projects');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const regionName = { oeste: 'Zona Oeste', leste: 'Zona Leste', itaquera: 'Itaquera e extremo leste', sudeste: 'Ipiranga e V. Prudente' };
  const count = id => (window.LOGICA_PROJECTS || []).find(p => p.id === id)?.images.length || 1;
  if (track) {
    track.innerHTML = cat.map(p => `
      <article class="project" data-project="${p.id}" data-region="${p.region}">
        <div class="p-tilt">
          <button class="p-media" type="button" data-open-project="${p.id}" aria-label="Ver galeria de ${esc(p.name)}">
            <img src="${p.cover}" alt="Perspectiva ilustrativa de ${esc(p.name)}" loading="lazy">
            <span class="p-count">${count(p.id)} imagens</span>
            <span class="p-region">${esc(regionName[p.region])}</span>
          </button>
          <span class="p-glare" aria-hidden="true"></span>
          <button class="fav" type="button" aria-pressed="false" aria-label="Favoritar ${esc(p.name)}"><svg><use href="#i-heart"/></svg></button>
          <div class="p-body">
            <p class="p-meta"><span class="mono">${esc((p.dev !== '—' ? p.dev : p.name)[0])}</span>${p.dev !== '—' ? esc(p.dev) + ' · ' : ''}${esc(p.bairro)}</p>
            <h3>${esc(p.name)}</h3>
            <p class="p-lead">${esc(p.lead)}</p>
            <dl class="p-spec"><div><dt>Área</dt><dd>${esc(p.area)}</dd></div><div><dt>Tipologia</dt><dd>${esc(p.dorms)}</dd></div></dl>
            <div class="p-foot"><span class="tags">${p.tags.map(esc).join(' · ')}</span><button class="round" type="button" data-open-project="${p.id}" aria-label="Abrir ${esc(p.name)}"><svg><use href="#i-arrow"/></svg></button></div>
            <details><summary>Fonte</summary><p>${esc(p.src)} Valores, disponibilidade e condições sob consulta.${p.pdf ? ` <a href="${p.pdf}" target="_blank" rel="noopener">Abrir book (PDF) ↗</a>` : ''}</p></details>
          </div>
        </div>
      </article>`).join('');
  }
  const sel = document.querySelector('#profile-project');
  if (sel) cat.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt')).forEach(p => { const o = document.createElement('option'); o.textContent = p.name; sel.append(o); });
})();
