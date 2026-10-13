(() => {
  const key = '17c-project-wishlist-v1';
  const boxes = [...document.querySelectorAll('.wishlist-checkbox')];
  const catalog = new Map(boxes.map(box => [box.value, {
    id: box.value, service: box.dataset.service,
    serviceName: box.closest('.service-chapter').querySelector('.service-name').textContent,
    text: box.closest('label').querySelector('span').textContent
  }]));
  const selected = new Set();
  const panel = document.querySelector('#wishlist-panel');
  const floating = document.querySelector('#wishlist-floating');
  const form = document.querySelector('#wishlist-form');
  const status = document.querySelector('#wishlist-form-status');
  const includeWishlist = document.querySelector('#wishlist-include');
  const review = document.querySelector('#wishlist-review');
  const optionNote = document.querySelector('#wishlist-option-note');
  const submit = form.querySelector('[type="submit"]');
  const storageNote = document.querySelector('#wishlist-storage-note');
  const toggle = document.querySelector('#wishlist-toggle');
  const submitLabel = document.querySelector('#wishlist-submit-label');
  const idleSubmitLabel = form.dataset.endpoint.trim() ? 'Send my wishlist' : 'Open email draft';
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
      : 'Your wishlist is empty. Browse the services above to choose what interests you.';
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
  toggle.addEventListener('click', () => {
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
    const target = returnFocus && !returnFocus.hidden && getComputedStyle(returnFocus).visibility !== 'hidden' ? returnFocus : toggle;
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
  document.querySelector('#wishlist-inquiry-link').addEventListener('click', () => {
    const heading = document.querySelector('#wishlist-inquiry-title');
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
    (remaining[Math.min(index, remaining.length - 1)] || (panel.open ? document.querySelector('#wishlist-close') : toggle)).focus();
  }));
  for (const name of ['name', 'email', 'project']) form.elements[name].addEventListener('input', () => {
    form.elements[name].removeAttribute('aria-invalid');
    document.querySelector(`#wishlist-${name}-error`).textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    status.textContent = ''; status.dataset.state = '';
    let firstInvalid;
    for (const name of ['name', 'email', 'project']) {
      const field = form.elements[name];
      const tooLong = field.maxLength > 0 && field.value.length > field.maxLength;
      const invalid = !field.value.trim() || !field.validity.valid || tooLong;
      const error = document.querySelector(`#wishlist-${name}-error`);
      error.textContent = tooLong ? `Use ${field.maxLength} characters or fewer.` : invalid ? (name === 'email' ? 'Enter a valid email address.' : (name === 'project' ? 'Tell me what you have in mind.' : 'Enter your name.')) : '';
      field.setAttribute('aria-invalid', String(invalid));
      if (invalid && !firstInvalid) firstInvalid = field;
    }
    if (firstInvalid) { firstInvalid.focus(); return; }
    const snapshot = includeWishlist.checked ? new Set(selected) : new Set();
    const wishlistMessage = groups(snapshot).map(group => `${group.service}\n${group.items.map(item => `• ${item.text}`).join('\n')}`).join('\n\n');
    const payload = {
      name: form.elements.name.value.trim(), email: form.elements.email.value.trim(),
      business: form.elements.business.value.trim(), subject: '17C — Project wishlist',
      project: form.elements.project.value.trim(),
      wishlist: groups(snapshot).map(group => ({service: group.service, items: group.items.map(item => item.text)})),
      message: [form.elements.project.value.trim(), wishlistMessage].filter(Boolean).join('\n\n')
    };
    const endpoint = form.dataset.endpoint.trim();
    if (!endpoint) {
      const body = `Name: ${payload.name}\nEmail: ${payload.email}\nOrganization: ${payload.business || 'Not provided'}\n\n${payload.message}`;
      window.location.href = `mailto:marielwhitney.design@gmail.com?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    sending = true;
    submit.disabled = true; form.setAttribute('aria-busy', 'true');
    submitLabel.textContent = 'Sending your wishlist…'; status.textContent = 'Sending your ideas to 17C…';
    render();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('Not accepted');
      snapshot.forEach(id => selected.delete(id)); save(); form.reset();
      status.textContent = 'Your wishlist is on its way. Thanks for sharing what you’re thinking about!';
      status.dataset.state = 'success';
    } catch {
      status.textContent = 'I couldn’t confirm your wishlist was sent. Your selections are saved. Please try again or contact marielwhitney.design@gmail.com.';
      status.dataset.state = 'error';
    } finally {
      clearTimeout(timeout); sending = false; submit.disabled = false;
      form.removeAttribute('aria-busy'); submitLabel.textContent = idleSubmitLabel; render();
    }
  });
  render();
})();
