/* Sasquatch acceptance. The owner must approve the terms and destination before activation. */
(() => {
  'use strict';
  const form = document.getElementById('reply');
  const packages = document.getElementById('package');
  const name = document.getElementById('signer-name');
  const email = document.getElementById('signer-email');
  const consent = document.getElementById('accept-consent');
  const summary = document.getElementById('acceptance-summary');
  const status = document.getElementById('reply-status');
  const submit = document.getElementById('accept-submit');
  const receipt = document.getElementById('acceptance-receipt');
  const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
  let pending = false, accepted = false, cached = null, signedRecord = null;
  const ready = () => form.dataset.termsApproved === 'true' && form.dataset.endpointConfirmed === 'true' && /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(form.dataset.submissionUrl || '');

  function selection() {
    if (!['package1', 'package2'].includes(packages.value)) return null;
    const card = document.getElementById(packages.value);
    const monthlyFee = clean(card.querySelector('[data-package-price]').textContent);
    return {
      id: card.id,
      label: `${clean(card.querySelector('.tier').textContent)} · ${clean(card.querySelector('h3').textContent)}`,
      monthly_fee: monthlyFee,
      monthly_fee_usd: Number(monthlyFee.replace(/[^\d.]/g, '')),
      billing_frequency: 'monthly',
      scope: clean((card.id === 'package2' ? document.querySelector('#package1 .package-scope').textContent + ' ' : '') + card.querySelector('.package-scope').textContent)
    };
  }

  function agreementTerms() {
    return [...document.querySelectorAll('#proposal-details .question-answer > h4')].map(heading => `${clean(heading.textContent)}\n${clean(heading.nextElementSibling.textContent)}`).join('\n\n');
  }

  function update() {
    const selected = selection();
    summary.textContent = selected ? `${selected.label}\nMonthly fee: ${selected.monthly_fee}\n${selected.scope}\nAd budget: about $150/month, separate. Boost suggestions and setup after Sasquatch approval. Items marked for later confirmation remain as stated in Proposal details.` : 'Choose a package above to see its monthly fee and scope.';
    const available = ready();
    form.querySelectorAll('[data-signing-control]').forEach(control => control.hidden = !available);
    if (!pending && !accepted) [name, email, consent].forEach(control => control.disabled = !available);
    submit.disabled = pending || accepted || !available;
    document.getElementById('signing-unavailable').hidden = available;
    form.querySelector('label[for=package]').textContent = available ? 'Choose your package' : 'Preview a package';
    packages.options[0].textContent = available ? 'Choose a package' : 'Choose a package to preview';
  }

  ['package1', 'package2'].forEach(id => {
    const card = document.getElementById(id);
    form.querySelector(`option[value="${id}"]`).textContent = `${clean(card.querySelector('.tier').textContent)} · ${clean(card.querySelector('h3').textContent)} · ${clean(card.querySelector('[data-package-price]').textContent)}`;
  });

  form.addEventListener('input', event => {
    if (pending || accepted) return;
    name.setCustomValidity('');
    status.textContent = '';
    status.dataset.state = '';
    if (event.target !== consent) consent.checked = false;
    cached = null;
    update();
  });
  form.addEventListener('change', event => {
    if (pending || accepted) return;
    if (event.target !== consent) consent.checked = false;
    cached = null;
    update();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || accepted) return;
    if (!ready()) {
      status.dataset.state = 'error';
      status.textContent = 'Signing is not available yet. Nothing was sent.';
      status.focus({ preventScroll: true });
      return;
    }
    name.setCustomValidity(name.value.trim() ? '' : 'Please type your full name.');
    if (!form.reportValidity()) return;
    const selected = selection();
    if (!selected || !consent.checked) return;
    const details = {
      organization: 'Sasquatch Ventures', project: 'Bailey Vos · Unblind launch',
      signer_name: name.value.trim(), signer_email: email.value.trim(), selected,
      consent: clean(document.getElementById('consent-wording').textContent),
      responsibilities: clean(document.getElementById('supported-scope').textContent),
      scope: clean(document.getElementById('scope').textContent),
      assumptions: clean(document.getElementById('assumptions').textContent),
      questions_for_confirmation: clean(document.getElementById('questions-for-you').textContent),
      terms: agreementTerms(),
      version: 'SASQUATCH-2026-11-22-v1'
    };
    const fingerprint = JSON.stringify(details);
    if (!cached || cached.fingerprint !== fingerprint) {
      cached = {
        fingerprint,
        record: { ...details, record_id: `SQ-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)}`, signed_at_browser_utc: new Date().toISOString() }
      };
    }
    const record = cached.record;
    const payload = new FormData();
    payload.set('_subject', `Signed Sasquatch proposal · ${selected.label} · ${record.record_id}`);
    payload.set('name', record.signer_name);
    payload.set('email', record.signer_email);
    payload.set('package', selected.label);
    payload.set('package_id', selected.id);
    payload.set('monthly_fee', selected.monthly_fee);
    payload.set('monthly_fee_usd', String(selected.monthly_fee_usd));
    payload.set('scope', selected.scope);
    payload.set('consent', record.consent);
    payload.set('record_id', record.record_id);
    payload.set('acceptance_record', JSON.stringify(record, null, 2));
    payload.set('_gotcha', document.getElementById('company-website').value);
    const controls = [...form.querySelectorAll('input,select,button')];
    pending = true;
    form.setAttribute('aria-busy', 'true');
    controls.forEach(control => control.disabled = true);
    status.dataset.state = 'pending';
    status.textContent = 'Submitting your signed proposal…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(form.dataset.submissionUrl, {
        method: 'POST', headers: { Accept: 'application/json' }, body: payload, signal: controller.signal
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error('Delivery was not confirmed.');
      accepted = true;
      signedRecord = record;
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your signed proposal was received. I’ll follow up about the next steps.';
      submit.textContent = 'Signed proposal received';
      document.getElementById('acceptance-reference').textContent = `Record: ${record.record_id} · ${selected.monthly_fee}`;
      receipt.hidden = false;
      document.getElementById('download-record').disabled = false;
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.name === 'AbortError' ? 'The request timed out, so I couldn’t confirm receipt. Your details are still here. Please contact Mariel before trying again.' : 'I couldn’t confirm your signed proposal was received. Your details are still here. Please contact Mariel if you’re unsure whether it went through, or try again.';
    } finally {
      clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
      if (!accepted) controls.forEach(control => control.disabled = false);
      update();
      status.focus({ preventScroll: true });
    }
  });

  document.getElementById('download-record').addEventListener('click', () => {
    if (!signedRecord) return;
    const record = signedRecord;
    const text = `17C Studio · Sasquatch Ventures signed proposal\n\nRecord: ${record.record_id}\nSigned (browser UTC): ${record.signed_at_browser_utc}\nName: ${record.signer_name}\nEmail: ${record.signer_email}\n\n${record.selected.label}\nMonthly fee: ${record.selected.monthly_fee}\n\nSELECTED SCOPE\n${record.selected.scope}\n\nACCEPTANCE\n${record.consent}\n\nRESPONSIBILITIES\n${record.responsibilities}\n\nWHAT I’LL DO\n${record.scope}\n\nASSUMPTIONS\n${record.assumptions}\n\nQUESTIONS FOR CONFIRMATION\n${record.questions_for_confirmation}\n\nPROPOSAL DETAILS\n${record.terms}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.record_id}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  update();
})();
