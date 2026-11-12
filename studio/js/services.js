// Smooth wheel and chapter navigation, using the same library as the homepage.
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let smoothScroll;
  const syncMotion = () => {
    smoothScroll?.destroy();
    delete window.studioSmoothScroll;
    smoothScroll = undefined;
    if (!motion.matches && typeof Lenis !== 'undefined') {
      smoothScroll = new Lenis({ autoRaf: true, smoothWheel: true, anchors: true, lerp: 0.085 });
      window.studioSmoothScroll = smoothScroll;
    }
  };
  motion.addEventListener('change', syncMotion);
  window.addEventListener('pagehide', () => { smoothScroll?.destroy(); smoothScroll = undefined; delete window.studioSmoothScroll; });
  window.addEventListener('pageshow', event => { if (event.persisted) syncMotion(); });
  syncMotion();
})();

// Follow the chapter crossing the upper third of the viewport.
(() => {
  const chapters = [...document.querySelectorAll('.service-chapter')];
  const links = [...document.querySelectorAll('.service-index a')];
  if (!chapters.length || !links.length) return;
  let scheduled = false;
  const update = () => {
    const readingLine = window.innerHeight * 0.33;
    let active = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= readingLine) active = chapter;
    }
    for (const link of links) {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    scheduled = false;
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.querySelectorAll('.service-disclosure').forEach(detail => detail.addEventListener('toggle', schedule));
  update();
})();

// Native details/summary exposes its expanded state without duplicated ARIA.
