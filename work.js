(() => {
  const weight = document.querySelector('#type-weight');
  weight.disabled = false;
  weight.addEventListener('input', () => {
    document.querySelector('#type-sample').style.fontWeight = weight.value;
    document.querySelector('#type-weight-value').value = weight.value;
  });

  // Use the same catalog IDs and persistence contract read by wishlist.js on
  // services.html and form.html. No separate portfolio selections are created.
  const key = '17c-project-wishlist-v1';
  const catalog = new Map((window.studioWishlistCatalog || []).map(item => [item.id, item]));
  const buttons = [...document.querySelectorAll('[data-wishlist-id]')];
  const status = document.querySelector('#work-wishlist-status');
  const read = () => {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(id => catalog.has(id)) : []);
  };
  const render = () => {
    const selected = read();
    buttons.forEach(button => {
      const added = selected.has(button.dataset.wishlistId);
      button.hidden = !catalog.has(button.dataset.wishlistId);
      button.setAttribute('aria-disabled', String(added));
      button.textContent = added ? 'Saved to your wishlist ✓' : button.dataset.label;
    });
  };
  const unavailable = () => {
    buttons.forEach(button => { button.hidden = true; });
    status.textContent = 'This browser cannot save wishlist ideas here. You can still explore services or start a conversation.';
  };
  buttons.forEach(button => {
    button.dataset.label = button.textContent;
    button.addEventListener('click', () => {
      try {
        const item = catalog.get(button.dataset.wishlistId);
        if (!item) return;
        const selected = read();
        if (selected.has(item.id)) return;
        selected.add(item.id);
        localStorage.setItem(key, JSON.stringify([...selected]));
        render();
        status.textContent = `${item.text} saved. Review your wishlist when you’re ready.`;
        // The pressed control retains focus so keyboard users can continue reading.
        button.focus({ preventScroll: true });
      } catch { unavailable(); }
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { try { render(); } catch { unavailable(); } }
  });
  try { render(); } catch { unavailable(); }
  document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
