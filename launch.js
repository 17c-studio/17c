// Small shared enhancements, without a framework or build step.
(() => {
  document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = new Date().getFullYear(); });
  if (document.body.classList.contains('form-page') && !new URLSearchParams(location.search).has('for')) {
    const business = document.querySelector('#wishlist-form [name="business"]');
    try {
      const saved = localStorage.getItem('business-customization');
      if (business && saved) business.value = business.defaultValue = saved.trim().slice(0, 20);
    } catch { /* Personalization is optional when storage is unavailable. */ }
  }
  document.querySelector('.back-to-top')?.addEventListener('click', event => {
    event.preventDefault();
    const focusHome = () => document.querySelector('.header .wordmark')?.focus({ preventScroll: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    history.replaceState(null, '', '#top');
    focusHome();
    if (window.studioSmoothScroll) window.studioSmoothScroll.scrollTo(0, { immediate: reduced, onComplete: focusHome });
    else window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  });
  const button = document.querySelector('#motion-toggle');
  button?.addEventListener('click', () => {
    const paused = document.body.classList.toggle('motion-paused');
    button.setAttribute('aria-pressed', String(paused));
    window.dispatchEvent(new Event('studio:motion-change'));
  });
})();
