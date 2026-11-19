/* Adapted from the Zeeland Christian acceptance script.
   Draft guard blocks delivery until the endpoint and proposal terms are confirmed. */
(() => {
  'use strict';
  const form = document.getElementById('reply');
  if (!form) return;
  const byId = id => document.getElementById(id);
  const status = byId('reply-status');
  const submit = byId('accept-submit');
  const option = byId('option');
  const care = byId('care');
  const canvas = byId('signature-pad');
  let context;
  try { context = canvas?.getContext('2d'); } catch (_) { /* Typed signatures still work without canvas. */ }
  const consent = byId('accept-consent');
  let drawing = false, pointerId, hasInk = false, pending = false, accepted = false;
  let cachedRecord, confirmedRecord;
  const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
  const textOf = selector => clean(document.querySelector(selector)?.textContent);
  const carePlans = {
    monthly: { label: 'Optional monthly care · [Confirm monthly care price]', months: 3 },
    none: { label: 'No care plan for now', months: 0 }
  };
  function selection() {
    const card = byId(option.value);
    const plan = carePlans[care.value];
    if (!card || !plan) return null;
    return { option: option.selectedOptions[0].textContent,
      fee: clean(card.querySelector('.price').textContent), care: { ...plan } };
  }
  function updateSummary() {
    const selected = selection();
    byId('acceptance-summary').textContent = selected
      ? `Selected project: ${selected.option}\nProject investment: ${selected.fee}\nProposed payments: 50% to start and 50% at launch.\n` +
        (selected.care.months ? `Care: ${selected.care.label}. Proposed three-month minimum, then month to month with 30 days’ notice.` : 'Ongoing care: none selected.') +
        '\nPrivate draft. Acceptance is disconnected.'
      : '';
  }
  function invalidate() {
    if (pending || accepted) return;
    cachedRecord = undefined;
    byId('name').setCustomValidity('');
    status.textContent = '';
    status.dataset.state = '';
    updateSummary();
  }
  form.addEventListener('input', invalidate);
  form.addEventListener('change', invalidate);
  if (context) {
    context.strokeStyle = '#171614';
    context.fillStyle = '#171614';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const point = event => {
      const rect = canvas.getBoundingClientRect();
      return [(event.clientX - rect.left) * canvas.width / rect.width,
        (event.clientY - rect.top) * canvas.height / rect.height];
    };
    canvas.addEventListener('pointerdown', event => {
      if (pending || accepted || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      drawing = true; pointerId = event.pointerId;
      canvas.setPointerCapture(pointerId);
      const [x, y] = point(event);
      context.beginPath(); context.arc(x, y, 1.5, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.moveTo(x, y);
      hasInk = true; invalidate();
    });
    canvas.addEventListener('pointermove', event => {
      if (!drawing || event.pointerId !== pointerId) return;
      event.preventDefault();
      const [x, y] = point(event);
      context.lineTo(x, y); context.stroke();
    });
    const stop = () => { drawing = false; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, stop));
    byId('signature-clear').addEventListener('click', () => {
      if (pending || accepted) return;
      context.clearRect(0, 0, canvas.width, canvas.height); hasInk = false; invalidate();
    });
  } else {
    document.querySelector('.signature-disclosure').hidden = true;
  }
  // Preserve the page's hierarchy for the PDF instead of flattening every section.
  function captureBlocks(root) {
    const blocks = [];
    function visit(element) {
      if (!element || element.nodeType !== 1) return;
      if (element.matches('.eyebrow, .badge, .tier, .price, script, style, [aria-hidden="true"]')) return;
      const text = clean(element.textContent);
      if (!text) return;
      if (/^H[1-6]$/.test(element.tagName)) {
        blocks.push({ type: 'heading', text, level: Number(element.tagName[1]) });
      } else if (element.tagName === 'SUMMARY') {
        blocks.push({ type: 'heading', text, level: 4 });
      } else if (element.tagName === 'LI') {
        // Timeline phases contain their own headings and paragraphs.
        if (element.matches('.timeline-phase')) Array.from(element.children).forEach(visit);
        else blocks.push({ type: 'bullet', text });
      } else if (element.tagName === 'TR') {
        blocks.push({ type: 'row', cells: Array.from(element.cells).map(cell => clean(cell.textContent)) });
      } else if (element.tagName === 'P') {
        blocks.push({ type: 'paragraph', text });
      } else {
        Array.from(element.children).forEach(visit);
      }
    }
    visit(root);
    return blocks;
  }

  async function buildRecord() {
    const selected = selection();
    if (!selected || !consent.checked) throw new Error('Choose your option and care plan, then check the acceptance box.');
    if (!window.crypto?.subtle || !window.crypto.randomUUID) throw new Error('Please open this proposal over HTTPS in a current browser to sign, or use the email link at the bottom of this proposal.');
    const tier = Number(option.value.slice(-1));
    const scope = Array.from({ length: tier }, (_, index) => textOf(`#opt${index + 1}`));
    const documentSnapshot = {
      version: 'SPRING-SWEET-PRIVATE-DRAFT-v1', title: document.title,
      selected_project: selected, included_options: scope,
      scope_and_exclusions: textOf('#scope'), timeline: textOf('#timeline'),
      payment: textOf('#payment'), assumptions: textOf('#assumptions'), terms: textOf('#terms'),
      care_details: 'No care plan selected.'
    };
    if (selected.care.months) documentSnapshot.care_details = textOf('#ongoing-care');
    documentSnapshot.readable_sections = {
      included_options: Array.from({ length: tier }, (_, index) => ({
        title: `Option ${index + 1}: ${textOf(`#opt${index + 1} h3`)}`,
        blocks: captureBlocks(byId(`opt${index + 1}`))
      })),
      scope_and_exclusions: captureBlocks(byId('scope')),
      timeline: captureBlocks(byId('timeline')),
      payment: captureBlocks(byId('payment')),
      assumptions: captureBlocks(byId('assumptions')),
      terms: captureBlocks(byId('terms')),
      care_details: []
    };
    if (selected.care.months) {
      for (let node = byId('care-plan').nextElementSibling; node; node = node.nextElementSibling) {
        // The selected rate is already stated in the investment summary.
        if (!node.matches('.two')) documentSnapshot.readable_sections.care_details.push(...captureBlocks(node));
      }
    }
    const record = {
      acceptance_id: 'SPRING-SWEET-' + window.crypto.randomUUID(),
      signed_at_browser_utc: new Date().toISOString(),
      signer_name: byId('name').value.trim(), signer_email: byId('email').value.trim(),
      signer_role: byId('signer-title').value.trim(), organization: 'Spring Sweet',
      electronic_consent: textOf('#consent-wording'), authorized_signer_confirmed: true,
      page_url: /^https?:$/.test(window.location.protocol) ? window.location.origin + window.location.pathname : 'Local preview',
      selected, document: documentSnapshot,
      signature_png: hasInk ? canvas.toDataURL('image/png') : null,
      signer_note: byId('questions-text').value.trim(),
      timestamp_source: 'Signer browser clock; verify against Formspree receipt record.',
      ip_address: null, ip_source: 'Not collected by this page; verify receiving-service metadata separately.'
    };
    const encoded = new TextEncoder().encode(JSON.stringify(record));
    const hash = await window.crypto.subtle.digest('SHA-256', encoded);
    record.evidence_sha256 = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    return record;
  }
  function submissionError(response, result) {
    const messages = Array.isArray(result?.errors)
      ? result.errors.map(error => typeof error === 'string' ? error : error?.message).filter(Boolean)
      : [];
    const detail = messages.join(' ') || (typeof result?.error === 'string' ? result.error : '');
    const fallback = response.status === 413
      ? 'The signed attachments are too large.'
      : response.status === 429
        ? 'The form is receiving too many submissions. Please try again later.'
        : `The form service rejected the submission (HTTP ${response.status}).`;
    return new Error(`${detail || fallback} Your details are still here. If this continues, please use the email link at the bottom of this proposal.`);
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || accepted || !form.reportValidity()) return;
    if (!byId('name').value.trim()) {
      byId('name').setCustomValidity('Please enter your full name to sign.');
      byId('name').reportValidity();
      return;
    }
    const unresolved = /\[Confirm [^\]]+\]/.test(textOf('main'));
    if (form.dataset.draft === 'true' || unresolved || !/^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(form.getAttribute('action') || '')) {
      status.textContent = 'This private draft cannot be accepted yet. Pricing, scope, terms, and the Spring Sweet Formspree endpoint need confirmation. Nothing was sent.';
      status.dataset.state = 'error';
      status.focus({ preventScroll: true });
      return;
    }
    pending = true; drawing = false;
    const controls = Array.from(form.querySelectorAll('input,select,textarea,button'));
    const disabled = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Recording acceptance…';
    status.textContent = 'Submitting your signed acceptance…';
    let timeout, requestStarted = false;
    try {
      cachedRecord ||= await buildRecord();
      const record = cachedRecord;
      const payload = new FormData();
      payload.append('name', record.signer_name);
      payload.append('email', record.signer_email);
      payload.append('role', record.signer_role);
      payload.append('project_option', record.selected.option);
      payload.append('monthly_option', record.selected.care.months
        ? record.selected.care.label
        : record.selected.care.label);
      payload.append('note', record.signer_note);
      payload.append('signature', `${record.signer_name}\nSigned (browser UTC): ${record.signed_at_browser_utc}\n${record.electronic_consent}`);
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 35000);
      requestStarted = true;
      const response = await fetch(form.action, {
        method: 'POST', headers: { Accept: 'application/json' },
        body: payload, signal: controller.signal
      });
      // An HTML error page or incomplete response must never be treated as acceptance.
      const result = await response.json().catch(() => null);
      if (!response.ok) throw submissionError(response, result);
      if (result?.ok !== true) throw new Error('I couldn’t confirm your acceptance was received. Please use the email link at the bottom of this proposal before submitting again.');
      accepted = true;
      confirmedRecord = record;
      status.textContent = 'Thank you. Your signed acceptance was received. I’ll send the initial invoice and get in touch about kickoff.';
      status.dataset.state = 'success';
      byId('acceptance-reference').textContent = `Reference: ${record.acceptance_id}. Signed ${new Date(record.signed_at_browser_utc).toLocaleString()}.`;
      byId('acceptance-receipt').hidden = false;
      byId('download-acceptance-pdf').disabled = false;
    } catch (error) {
      status.textContent = requestStarted && (error.name === 'AbortError' || error instanceof TypeError)
        ? 'I couldn’t confirm your acceptance was received. Your details are still here. Please use the email link at the bottom of this proposal before submitting again.'
        : error instanceof TypeError
          ? 'Your acceptance record could not be prepared. Nothing was submitted. Please use the email link for help.'
          : error.message;
      status.dataset.state = 'error';
    } finally {
      clearTimeout(timeout); pending = false; form.removeAttribute('aria-busy');
      controls.forEach((control, index) => {
        if (!accepted) control.disabled = disabled[index];
      });
      submit.textContent = accepted ? 'Acceptance recorded' : 'Sign & accept proposal';
      status.focus({ preventScroll: true });
    }
  });
  byId('download-acceptance-pdf').addEventListener('click', () => {
    if (!confirmedRecord) return;
    window.print();
  });
  [option, care].forEach(control => control.addEventListener('change', () => {
    consent.checked = false;
  }));
  updateSummary();
  submit.disabled = false;
})();
