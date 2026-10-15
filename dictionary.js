(() => {
  const entries = [...document.querySelectorAll('.dictionary-entry')];
  const hide = entry => {
    entry.querySelector('.dictionary-definition').hidden = true;
    entry.querySelector('.dictionary-trigger').setAttribute('aria-expanded', 'false');
  };
  for (const entry of entries) {
    const trigger = entry.querySelector('.dictionary-trigger');
    const definition = entry.querySelector('.dictionary-definition');
    const position = () => {
      if (definition.hidden) return;
      const bounds = entry.getBoundingClientRect();
      const width = definition.getBoundingClientRect().width;
      const left = Math.max(16, Math.min(bounds.left, window.innerWidth - width - 16));
      definition.style.left = `${left - bounds.left}px`;
      const below = bounds.top < definition.offsetHeight + 12;
      definition.style.top = below ? 'calc(100% + 12px)' : 'auto';
      definition.style.bottom = below ? 'auto' : 'calc(100% + 12px)';
    };
    const show = () => {
      entries.forEach(other => { if (other !== entry) hide(other); });
      definition.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      position();
    };
    // Explicit disclosure works consistently with touch, mouse, and keyboard.
    trigger.addEventListener('click', () => {
      if (definition.hidden) show();
      else hide(entry);
    });
    entry.addEventListener('focusout', event => {
      if (!entry.contains(event.relatedTarget)) hide(entry);
    });
    window.addEventListener('resize', position);
    entry.closest('details')?.addEventListener('toggle', event => {
      if (!event.currentTarget.open) hide(entry);
    });
  }
  document.addEventListener('pointerdown', event => {
    entries.forEach(entry => { if (!entry.contains(event.target)) hide(entry); });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') entries.forEach(hide);
  });
})();
