// Shared progressive enhancement; the HTML POST remains usable without JavaScript.
(() => {
  const form = document.querySelector('#wishlist-form');
  const status = document.querySelector('#wishlist-form-status');
  if (!form || !status) return;
  const submit = form.querySelector('[type="submit"]');
  const label = form.querySelector('#wishlist-submit-label');
  let sending = false;
  form.noValidate = true;
  const fields = ['name', 'email', 'project'];
  form.addEventListener('input', event => {
    if (sending) return;
    status.textContent = ''; status.dataset.state = '';
    const field = event.target;
    if (fields.includes(field.name)) {
      field.removeAttribute('aria-invalid');
      document.querySelector(`#wishlist-${field.name}-error`).textContent = '';
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    status.textContent = ''; status.dataset.state = '';
    let firstInvalid;
    for (const name of fields) {
      const field = form.elements[name];
      const tooLong = field.maxLength > 0 && field.value.length > field.maxLength;
      const invalid = !field.value.trim() || !field.validity.valid || tooLong;
      document.querySelector(`#wishlist-${name}-error`).textContent = tooLong ? `Use ${field.maxLength} characters or fewer.` : invalid ? (name === 'email' ? 'Enter a valid email address.' : name === 'project' ? 'Tell me what you have in mind.' : 'Enter your name.') : '';
      field.setAttribute('aria-invalid', String(invalid));
      if (invalid && !firstInvalid) firstInvalid = field;
    }
    if (firstInvalid) { firstInvalid.focus(); return; }
    const wishlist = window.studioInquiryWishlist;
    const snapshot = wishlist?.capture() || { message: '' };
    const payload = Object.fromEntries(new FormData(form));
    for (const name of ['name', 'email', 'business', 'project']) payload[name] = String(payload[name] || '').trim();
    payload.wishlist = snapshot.message || 'No wishlist included';
    payload.message = [payload.project, snapshot.message].filter(Boolean).join('\n\n');
    const controls = [...form.querySelectorAll('input, textarea, button')];
    const previousDisabled = controls.map(control => control.disabled);
    sending = true;
    wishlist?.setSending(true);
    controls.forEach(control => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending…'; status.textContent = 'Sending your ideas to 17C…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok === false) {
        const errors = Array.isArray(result.errors) ? result.errors : [];
        for (const error of errors) {
          if (!fields.includes(error.field)) continue;
          form.elements[error.field].setAttribute('aria-invalid', 'true');
          document.querySelector(`#wishlist-${error.field}-error`).textContent = error.message || 'Please check this field.';
        }
        throw new Error('Submission not confirmed');
      }
      // Confirmed success only. Keep form values and prospect query strings private.
      const serviceIds = [...new Set([...snapshot.ids || []]
        .map(id => id.match(/^service-[1-6](?=-)/)?.[0]).filter(Boolean))];
      window.dispatchEvent(new CustomEvent('studio:analytics', {
        detail: { name: 'generate_lead', page_path: location.pathname, service_ids: serviceIds }
      }));
      wishlist?.complete(snapshot);
      form.reset();
      status.textContent = 'Your inquiry was accepted. Thanks for sharing what you’re thinking about!';
      status.dataset.state = 'success';
    } catch {
      status.textContent = 'I couldn’t confirm your inquiry was sent. Your message is still here. Please try again or email mariel@17c.studio.';
      status.dataset.state = 'error';
    } finally {
      clearTimeout(timeout);
      controls.forEach((control, index) => { control.disabled = previousDisabled[index]; });
      sending = false;
      wishlist?.setSending(false);
      form.removeAttribute('aria-busy'); label.textContent = 'Send inquiry';
      // A stable status target exposes feedback after a long network wait.
      status.focus({ preventScroll: true });
    }
  });
})();
