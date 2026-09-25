(() => {
  const form = document.querySelector('#lead-profile');
  const project = document.querySelector('#profile-project');
  function buildProfileMessage(data) {
    return ['Olá, Gabriel! Vim pelo site da OLIVER IMOB e quero conversar sobre um imóvel.', '',
      `Nome: ${data.nome.trim()}`, `WhatsApp: ${data.telefone}`, `Objetivo: ${data.objetivo}`, `Projeto de interesse: ${data.projeto}`,
      `Orçamento do imóvel: ${data.orcamento}`, `Entrada planejada: ${data.entrada}`,
      `Prazo para compra: ${data.prazo}`, `Renda familiar aproximada: ${data.renda || 'Prefiro informar na conversa'}`,
      `Região: ${data.regiao}`, `Dormitórios: ${data.dormitorios}`, `FGTS: ${data.fgts}`, `Melhor horário: ${data.horario}`,
      '', 'Pode me ajudar a entender as opções para o meu momento?'].join('\n');
  }
  window.LogicaProfile = { buildProfileMessage };

  /* ---------- what the visitor looked at (goes to the lead sheet) ---------- */
  const started = Date.now();
  const seen = { galerias: new Set(), regioes: new Set(), scroll: 0 };
  const projectName = id => (window.OLIVER_CATALOG || window.LOGICA_PROJECTS || []).find(p => p.id === Number(id))?.name;
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-open-project]'); const n = g && projectName(g.dataset.openProject);
    if (n) seen.galerias.add(n);
    const d = e.target.closest('[data-district]'); if (d) seen.regioes.add(d.textContent.trim());
    const pin = e.target.closest('.gm-pin'); if (pin) seen.galerias.add(pin.getAttribute('aria-label').split(',')[0] + ' (mapa)');
  }, true);
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0) seen.scroll = Math.max(seen.scroll, Math.round(scrollY / max * 100));
  }, { passive: true });
  const params = new URLSearchParams(location.search);
  const device = () => /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Celular' : /iPad|Tablet/i.test(navigator.userAgent) ? 'Tablet' : 'Computador';

  function sendLead(data) {
    const url = window.OLIVER_LEADS_URL;
    if (!url || data.site) return; // sem planilha configurada ou robô (campo oculto preenchido)
    const secs = Math.round((Date.now() - started) / 1000);
    const payload = JSON.stringify({
      ...data, site: undefined,
      galerias: [...seen.galerias].join(', '), regioesMapa: [...seen.regioes].join(', '),
      tempoSite: `${Math.floor(secs / 60)} min ${secs % 60} s`, rolagem: seen.scroll + '%',
      origem: params.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'Acesso direto'),
      midia: params.get('utm_medium') || '', campanha: params.get('utm_campaign') || '',
      dispositivo: device(), pagina: location.href
    });
    // text/plain avoids a CORS preflight; sendBeacon survives the jump to WhatsApp
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, blob))) {
      fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body: payload }).catch(() => {});
    }
  }

  const tel = form.elements.telefone;
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
  });
  document.querySelectorAll('[data-profile-link], #gallery-contact').forEach(link => {
    link.removeAttribute('target');
    link.addEventListener('click', event => {
      event.preventDefault();
      const card = link.closest('[data-project]');
      const selected = link.dataset.profileProject || (card && window.LOGICA_PROJECTS.find(p => p.id === Number(card.dataset.project))?.name);
      if (selected) project.value = selected;
      const dialog = document.querySelector('#project-gallery');
      if (dialog.open) dialog.close();
      requestAnimationFrame(() => {
        document.querySelector('#perfil').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        form.elements.nome.focus({ preventScroll: true });
      });
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    form.elements.nome.setCustomValidity(form.elements.nome.value.trim() ? '' : 'Informe seu nome.');
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    sendLead(data);
    const url = `https://wa.me/5511962128752?text=${encodeURIComponent(buildProfileMessage(data))}`;
    document.querySelector('#profile-status').textContent = 'Abrindo seu resumo no WhatsApp. Envie a mensagem para iniciar a conversa.';
    window.location.assign(url);
  });
  form.elements.nome.addEventListener('input', () => form.elements.nome.setCustomValidity(''));
})();
