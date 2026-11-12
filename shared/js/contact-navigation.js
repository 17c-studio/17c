// Contact is injected by prospects.js; scroll only after its layout is ready.
(() => {
  const ready = Promise.all([window.studioProspectReady, document.fonts?.ready])
    .then(() => new Promise(resolve => requestAnimationFrame(resolve)));
  let navigation = 0;
  const goToContact = async (immediate = false) => {
    const current = ++navigation;
    await ready;
    if (current !== navigation) return;
    const target = document.querySelector('#contact');
    if (!target) return;
    window.ScrollTrigger?.refresh();
    const smoothScroll = window.studioSmoothScroll;
    const focusContact = () => target.focus({ preventScroll: true });
    if (smoothScroll) {
      smoothScroll.resize();
      // The shared CSS already supplies 25px of scroll padding.
      smoothScroll.scrollTo(target, { immediate, offset: 0, onComplete: focusContact });
    } else {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 25,
        behavior: immediate || reducedMotion ? 'instant' : 'smooth'
      });
      focusContact();
    }
  };

  // Own this anchor so native navigation and Lenis do not both start a scroll.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href="#contact"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!document.querySelector('#contact')) return;
    event.preventDefault();
    event.stopPropagation();
    if (window.location.hash !== '#contact') history.pushState(null, '', '#contact');
    goToContact();
  }, true);
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#contact') goToContact(true);
  });
  if (window.location.hash === '#contact') goToContact(true);
})();
