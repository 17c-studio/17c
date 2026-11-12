(() => {
  const entries = [...document.querySelectorAll('.dictionary-entry')];
  const pinned = new WeakSet();
  const hide = entry => {
    pinned.delete(entry);
    entry.querySelector('.dictionary-definition').hidden = true;
    entry.querySelector('.dictionary-trigger').setAttribute('aria-expanded', 'false');
  };
  for (const entry of entries) {
    const trigger = entry.querySelector('.dictionary-trigger');
    const definition = entry.querySelector('.dictionary-definition');
    const position = () => {
      if (definition.hidden) return;
      if (window.matchMedia('(max-width: 767px)').matches) {
        // Anchor the mobile note to the paragraph so it stays inside the copy.
        definition.style.left = '0';
        const paragraph = entry.closest('p');
        const below = paragraph.getBoundingClientRect().top < definition.offsetHeight + 12;
        definition.style.top = below ? 'calc(100% + 12px)' : 'auto';
        definition.style.bottom = below ? 'auto' : 'calc(100% + 12px)';
        return;
      }
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
    // Hover previews the definition; clicking keeps it open until dismissed.
    entry.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && window.matchMedia('(hover: hover)').matches) show();
    });
    entry.addEventListener('pointerleave', () => {
      if (!pinned.has(entry)) hide(entry);
    });
    trigger.addEventListener('click', () => {
      if (pinned.has(entry)) hide(entry);
      else { pinned.add(entry); show(); }
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
