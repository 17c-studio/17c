/* A proposal discussion request, never a signature or acceptance. */
(() => {
  'use strict';
  const form = document.getElementById('reply');
  const packages = document.getElementById('package');
  const name = document.getElementById('contact-name');
  const email = document.getElementById('contact-email');
  const message = document.getElementById('message');
  const referralAnswer = document.getElementById('referral-answer');
  const invoiceAnswer = document.getElementById('invoice-payment-answer');
  const platformAnswer = document.getElementById('platform-adaptation-answer');
  const checkinAnswer = document.getElementById('two-month-checkin-answer');
  const answers = [platformAnswer, invoiceAnswer, referralAnswer, checkinAnswer];
  const summary = document.getElementById('acceptance-summary');
  const status = document.getElementById('reply-status');
  const submit = document.getElementById('inquiry-submit');
  const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
  let pending = false, sent = false, cached = null;

  function scopeText(card) {
    const scope = card.querySelector('.package-scope').cloneNode(true);
    scope.querySelectorAll('[data-preview-only]').forEach(sample => sample.remove());
    return scope.textContent;
  }

  function selection() {
    if (!['package1', 'package2'].includes(packages.value)) return null;
    const card = document.getElementById(packages.value);
    const fee = clean(card.querySelector('[data-package-price]').textContent);
    return {
      id: card.id,
      label: `${clean(card.querySelector('.tier').textContent)} · ${clean(card.querySelector('h3').textContent)}`,
      monthly_fee: fee,
      monthly_fee_usd: Number(fee.replace(/[^\d.]/g, '')),
      scope: clean((card.id === 'package2' ? scopeText(document.getElementById('package1')) + ' ' : '') + scopeText(card))
    };
  }

  function update() {
    const selected = selection();
    summary.textContent = selected ? `${selected.label}\nMonthly fee: ${selected.monthly_fee}\n${selected.scope}\nAd budget: about $150/month, separate. This is a package preview for discussion, not acceptance.` : 'You can preview either package above, or send a message to talk through both options. No package selection is required.';
  }
  ['package1', 'package2'].forEach(id => {
    const card = document.getElementById(id);
    form.querySelector(`option[value="${id}"]`).textContent = `${clean(card.querySelector('.tier').textContent)} · ${clean(card.querySelector('h3').textContent)} · ${clean(card.querySelector('[data-package-price]').textContent)}`;
  });
  function handleInput() {
    if (pending || sent) return;
    name.setCustomValidity(''); message.setCustomValidity('');
    status.textContent = ''; status.dataset.state = '';
    cached = null;
    update();
  }
  form.addEventListener('input', handleInput);
  answers.forEach(field => field.addEventListener('input', handleInput));
  packages.addEventListener('change', () => { if (!pending && !sent) { cached = null; update(); } });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || sent) return;
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
    const hasResponse = [message, ...answers].some(field => field.value.trim());
    message.setCustomValidity(hasResponse ? '' : 'Please answer one of the questions or add a short message.');
    if (!form.reportValidity()) return;
    const details = {
      name: name.value.trim(), email: email.value.trim(), message: message.value.trim(),
      referral_answer: referralAnswer.value.trim(), invoice_payment_answer: invoiceAnswer.value.trim(),
      platform_adaptation_answer: platformAnswer.value.trim(), two_month_checkin_answer: checkinAnswer.value.trim(),
      selected: selection()
    };
    const fingerprint = JSON.stringify(details);
    if (!cached || cached.fingerprint !== fingerprint) {
      cached = {
        fingerprint,
        id: `SQ-INQUIRY-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)}`,
        submitted_at_browser_utc: new Date().toISOString()
      };
    }
    const payload = new FormData(form);
    payload.set('name', details.name);
    payload.set('email', details.email);
    payload.set('message', details.message);
    payload.set('referral_answer', details.referral_answer);
    payload.set('invoice_payment_answer', details.invoice_payment_answer);
    payload.set('platform_adaptation_answer', details.platform_adaptation_answer);
    payload.set('two_month_checkin_answer', details.two_month_checkin_answer);
    payload.set('package', details.selected?.label || 'Talk through the options');
    payload.set('package_id', details.selected?.id || 'undecided');
    payload.set('monthly_fee', details.selected?.monthly_fee || 'No package selected');
    payload.set('scope_preview', details.selected?.scope || 'Discuss both packages');
    payload.set('inquiry_id', cached.id);
    payload.set('submitted_at_browser_utc', cached.submitted_at_browser_utc);
    payload.set('_subject', `Sasquatch proposal discussion · ${details.name}`);
    const controls = [...form.elements];
    pending = true;
    form.setAttribute('aria-busy', 'true');
    controls.forEach(control => control.disabled = true);
    submit.textContent = 'Sending…';
    status.dataset.state = 'pending'; status.textContent = 'Sending your message…';
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', headers: { Accept: 'application/json' }, body: payload, signal: controller.signal
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error('Delivery was not confirmed.');
      sent = true;
      submit.textContent = 'Message sent';
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your message was sent. I’ll respond by email so we can talk through the options. You haven’t committed to a package or accepted the proposal.';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.name === 'AbortError' ? 'The request timed out, so I couldn’t confirm your message was received. Your message is still here. Please try again or email me at mariel@17c.studio.' : 'I couldn’t confirm your message was received. Your message is still here. Please try again or email me at mariel@17c.studio.';
      submit.textContent = 'Try sending again';
    } finally {
      clearTimeout(timeout); pending = false; form.removeAttribute('aria-busy');
      if (!sent) controls.forEach(control => control.disabled = false);
      status.focus({ preventScroll: true });
    }
  });
  update();
})();
