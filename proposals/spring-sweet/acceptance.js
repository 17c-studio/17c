/* Electronic proposal acceptance. Typed signature and the text record go to Formspree.
   The signed PDF and optional drawing are retained in the client’s download only. */
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
  let cachedRecord, cachedPDF, confirmedRecord, confirmedPDF;
  const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
  const textOf = selector => clean(document.querySelector(selector)?.textContent);
  const finalPaymentTiming = 'The remaining 50% is invoiced after approval of the completed launch scope. For an agreed phased launch, it is invoiced once the final phase is approved. Payment is due within 7 days of issue and must clear before that launch or final phase goes live.';
  const money = value => Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2 });
  const carePlans = {
    site: { label: 'Site Care · $300/month', monthly: 300, months: 3, total: 900, renewal: 'Then month to month with 30 days’ notice.' },
    growth: { label: 'Growth Care · $600/month', monthly: 600, months: 3, total: 1800, renewal: 'Then month to month with 30 days’ notice.' },
    none: { label: 'No care plan for now', monthly: 0, months: 0, total: 0 }
  };
  function selection() {
    const card = byId(option.value);
    const plan = carePlans[care.value];
    if (!card || !plan) return null;
    const fee = Number(clean(card.querySelector('.price').textContent).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(fee) || fee <= 0) return null;
    return { option: option.selectedOptions[0].textContent, project_id: option.value,
      fee, deposit: fee / 2, final_payment_timing: finalPaymentTiming, agreement_type: 'Project and selected care agreement',
      care: { id: care.value, ...plan, start_condition: plan.months ? `Billed monthly from the agreed start date, with a 3-month minimum. ${plan.renewal}` : 'No care commitment.' } };
  }
  function updateSummary() {
    const selected = selection();
    byId('acceptance-summary').textContent = selected
      ? `Selected project: ${selected.option}\nProject investment: ${money(selected.fee)}\nInitial invoice: ${money(selected.deposit)} (50%). Remaining invoice: ${money(selected.deposit)} (50%). Both due within 7 days of issue. ${selected.final_payment_timing}\n` +
        (selected.care.months ? `Care: ${selected.care.label}. ${selected.care.months}-month minimum: $${selected.care.total.toLocaleString('en-US')}, billed monthly from the agreed start date. ${selected.care.renewal}` : 'Ongoing care: none selected.') +
        '\nYour signature accepts the selected project, care commitment if chosen, and terms in Details.'
      : '';
  }
  function invalidate() {
    if (pending || accepted) return;
    cachedRecord = undefined;
    cachedPDF = undefined;
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

  function careBlocks(selected) {
    if (!selected.care.months) return [];
    const blocks = [{ type: 'heading', text: selected.care.label, level: 4 }];
    byId('care-comparison').querySelectorAll('tbody tr').forEach(row => {
      const label = clean(row.querySelector('th').textContent);
      let value = clean(row.querySelector(`[data-care="${selected.care.id}"]`).textContent);
      if (selected.care.id === 'growth' && label === 'Shopify upkeep') {
        value = clean(row.querySelector('[data-care="site"]').textContent);
      }
      blocks.push({ type: 'paragraph', text: `${label}: ${value}` });
    });
    Array.from(byId('ongoing-care').children).filter(node => node.tagName === 'P')
      .forEach(node => blocks.push(...captureBlocks(node)));
    return blocks;
  }

  async function buildRecord() {
    const selected = selection();
    if (!selected || !consent.checked) throw new Error('Choose your option and care plan, then check the acceptance box.');
    if (!window.crypto?.subtle || !window.crypto.randomUUID) throw new Error('Please open this proposal over HTTPS in a current browser to sign, or use the email link at the bottom of this proposal.');
    const tier = Number(option.value.slice(-1));
    const scope = Array.from({ length: tier }, (_, index) => textOf(`#opt${index + 1}`));
    const documentSnapshot = {
      version: 'SPRING-SWEET-2026-11-20-agreement-v2', title: document.title,
      selected_project: selected, included_options: scope,
      scope_and_exclusions: textOf('#scope'), timeline: textOf('#timeline'),
      payment: textOf('#payment'), assumptions: textOf('#assumptions'), terms: textOf('#proposal-details'),
      care_details: 'No care plan selected.'
    };
    const selectedCareBlocks = careBlocks(selected);
    if (selected.care.months) documentSnapshot.care_details = selectedCareBlocks.map(block => block.text).join('\n\n');
    documentSnapshot.readable_sections = {
      included_options: Array.from({ length: tier }, (_, index) => ({
        title: `Option ${index + 1}: ${textOf(`#opt${index + 1} h3`)}`,
        blocks: captureBlocks(byId(`opt${index + 1}`))
      })),
      scope_and_exclusions: captureBlocks(byId('scope')),
      timeline: captureBlocks(byId('timeline')),
      payment: captureBlocks(byId('payment')),
      assumptions: captureBlocks(byId('assumptions')),
      terms: captureBlocks(byId('proposal-details')),
      care_details: []
    };
    documentSnapshot.readable_sections.care_details = selectedCareBlocks;
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
    const { signature_png, ...textEvidence } = record;
    const encoded = new TextEncoder().encode(JSON.stringify(textEvidence));
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
      status.textContent = 'This proposal has unfinished details or an unavailable submission connection. Please use the email link below for help. Nothing was sent.';
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
      if (!window.jspdf?.jsPDF) throw new Error('The PDF tool hasn’t loaded. Please refresh this page or use the email link below. Nothing was sent.');
      cachedRecord ||= await buildRecord();
      const record = cachedRecord;
      cachedPDF ||= createPDF(record).output('blob');
      const payload = new FormData();
      payload.append('name', record.signer_name);
      payload.append('email', record.signer_email);
      payload.append('role', record.signer_role);
      payload.append('project_option', record.selected.option);
      payload.append('monthly_option', record.selected.care.label);
      payload.append('care_monthly_total', String(record.selected.care.monthly));
      payload.append('care_minimum_months', String(record.selected.care.months));
      payload.append('care_initial_commitment', String(record.selected.care.total));
      payload.append('note', record.signer_note);
      payload.append('organization', record.organization);
      payload.append('_subject', 'Spring Sweet · Signed proposal acceptance');
      payload.append('acceptance_id', record.acceptance_id);
      payload.append('agreement_type', record.selected.agreement_type);
      payload.append('project_fee', money(record.selected.fee));
      payload.append('initial_invoice', money(record.selected.deposit));
      payload.append('final_invoice', money(record.selected.deposit));
      payload.append('final_payment_timing', record.selected.final_payment_timing);
      payload.append('care_start_condition', record.selected.care.start_condition);
      payload.append('document_version', record.document.version);
      payload.append('evidence_sha256', record.evidence_sha256);
      const { signature_png, ...textRecord } = record;
      payload.append('acceptance_record', JSON.stringify(textRecord));
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
      confirmedPDF = cachedPDF;
      status.textContent = 'Thank you. Your signed acceptance was received. I’ll send the initial invoice and get in touch about kickoff.';
      status.dataset.state = 'success';
      byId('acceptance-reference').textContent = `Reference: ${record.acceptance_id}. Signed ${new Date(record.signed_at_browser_utc).toLocaleString()}. Project fee: ${money(record.selected.fee)}. ` + (record.selected.care.months ? `${record.selected.care.label}; 3-month minimum: ${money(record.selected.care.total)}.` : 'No care plan selected.');
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
    if (!confirmedRecord || !confirmedPDF) return;
    const feedback = byId('acceptance-download-status');
    try {
      // Download the PDF prepared with this acceptance, without regenerating its contents.
      const url = URL.createObjectURL(confirmedPDF);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${confirmedRecord.acceptance_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      feedback.textContent = 'Your PDF copy is ready. Keep it with your records.';
    } catch (error) { feedback.textContent = error.message; }
  });
  [option, care].forEach(control => control.addEventListener('change', () => {
    consent.checked = false;
  }));
  // PDF layout helpers keep the investment, signature, scope, and terms distinct.
  function createPDF(record) {
    const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
    const page = { width: 612, height: 792, margin: 52, bottom: 728 };
    const contentWidth = page.width - page.margin * 2;
    const colors = { navy: [23, 22, 20], text: [69, 64, 58], muted: [91, 85, 77], line: [190, 186, 178] };
    let y = 112;

    // Standard PDF fonts support Latin characters; normalize punctuation for readability.
    const plain = value => String(value || '')
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
      .replace(/[^\x20-\x7e\xa0-\xff\n]/g, ' ');
    const stamp = value => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? plain(value) : date.toLocaleString('en-US', {
        timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      }) + ' UTC';
    };
    function setText(size = 10.5, weight = 'normal', color = colors.text) {
      pdf.setFont('helvetica', weight); pdf.setFontSize(size); pdf.setTextColor(...color);
    }
    function header(first = false) {
      pdf.setFillColor(...colors.navy);
      pdf.rect(0, 0, page.width, first ? 88 : 60, 'F');
      setText(10, 'bold', [255, 255, 255]);
      pdf.text('17C STUDIO  /  SPRING SWEET', page.margin, 28);
      pdf.setFont('times', 'normal'); pdf.setFontSize(first ? 25 : 16);
      pdf.text('Signed proposal acceptance', page.margin, first ? 62 : 47);
    }
    function newPage() { pdf.addPage(); header(); y = 88; }
    function ensure(height) { if (y + height > page.bottom) newPage(); }
    function paragraph(text, { size = 10.5, bold = false, color = colors.text, indent = 0, after = 10 } = {}) {
      setText(size, bold ? 'bold' : 'normal', color);
      const lines = pdf.splitTextToSize(plain(text), contentWidth - indent);
      const leading = size * 1.55;
      for (const line of lines) {
        ensure(leading);
        // A page break redraws the header, so restore the body style for every line.
        setText(size, bold ? 'bold' : 'normal', color);
        pdf.text(line, page.margin + indent, y);
        y += leading;
      }
      y += after;
    }
    function sectionHeading(text, freshPage = false) {
      if (freshPage) newPage();
      ensure(86);
      y += 6;
      pdf.setDrawColor(...colors.line); pdf.line(page.margin, y, page.width - page.margin, y);
      y += 24;
      pdf.setFont('times', 'normal'); pdf.setFontSize(22); pdf.setTextColor(...colors.navy);
      pdf.text(plain(text), page.margin, y);
      y += 24;
    }
    function subheading(text) {
      // Reserve room for the heading and the beginning of its answer.
      ensure(68); y += 7;
      paragraph(text, { size: 11.5, bold: true, color: colors.navy, after: 6 });
    }
    function bullet(text) {
      ensure(32);
      setText(10.5, 'bold', colors.navy); pdf.text('-', page.margin, y);
      paragraph(text, { indent: 14, after: 9 });
    }
    function keyValue(label, value) {
      setText(10.5);
      const lines = pdf.splitTextToSize(plain(value), contentWidth - 144);
      const height = Math.max(22, lines.length * 16 + 4);
      ensure(height);
      setText(10, 'normal', colors.muted); pdf.text(label, page.margin, y);
      setText(10.5, 'bold', colors.navy); pdf.text(lines, page.margin + 144, y);
      y += height;
    }
    function renderBlocks(blocks, fallback, { skipHeading = true } = {}) {
      if (!Array.isArray(blocks) || !blocks.length) {
        String(fallback || '').split(/\n\s*\n/).filter(Boolean).forEach(text => paragraph(text));
        return;
      }
      let firstHeading = true;
      for (const block of blocks) {
        if (block.type === 'heading') {
          if (skipHeading && firstHeading) { firstHeading = false; continue; }
          firstHeading = false; subheading(block.text);
        } else if (block.type === 'bullet') {
          bullet(block.text);
        } else if (block.type === 'row') {
          // Individual labeled rows remain readable without a dense, narrow table.
          paragraph(block.cells.join('  |  '), { size: 10, after: 12 });
        } else {
          paragraph(block.text);
        }
      }
    }

    // Page 1: the decision, payment amounts, and the signature in one place.
    header(true);
    paragraph(record.organization, { size: 12, bold: true, color: colors.navy, after: 10 });
    keyValue('Signed by', record.signer_name + (record.signer_role ? ', ' + record.signer_role : ''));
    keyValue('Email', record.signer_email);
    keyValue('Date signed', stamp(record.signed_at_browser_utc));
    sectionHeading('Your investment');
    keyValue('Selected project', record.selected.option);
    keyValue('Selection type', record.selected.agreement_type);
    keyValue('Project fee', money(record.selected.fee));
    keyValue('Initial invoice (50%)', money(record.selected.deposit));
    keyValue('Remaining 50%', money(record.selected.deposit));
    keyValue('Invoice due dates', `Initial invoice due within 7 days of issue. ${record.selected.final_payment_timing}`);
    const plan = record.selected.care;
    keyValue('Ongoing care', plan.months
      ? `${plan.label}. 3-month minimum: ${money(plan.total)}. ${plan.start_condition}`
      : 'No care plan selected.');
    sectionHeading('Electronic signature');
    paragraph(record.electronic_consent, { size: 10, after: 14 });
    ensure(record.signature_png ? 122 : 64);
    pdf.setFont('times', 'italic'); pdf.setFontSize(25); pdf.setTextColor(...colors.navy);
    const signerLines = pdf.splitTextToSize(plain(record.signer_name), contentWidth);
    for (const line of signerLines) {
      ensure(30); pdf.setFont('times', 'italic'); pdf.setFontSize(25); pdf.setTextColor(...colors.navy);
      pdf.text(line, page.margin, y + 20); y += 30;
    }
    if (record.signature_png) { ensure(96); pdf.addImage(record.signature_png, 'PNG', page.margin, y, 300, 80); y += 92; }

    // Later pages: preserve the accepted content as headings, bullets, and paragraphs.
    const readable = record.document.readable_sections || {};
    sectionHeading('Included project scope');
    record.document.included_options.forEach((scope, index) => {
      const option = readable.included_options?.[index];
      subheading(option?.title || `Included option ${index + 1}`);
      renderBlocks(option?.blocks, scope);
    });
    for (const [title, key] of [
      ['Scope and boundaries', 'scope_and_exclusions'], ['Timeline', 'timeline'],
      ['Payment', 'payment'], ['Assumptions', 'assumptions'], ['Terms and ownership', 'terms']
    ]) {
      sectionHeading(title);
      renderBlocks(readable[key], record.document[key]);
    }
    if (plan.months) {
      sectionHeading('Ongoing care');
      renderBlocks(readable.care_details, record.document.care_details, { skipHeading: false });
    }

    // Keep evidence metadata out of the main reading flow, but retain it in the copy.
    sectionHeading('Acceptance details', true);
    keyValue('Reference', record.acceptance_id);
    keyValue('Document version', record.document.version);
    keyValue('Signed (browser UTC)', stamp(record.signed_at_browser_utc));
    keyValue('Delivery confirmation', 'See the receiving-service submission record.');
    if (record.signer_note) { subheading('Your note'); paragraph(record.signer_note); }
    subheading('Source document'); paragraph(record.page_url, { size: 9.5 });
    subheading('Evidence SHA-256'); paragraph(record.evidence_sha256, { size: 9, color: colors.muted });
    subheading('About this record');
    paragraph('This copy records the selected scope, commercial terms, and electronic signature. The receiving-service submission records the typed signature, consent, and selected options; this PDF and any drawn signature are retained there only when file uploads are enabled. Dates shown use the signer’s browser clock, not a trusted server timestamp. This is an electronic acceptance record, not a certificate-backed digital signature. This page does not collect an IP address. Keep the receiving-service record with this copy.', { size: 9.5, color: colors.muted });

    const pageCount = pdf.getNumberOfPages();
    for (let number = 1; number <= pageCount; number++) {
      pdf.setPage(number);
      pdf.setDrawColor(...colors.line); pdf.line(page.margin, 751, page.width - page.margin, 751);
      setText(8, 'normal', colors.muted);
      pdf.text('17C Studio | Spring Sweet', page.margin, 768);
      pdf.text(`${number} / ${pageCount}`, page.width - page.margin, 768, { align: 'right' });
    }
    pdf.setProperties({ title: 'Spring Sweet signed proposal acceptance', author: '17C Studio', subject: record.acceptance_id });
    return pdf;
  }

  updateSummary();
  submit.disabled = !window.jspdf?.jsPDF;
  if (submit.disabled) {
    status.textContent = 'The PDF tool could not load. Please refresh this page or use the email link above. Nothing has been submitted.';
    status.dataset.state = 'error';
  }
})();
