/* Electronic proposal acceptance. Evidence is submitted to Formspree, never localStorage.
   Browser timestamps/hashes are evidence fields, not a trusted IP or certificate. */
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
  const context = canvas.getContext('2d');
  const consent = byId('accept-consent');
  let drawing = false, pointerId, hasInk = false, pending = false, accepted = false;
  let cachedRecord, confirmedRecord;
  const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
  const textOf = selector => clean(document.querySelector(selector)?.textContent);
  const money = value => '$' + Number(value).toLocaleString('en-US');
  const carePlans = {
    six: { label: '6-month care plan', monthly: 600, months: 6 },
    twelve: { label: '12-month care plan', monthly: 500, months: 12 },
    none: { label: 'No care plan', monthly: 0, months: 0 }
  };
  function selection() {
    const card = byId(option.value);
    const plan = carePlans[care.value];
    if (!card || !plan) return null;
    const fee = Number(card.querySelector('.price').textContent.replace(/[^\d.]/g, ''));
    return { option: option.selectedOptions[0].textContent, fee, deposit: fee / 2,
      care: { ...plan, total: plan.monthly * plan.months } };
  }
  function updateSummary() {
    const selected = selection();
    byId('acceptance-summary').textContent = selected
      ? `Project fee: ${money(selected.fee)}\nInitial invoice: ${money(selected.deposit)} (50%). Final invoice at launch: ${money(selected.deposit)}.\n` +
        (selected.care.months ? `Care: ${money(selected.care.monthly)}/month for ${selected.care.months} months (${money(selected.care.total)} initial commitment), starting at launch.` : 'Ongoing care: none selected.')
      : '';
  }
  function invalidate() {
    if (pending || accepted) return;
    cachedRecord = undefined;
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
  async function buildRecord() {
    const selected = selection();
    if (!selected || !consent.checked) throw new Error('Choose your option and care plan, then check the acceptance box.');
    if (!window.crypto?.subtle || !window.crypto.randomUUID) throw new Error('Please open this proposal over HTTPS in a current browser to sign, or email mariel@17c.studio.');
    const tier = Number(option.value.slice(-1));
    const scope = Array.from({ length: tier }, (_, index) => textOf(`#opt${index + 1}`));
    const documentSnapshot = {
      version: 'ZCS-2026-10-21-esign-v1', title: document.title,
      selected_project: selected, included_options: scope,
      scope_and_exclusions: textOf('#scope'), timeline: textOf('#timeline'),
      payment: textOf('#payment'), assumptions: textOf('#assumptions'), terms: textOf('#terms'),
      care_details: 'No care plan selected.'
    };
    // Retain only the care subsection, not the surrounding investment options.
    if (selected.care.months) {
      const careText = [];
      for (let node = byId('care-plan').nextElementSibling; node; node = node.nextElementSibling) careText.push(clean(node.textContent));
      documentSnapshot.care_details = careText.join('\n\n');
    }
    const record = {
      acceptance_id: 'ZCS-' + window.crypto.randomUUID(),
      signed_at_browser_utc: new Date().toISOString(),
      signer_name: byId('name').value.trim(), signer_email: byId('email').value.trim(),
      signer_role: byId('signer-title').value.trim(), organization: 'Zeeland Christian School',
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
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || accepted || !form.reportValidity()) return;
    if (!byId('name').value.trim()) { byId('name').focus(); return; }
    pending = true; drawing = false;
    const controls = Array.from(form.querySelectorAll('input,select,textarea,button'));
    const disabled = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Recording acceptance…';
    status.textContent = 'Submitting your signed acceptance…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      cachedRecord ||= await buildRecord();
      const record = cachedRecord;
      const payload = {
        name: record.signer_name, email: record.signer_email, title: record.signer_role,
        submission_type: 'Signed proposal acceptance', acceptance_id: record.acceptance_id,
        signed_at_browser_utc: record.signed_at_browser_utc,
        option: record.selected.option, project_fee: money(record.selected.fee),
        care: `${record.selected.care.label}; ${money(record.selected.care.monthly)}/month; ${record.selected.care.months} months`,
        consent: record.electronic_consent, evidence_sha256: record.evidence_sha256,
        accepted_document: JSON.stringify(record),
        signature_image_data_url: record.signature_png || 'Typed name and affirmative consent; no drawing added.'
      };
      const response = await fetch(form.action, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok === false) throw new Error('The receiving service did not confirm your acceptance. Please contact mariel@17c.studio before trying again.');
      accepted = true;
      confirmedRecord = { ...record, receipt_confirmed_at_browser_utc: new Date().toISOString() };
      status.textContent = 'Thank you. Your signed acceptance was received. I’ll send the initial invoice and get in touch about kickoff.';
      status.dataset.state = 'success';
      byId('acceptance-reference').textContent = `Reference: ${record.acceptance_id}. Signed ${new Date(record.signed_at_browser_utc).toLocaleString()}.`;
      byId('acceptance-receipt').hidden = false;
      byId('download-acceptance-pdf').disabled = false;
      byId('download-acceptance-record').disabled = false;
    } catch (error) {
      status.textContent = error.name === 'AbortError' || error instanceof TypeError
        ? 'I couldn’t confirm your acceptance was received. Your details are still here. Please contact mariel@17c.studio before submitting again.'
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
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  byId('download-acceptance-record').addEventListener('click', () => {
    if (!confirmedRecord) return;
    downloadBlob(new Blob([JSON.stringify(confirmedRecord, null, 2)], { type: 'application/json' }), `${confirmedRecord.acceptance_id}.json`);
  });
  byId('download-acceptance-pdf').addEventListener('click', () => {
    if (!confirmedRecord) return;
    const feedback = byId('acceptance-download-status');
    try {
      if (!window.jspdf?.jsPDF) throw new Error('The PDF tool hasn’t loaded. Try again, or download the acceptance record while you’re here.');
      createPDF(confirmedRecord).save(`${confirmedRecord.acceptance_id}.pdf`);
      feedback.textContent = 'Your PDF copy is ready. Keep it with your records.';
    } catch (error) { feedback.textContent = error.message; }
  });
  function createPDF(record) {
    const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 44, width = 524, bottom = 738;
    let y = 124;
    const plain = value => String(value || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e\xa0-\xff\n]/g, ' ');
    function header() {
      pdf.setFillColor(12, 36, 68); pdf.rect(0, 0, 612, 92, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
      pdf.text('17C STUDIO  /  ZEELAND CHRISTIAN SCHOOL', margin, 32);
      pdf.setFont('times', 'normal'); pdf.setFontSize(24); pdf.text('Signed proposal acceptance', margin, 64);
    }
    function ensure(height) { if (y + height > bottom) { pdf.addPage(); header(); y = 120; } }
    function paragraph(text, size = 10, bold = false) {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(plain(text), width);
      for (const line of lines) { ensure(size * 1.5); pdf.setTextColor(40, 37, 32); pdf.text(line, margin, y); y += size * 1.5; }
      y += 8;
    }
    function heading(text) { ensure(50); y += 12; paragraph(text, 13, true); }
    header();
    paragraph(record.acceptance_id, 10, true);
    paragraph(`Signed by: ${record.signer_name}${record.signer_role ? ', ' + record.signer_role : ''}\nEmail: ${record.signer_email}\nFor: ${record.organization}\nSigned at (browser UTC): ${record.signed_at_browser_utc}`);
    heading('Your selected investment');
    paragraph(`${record.selected.option}\nFixed project fee: ${money(record.selected.fee)}\nInitial invoice: ${money(record.selected.deposit)}\nFinal invoice at launch: ${money(record.selected.deposit)}`);
    const plan = record.selected.care;
    paragraph(plan.months ? `${plan.label}: ${money(plan.monthly)}/month for ${plan.months} months (${money(plan.total)} initial commitment), starting at launch.` : 'No ongoing care plan selected.');
    heading('Electronic signature and consent'); paragraph(record.electronic_consent);
    pdf.setFont('times', 'italic'); pdf.setFontSize(25); ensure(42); pdf.text(plain(record.signer_name), margin, y + 22); y += 42;
    if (record.signature_png) { ensure(105); pdf.addImage(record.signature_png, 'PNG', margin, y, 300, 80); y += 95; }
    if (record.signer_note) { heading('Signer note'); paragraph(record.signer_note); }
    heading('Included project scope'); record.document.included_options.forEach(scope => paragraph(scope));
    for (const [title, value] of [
      ['Scope and exclusions', record.document.scope_and_exclusions], ['Timeline', record.document.timeline],
      ['Payment', record.document.payment], ['Assumptions', record.document.assumptions],
      ['Short terms', record.document.terms], ['Ongoing care', record.document.care_details]
    ]) { heading(title); paragraph(value); }
    heading('Acceptance record');
    paragraph(`Document version: ${record.document.version}\nSource: ${record.page_url}\nSHA-256 of submitted evidence (before this hash field): ${record.evidence_sha256}\nReceipt confirmed (browser UTC): ${record.receipt_confirmed_at_browser_utc}`);
    paragraph('This copy contains the terms and selections submitted to Formspree. Dates shown are browser-clock readings, not trusted server timestamps. This is an electronic acceptance record, not a certificate-backed digital signature. IP address was not collected by this page. Retain the receiving-service record alongside this copy.', 9);
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      pdf.setPage(page); pdf.setDrawColor(119, 113, 106); pdf.line(margin, 754, 568, 754);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(80, 75, 68);
      pdf.text(`17C Studio | ${record.acceptance_id}`, margin, 771);
      pdf.text(`${page} / ${pages}`, 568, 771, { align: 'right' });
    }
    pdf.setProperties({ title: 'ZCS signed proposal acceptance', author: '17C Studio', subject: record.acceptance_id });
    return pdf;
  }
  updateSummary();
  submit.disabled = false;
})();
