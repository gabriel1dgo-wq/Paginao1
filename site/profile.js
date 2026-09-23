(() => {
  const form = document.querySelector('#lead-profile');
  const project = document.querySelector('#profile-project');
  function buildProfileMessage(data) {
    return ['Olá, Gabriel! Vim pelo site da OLIVER IMOB e quero conversar sobre um imóvel.', '',
      `Nome: ${data.nome.trim()}`, `Objetivo: ${data.objetivo}`, `Projeto de interesse: ${data.projeto}`,
      `Orçamento do imóvel: ${data.orcamento}`, `Entrada planejada: ${data.entrada}`,
      `Prazo para compra: ${data.prazo}`, `Renda familiar aproximada: ${data.renda || 'Prefiro informar na conversa'}`,
      '', 'Pode me ajudar a entender as opções para o meu momento?'].join('\n');
  }
  window.LogicaProfile = { buildProfileMessage };
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
    const url = `https://wa.me/5511962128752?text=${encodeURIComponent(buildProfileMessage(data))}`;
    document.querySelector('#profile-status').textContent = 'Abrindo seu resumo no WhatsApp. Envie a mensagem para iniciar a conversa.';
    window.location.assign(url);
  });
  form.elements.nome.addEventListener('input', () => form.elements.nome.setCustomValidity(''));
})();
