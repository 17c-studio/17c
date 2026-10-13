// Decide before first paint; the personalized hero supplies the logo once ready.
(() => {
  const slug = new URLSearchParams(window.location.search).get('for');
  if (!slug || window.location.hash) return;
  const key = `17c-prospect-welcome:${slug}`;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch { /* The reveal still works when browser storage is unavailable. */ }

  const root = document.documentElement;
  root.classList.add('prospect-reveal-pending');
  let curtain;
  let finished = false;
  const preventScroll = event => event.preventDefault();
  const preventScrollKeys = event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) event.preventDefault();
  };
  window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
  window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
  window.addEventListener('keydown', preventScrollKeys, true);
  const finish = () => {
    finished = true;
    root.classList.remove('prospect-reveal-pending');
    curtain?.remove();
    clearTimeout(failsafe);
    window.removeEventListener('wheel', preventScroll, true);
    window.removeEventListener('touchmove', preventScroll, true);
    window.removeEventListener('keydown', preventScrollKeys, true);
  };
  // Never leave a visitor behind a curtain after a failed request or script.
  const failsafe = setTimeout(finish, 4000);
  window.addEventListener('pagehide', finish, { once: true });
  window.studioProspectReveal = {
    cancel: finish,
    async show(brand) {
      if (finished) return;
      curtain = document.createElement('div');
      curtain.className = 'prospect-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      curtain.setAttribute('data-lenis-prevent', '');
      const content = document.createElement('div');
      content.className = 'prospect-curtain-content';
      const logo = brand.cloneNode(true);
      const image = logo.querySelector('img');
      const wordmark = logo.querySelector('.prospect-wordmark');
      const message = document.createElement('p');
      message.textContent = 'A little something, made just for you.';
      content.append(logo, message);
      curtain.append(content);
      document.body.append(curtain);

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Decode the hero concurrently, rather than holding a fixed loading pause.
      const heroImage = document.querySelector('.cover-image');
      let heroReady = heroImage?.decode().catch(() => {});
      if (!heroImage) {
        const hero = document.querySelector('.services-hero');
        const background = hero && getComputedStyle(hero).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        if (background) {
          const backgroundImage = new Image();
          backgroundImage.src = background[1];
          heroReady = backgroundImage.decode().catch(() => {});
        }
      }
      const heroDeadline = new Promise(resolve => setTimeout(resolve, 2000));

      if (image) {
        try {
          await Promise.race([
            image.decode(),
            new Promise((_, reject) => setTimeout(() => reject(), 700))
          ]);
          image.hidden = false;
          if (wordmark) wordmark.hidden = true;
        } catch {
          image.remove();
          if (wordmark) wordmark.hidden = false;
        }
      }
      if (finished) return;
      try { sessionStorage.setItem(key, 'seen'); } catch { /* Storage is optional. */ }
      content.style.opacity = '1';
      const entrance = content.animate(
        reducedMotion
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: reducedMotion ? 150 : 250, easing: 'ease-out', fill: 'both' }
      );
      await Promise.all([entrance.finished.catch(() => {}), Promise.race([heroReady, heroDeadline])]);
      if (finished) return;
      // The business logo and hero are ready before the curtain starts moving.
      document.body.classList.add('prospect-reveal-shown');
      curtain.classList.add('is-ready');
      curtain.addEventListener('animationend', event => {
        if (event.target === curtain) finish();
      });
      clearTimeout(failsafe);
      setTimeout(finish, reducedMotion ? 350 : 900);
    }
  };
})();
