(() => {
  const projects = window.LOGICA_PROJECTS || [];
  const dialog = document.querySelector('#project-gallery');
  if (!dialog || !projects.length) return;
  const find = selector => dialog.querySelector(selector);
  const image = find('#gallery-image');
  const thumbs = find('.gallery-thumbs');
  let current = null, index = 0, opener = null, touchStart = null;
  const priceText = project => project.price || 'Consulte os valores atuais';
  const deliveryText = project => project.delivery || 'Previsão a confirmar';
  projects.forEach(project => {
    const card = document.querySelector(`[data-commercial="${project.id}"]`);
    if (card) {
      card.querySelector('[data-price]').textContent = priceText(project);
      card.querySelector('[data-delivery]').textContent = deliveryText(project);
      card.querySelector('[data-category]').textContent = project.category;
    }
  });
  function selectImage(next) {
    index = (next + current.images.length) % current.images.length;
    const asset = current.images[index];
    image.src = asset.src;
    image.alt = `${current.name} — ${asset.label}`;
    find('#gallery-caption').textContent = `${index + 1} / ${current.images.length} · ${asset.label}`;
    find('#gallery-source').textContent = asset.source;
    [...thumbs.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  function openProject(id, trigger) {
    current = projects.find(project => project.id === Number(id));
    if (!current) return;
    opener = trigger;
    find('#gallery-title').textContent = current.name;
    find('#gallery-price').textContent = priceText(current);
    find('#gallery-delivery').textContent = deliveryText(current);
    find('#gallery-category').textContent = current.category;
    find('#gallery-category-note').textContent = current.categoryNote;
    find('#gallery-contact').href = '#perfil';
    find('#gallery-contact').dataset.profileProject = current.name;
    thumbs.replaceChildren();
    current.images.forEach((asset, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Ver imagem ${i + 1}: ${asset.label}`);
      const preview = document.createElement('img');
      preview.src = asset.src;
      preview.alt = '';
      preview.loading = 'lazy';
      button.append(preview);
      button.addEventListener('click', () => selectImage(i));
      thumbs.append(button);
    });
    selectImage(0);
    dialog.showModal();
    document.body.classList.add('gallery-is-open');
    find('.gallery-close').focus();
  }
  document.querySelectorAll('[data-open-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.openProject, button)));
  document.querySelectorAll('.project[data-project]').forEach(card => card.addEventListener('click', event => {
    if (event.target.closest('a,button,details') || window.getSelection()?.toString()) return;
    openProject(card.dataset.project, card.querySelector('[data-open-project]'));
  }));
  find('.gallery-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('gallery-is-open');
    opener?.focus();
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  find('.gallery-prev').addEventListener('click', () => selectImage(index - 1));
  find('.gallery-next').addEventListener('click', () => selectImage(index + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); selectImage(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  const stage = find('.gallery-stage');
  stage.addEventListener('touchstart', event => { touchStart = [event.changedTouches[0].clientX, event.changedTouches[0].clientY]; }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart[0];
    const dy = event.changedTouches[0].clientY - touchStart[1];
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) selectImage(index + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
})();
