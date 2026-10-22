(() => {
  const form = document.querySelector('#wishlist-form');
  if (!form) return;
  const key = '17c-project-wishlist-v1';
  const boxes = [...document.querySelectorAll('.wishlist-checkbox')];
  const catalog = new Map((window.studioWishlistCatalog || []).map(item => [item.id, item]));
  boxes.forEach(box => catalog.set(box.value, {
    id: box.value, service: box.dataset.service,
    serviceName: box.closest('.service-chapter').querySelector('.service-name').textContent,
    text: box.closest('label').querySelector('span').textContent
  }));
  const selected = new Set();
  const panel = document.querySelector('#wishlist-panel');
  const floating = document.querySelector('#wishlist-floating');
  const status = document.querySelector('#wishlist-form-status');
  const includeWishlist = document.querySelector('#wishlist-include');
  const review = document.querySelector('#wishlist-review');
  const optionNote = document.querySelector('#wishlist-option-note');
  const submit = form.querySelector('[type="submit"]');
  const storageNote = document.querySelector('#wishlist-storage-note');
  const toggle = document.querySelector('#wishlist-toggle');
  const submitLabel = document.querySelector('#wishlist-submit-label');
  const idleSubmitLabel = 'Send inquiry';
  submitLabel.textContent = idleSubmitLabel;
  let sending = false;
  let returnFocus;
  let overlapFrame;
  const syncFloatingOverlap = () => {
    overlapFrame = undefined;
    if (floating.hidden || panel.open) return;
    const rect = floating.getBoundingClientRect();
    const obscuresControl = [...document.querySelectorAll('main a, main button, main label, main textarea, main summary, footer a')].some(control => {
      const bounds = control.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.left < rect.right && bounds.right > rect.left && bounds.top < rect.bottom && bounds.bottom > rect.top;
    });
    floating.dataset.obscured = String(obscuresControl && document.activeElement !== floating);
  };
  const scheduleOverlap = () => {
    if (!overlapFrame) overlapFrame = requestAnimationFrame(syncFloatingOverlap);
  };
  window.addEventListener('scroll', scheduleOverlap, { passive: true });
  window.addEventListener('resize', scheduleOverlap);
  document.addEventListener('focusin', scheduleOverlap);
  document.querySelectorAll('.service-disclosure').forEach(detail => detail.addEventListener('toggle', scheduleOverlap));
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) saved.forEach(id => { if (catalog.has(id)) selected.add(id); });
  } catch { storageNote.textContent = 'Your wishlist works here, but this browser could not restore saved selections.'; }
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify([...selected])); }
    catch { storageNote.textContent = 'Your wishlist works here, but this browser cannot save it for your next visit.'; }
  };
  const groups = (ids = selected) => {
    const result = new Map();
    for (const [id, item] of catalog) {
      if (!ids.has(id)) continue;
      if (!result.has(item.service)) result.set(item.service, { service: item.serviceName, items: [] });
      result.get(item.service).items.push(item);
    }
    return [...result.values()];
  };
  const summary = container => {
    container.replaceChildren();
    if (!selected.size) {
      const empty = document.createElement('p');
      empty.textContent = 'Your wishlist is empty. Choose services that interest you to start a conversation.';
      container.append(empty);
      return;
    }
    for (const group of groups()) {
      const section = document.createElement('section');
      const heading = document.createElement('h3'); heading.textContent = group.service;
      const list = document.createElement('ul');
      for (const item of group.items) {
        const li = document.createElement('li');
        const text = document.createElement('span'); text.textContent = item.text;
        const remove = document.createElement('button');
        remove.type = 'button'; remove.textContent = 'Remove'; remove.dataset.remove = item.id;
        remove.setAttribute('aria-label', `Remove ${item.text} from wishlist`);
        remove.disabled = sending;
        li.append(text, remove); list.append(li);
      }
      section.append(heading, list); container.append(section);
    }
  };
  const render = () => {
    boxes.forEach(box => {
      box.checked = selected.has(box.value); box.disabled = sending;
      box.closest('label').querySelector('i').className = `fa-regular ${box.checked ? 'fa-circle-check' : 'fa-circle'}`;
    });
    floating.hidden = !selected.size;
    review.hidden = !selected.size; review.disabled = sending;
    floating.textContent = `Your wishlist · ${selected.size} selected`;
    summary(document.querySelector('#wishlist-panel-summary'));
    includeWishlist.disabled = sending;
    optionNote.textContent = selected.size
      ? `${selected.size} ${selected.size === 1 ? 'item' : 'items'} selected. ${includeWishlist.checked ? 'Your wishlist will be included with your inquiry.' : 'Your wishlist is saved and won’t be included with this inquiry.'}`
      : 'You can send an inquiry without a wishlist, or explore services to choose what interests you.';
    scheduleOverlap();
  };
  const changed = () => { save(); render(); if (!sending) { status.textContent = ''; } };
  includeWishlist.addEventListener('change', () => { render(); status.textContent = ''; });
  form.addEventListener('input', () => {
    if (!sending) { status.textContent = ''; status.dataset.state = ''; }
  });
  boxes.forEach(box => box.addEventListener('change', () => {
    if (box.checked) selected.add(box.value); else selected.delete(box.value);
    changed();
  }));
  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    document.querySelector('#wishlist-explanation').hidden = !expanded;
  });
  for (const opener of [floating, review]) opener.addEventListener('click', () => {
    returnFocus = opener;
    panel.showModal();
  });
  panel.addEventListener('close', () => {
    syncFloatingOverlap();
    const target = returnFocus && !returnFocus.hidden && getComputedStyle(returnFocus).visibility !== 'hidden' ? returnFocus : (toggle || form.elements.name);
    target.focus();
    returnFocus = undefined;
  });
  // Native modal inertness plus explicit keyboard wrapping keeps focus on controls.
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...panel.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
      .filter(control => control.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.querySelector('#wishlist-close').addEventListener('click', () => panel.close());
  document.querySelector('#wishlist-inquiry-link').addEventListener('click', event => {
    const heading = document.querySelector(event.currentTarget.hash || '#wishlist-inquiry-title');
    if (!heading) { panel.close(); return; }
    heading.setAttribute('tabindex', '-1');
    returnFocus = heading;
    panel.close();
    heading.focus({ preventScroll: true });
  });
  document.querySelectorAll('.wishlist-summary').forEach(container => container.addEventListener('click', event => {
    const button = event.target.closest('button[data-remove]');
    if (!button || sending) return;
    const buttons = [...container.querySelectorAll('button[data-remove]')];
    const index = buttons.indexOf(button);
    selected.delete(button.dataset.remove); changed();
    const remaining = [...container.querySelectorAll('button[data-remove]')];
    (remaining[Math.min(index, remaining.length - 1)] || (panel.open ? document.querySelector('#wishlist-close') : (toggle || form.elements.name))).focus();
  }));
  window.studioInquiryWishlist = {
    capture() {
      const ids = includeWishlist.checked ? new Set(selected) : new Set();
      const message = groups(ids).map(group => `${group.service}\n${group.items.map(item => `• ${item.text}`).join('\n')}`).join('\n\n');
      return { ids, message };
    },
    setSending(value) { sending = value; render(); },
    complete(snapshot) { snapshot.ids.forEach(id => selected.delete(id)); save(); }
  };
  render();
})();
