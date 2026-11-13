(() => {
  if (window.ssPreviewNavigation) return;
  window.ssPreviewNavigation = true;
  const close = () => {
    document.querySelectorAll('[data-ss-menu-button]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    document.querySelectorAll('[data-ss-mobile-menu]').forEach(menu => {
      menu.hidden = true;
      menu.classList.remove('is-open');
    });
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-ss-menu-button]');
    if (button) {
      const menu = document.getElementById(button.getAttribute('aria-controls'));
      if (!menu) return;
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      menu.classList.toggle('is-open', open);
    } else if (event.target.closest('[data-ss-mobile-menu] a')) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const trigger = document.querySelector('[data-ss-menu-button][aria-expanded="true"]');
    close(); if (trigger) trigger.focus();
  });
  window.matchMedia('(min-width: 1201px)').addEventListener('change', event => { if (event.matches) close(); });
  document.addEventListener('shopify:section:load', close);
  document.addEventListener('shopify:section:unload', close);
})();

// Keep all content readable until each enhancement has initialized.
(() => {
  const nav = document.querySelector('[data-ss-nav-shell]');
  if (!nav) return;
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 32);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('pageshow', update);
  update();
})();

(() => {
  if (!('IntersectionObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 700px)');
  const sections = [...document.querySelectorAll('.ss-section:not([data-ss-section="hero"]):not([data-ss-section="bridal"])')];
  let observer;
  const reveal = section => section.classList.remove('ss-reveal-pending');
  const setup = () => {
    observer?.disconnect();
    sections.forEach(reveal);
    if (motion.matches || mobile.matches) return;
    try {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
      sections.forEach(section => {
        if (section.getBoundingClientRect().top < window.innerHeight) return;
        section.classList.add('ss-reveal-pending');
        observer.observe(section);
      });
    } catch {
      sections.forEach(reveal);
    }
  };
  document.addEventListener('focusin', event => {
    const section = event.target.closest('.ss-reveal-pending');
    if (section) reveal(section);
  });
  motion.addEventListener('change', setup);
  mobile.addEventListener('change', setup);
  setup();
})();

// Shopify returns current images, availability, and USD prices for these USD requests.
// On request failure, leave the useful product link and omit a potentially stale price.
(() => {
  const format = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  document.querySelectorAll('[data-ss-product]').forEach(async card => {
    try {
      const url = new URL(`/products/${encodeURIComponent(card.dataset.ssProduct)}.js`, 'https://springsweet.com');
      url.searchParams.set('currency', 'USD');
      const response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Product unavailable');
      const product = await response.json();
      if (!Number.isFinite(product.price) || !product.title) throw new Error('Invalid product');
      card.querySelector('[data-ss-product-title]').textContent = product.title;
      card.querySelector('[data-ss-product-price]').textContent = `${product.price_varies ? 'From ' : ''}${format.format(product.price / 100)}`;
      const availability = card.querySelector('[data-ss-product-availability]');
      if (availability) availability.hidden = product.available !== false;
      if (product.featured_image) {
        const imageURL = new URL(product.featured_image, 'https://springsweet.com');
        if (imageURL.protocol !== 'https:') return;
        imageURL.searchParams.set('width', '600');
        const image = card.querySelector('img');
        image.src = imageURL.href;
        image.alt = product.title;
      }
    } catch {
      card.querySelector('[data-ss-product-price]').textContent = 'View details';
    }
  });
})();
