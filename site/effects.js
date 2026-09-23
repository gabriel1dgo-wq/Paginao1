(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window)) return;
  const elements = [...document.querySelectorAll('.section-heading, .project, .about-title, .steps article, .quotes figure, .contact > *')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-ready');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  elements.forEach(element => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('reveal-pending');
      observer.observe(element);
    }
  });
  const revealAll = () => {
    observer.disconnect();
    elements.forEach(element => element.classList.remove('reveal-pending'));
  };
  preference.addEventListener('change', revealAll, { once: true });
  window.addEventListener('beforeprint', revealAll, { once: true });
  document.addEventListener('focusin', event => {
    const parent = event.target.closest('.reveal-pending');
    if (parent) { parent.classList.remove('reveal-pending'); observer.unobserve(parent); }
  });
})();
