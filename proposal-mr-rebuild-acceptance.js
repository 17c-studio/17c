/* Electronic proposal acceptance and portal scoping requests. Essentials go to Formspree; the signed PDF is available to download.
   Browser timestamps/hashes are evidence fields, not a trusted IP or certificate. */
(() => {
  'use strict';
  // Enable only after file uploads and submission storage are enabled in Formspree.
  const uploadAttachments = false;
  const form = document.getElementById('reply');
  if (!form) return;
  const byId = id => document.getElementById(id);
  const status = byId('reply-status');
  const submit = byId('accept-submit');
  const option = byId('option');
  const canvas = byId('signature-pad');
  let context;
  try { context = canvas?.getContext('2d'); } catch (_) { /* Typed signatures still work without canvas. */ }
  const consent = byId('accept-consent');
  let drawing = false, pointerId, hasInk = false, pending = false, accepted = false;
  let cachedRecord, cachedPDF, confirmedRecord, confirmedPDF;
  const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
  const textOf = selector => clean(document.querySelector(selector)?.textContent);
  const money = value => Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2, maximumFractionDigits: 2 });
  const care = byId('care');
  const projects = {
    opt1: { fee: 2250, platform: 'Wix' },
    opt2: { fee: 6500, platform: 'WordPress' },
    opt3: { fee: null, estimate_from: 17000, platform: 'To be scoped' }
  };
  function selection() {
    const project = projects[option.value];
    if (!project || !['base','growth','full','none'].includes(care.value)) return null;
    // Portal care requires its own scope; do not silently apply website-only rates.
    if (option.value === 'opt3' && care.value !== 'none') return null;
    const monthly = care.value === 'base' ? (option.value === 'opt1' ? 175 : 225)
      : care.value === 'growth' ? 425 : care.value === 'full' ? 815 : 0;
    const label = {base:'Base Care',growth:'Growth Care',full:'Full Care',none:'No care plan for now'}[care.value];
    return {
      option: option.selectedOptions[0].textContent, project_id: option.value,
      ...project, deposit: project.fee === null ? null : project.fee / 2,
      agreement_type: option.value === 'opt3' ? 'Scoping call request; no project or care acceptance' : 'Project and selected care agreement',
      care: { id: care.value, label, monthly, months: monthly ? 3 : 0, total: monthly * 3,
        start_condition: monthly ? 'Begins on the agreed start date, with a three-month minimum, then month to month at the selected rate and 30 days notice to end after the minimum.' : 'No care commitment.' }
    };
  }
  function updateSummary() {
    const portal = option.value === 'opt3';
    for (const item of care.options) {
      if (['base','growth','full'].includes(item.value)) item.disabled = portal;
      if (item.value === 'base') item.textContent = option.value === 'opt1'
        ? 'Base Care · Wix · $175/month' : option.value === 'opt2'
          ? 'Base Care · WordPress · $225/month' : portal
            ? 'Base Care · Portal maintenance quoted separately'
            : 'Base Care · Choose a project to see the platform rate';
    }
    if (portal) care.value = 'none';
    const selected = selection();
    byId('acceptance-summary').textContent = selected
      ? (selected.fee === null
        ? `Portal scoping request: starting estimate ${money(selected.estimate_from)}. Not a fixed quote. Portal care will be scoped separately.\n`
        : `Selected project: ${selected.option}\nFixed project fee: ${money(selected.fee)}. Initial invoice: ${money(selected.deposit)} (50%), sent the same day you sign. Final invoice at handoff: ${money(selected.deposit)} (50%). Both due within 7 days.\n`) +
        (selected.care.months
          ? `Selected care: ${selected.care.label}, ${money(selected.care.monthly)}/month. Three-month minimum: ${money(selected.care.total)}, billed monthly from the agreed start date. Then month to month at the same rate, with 30 days notice to end after the minimum.\n`
          : 'No care plan selected.\n') +
        (selected.fee === null ? 'This signs a scoping request only. No fixed portal price or care commitment is accepted.' : 'Your signature accepts the selected project and care terms in Details. We’ll confirm page/project allowances and any care start date before kickoff. Payment is by invoice, not through this form.')
      : '';
    if (!pending && !accepted) submit.textContent = portal ? 'Request a scoping call' : 'Sign & accept proposal';
  }
  document.querySelectorAll('[data-open-details]').forEach(link => link.addEventListener('click', () => {
    byId('proposal-details').open = true;
  }));
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
        else blocks.push({ type: 'bullet', text: clean(Array.from(element.childNodes).map(node => node.textContent).join(' ')) });
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
    if (!selected || !consent.checked) throw new Error('Choose a project and care preference, then check the signature consent box.');
    if (!window.crypto?.subtle || !window.crypto.randomUUID) throw new Error('Please open this proposal over HTTPS in a current browser to sign, or use the email link at the bottom of this proposal.');
    const scopeIds = option.value === 'opt3' ? ['opt2', 'opt3'] : [option.value];
    const scope = scopeIds.map(id => textOf(`#${id}`));
    const documentSnapshot = {
      version: 'MRB-2026-11-11-agreement-v3', title: document.title,
      selected_project: selected, included_options: scope,
      scope_and_exclusions: textOf('#scope'), 
      payment: textOf('#payment'), assumptions: textOf('#assumptions'), terms: textOf('#terms'),
      care_details: 'No care plan selected.'
    };
    const careIds = selected.care.id === 'full' ? ['base-care-title','growth-care-title','full-care-title']
      : selected.care.id === 'growth' ? ['base-care-title','growth-care-title']
      : selected.care.id === 'base' ? ['base-care-title'] : [];
    const careCards = careIds.map(id => byId(id).parentElement);
    const careCommon = Array.from(document.querySelector('.care-add-on').children).filter(node => node.tagName === 'P');
    if (selected.care.months) documentSnapshot.care_details =
      [...careCards, ...careCommon].map(node => clean(node.textContent)).join('\n\n');
    documentSnapshot.readable_sections = {
      included_options: scopeIds.map(id => ({
        title: textOf(`#${id} h3`), blocks: captureBlocks(byId(id))
      })),
      scope_and_exclusions: captureBlocks(byId('scope')),
      payment: captureBlocks(byId('payment')),
      assumptions: captureBlocks(byId('assumptions')),
      terms: captureBlocks(byId('terms')),
      care_details: selected.care.months ? [...careCards, ...careCommon].flatMap(captureBlocks) : []
    };
    const record = {
      acceptance_id: 'MRB-' + window.crypto.randomUUID(),
      signed_at_browser_utc: new Date().toISOString(),
      signer_name: byId('name').value.trim(), signer_email: byId('email').value.trim(),
      signer_role: byId('signer-title').value.trim(), organization: 'Mr Rebuild',
      electronic_consent: textOf('#consent-wording'), authorized_signer_confirmed: true,
      page_url: /^https?:$/.test(window.location.protocol) ? window.location.origin + window.location.pathname : 'Local preview',
      selected, document: documentSnapshot,
      signature_png: hasInk ? canvas.toDataURL('image/png') : null,
      signer_note: byId('questions-text').value.trim(),
      timestamp_source: 'Signer browser clock; verify against Formspree receipt record.',
      ip_address: null, ip_source: 'Not collected by this page; verify receiving-service metadata separately.'
    };
    // The optional drawing is retained in the download-only PDF; hash the submitted text record.
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
    if (!selection()) { status.textContent = 'Choose a project and care preference. Portal care requires a separate quote.'; status.dataset.state = 'error'; status.focus(); return; }
    if (!byId('name').value.trim()) {
      byId('name').setCustomValidity('Please enter your full name to sign.');
      byId('name').reportValidity();
      return;
    }
    pending = true; drawing = false;
    const controls = Array.from(form.querySelectorAll('input,select,textarea,button'));
    const disabled = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    submit.textContent = option.value === 'opt3' ? 'Sending scoping request…' : 'Recording acceptance…';
    status.textContent = option.value === 'opt3' ? 'Sending your request for a scoping call…' : 'Submitting your signed acceptance…';
    let timeout, requestStarted = false;
    try {
      if (!window.jspdf?.jsPDF) throw new Error('The PDF tool hasn’t loaded. Please refresh this page and try again, or use the email link at the bottom of this proposal for help.');
      cachedRecord ||= await buildRecord();
      const record = cachedRecord;
      cachedPDF ||= createPDF(record).output('blob');
      const payload = new FormData();
      payload.append('name', record.signer_name);
      payload.append('email', record.signer_email);
      payload.append('role', record.signer_role);
      payload.append('project_option', record.selected.option);
      payload.append('monthly_option', record.selected.care.months
        ? `${record.selected.care.label}: ${money(record.selected.care.monthly)}/month`
        : record.selected.care.label);
      payload.append('note', record.signer_note);
      payload.append('organization', record.organization);
      payload.append('acceptance_id', record.acceptance_id);
      payload.append('_subject', record.selected.fee === null ? 'Mr Rebuild · Signed portal scoping request' : 'Mr Rebuild · Signed proposal acceptance');
      payload.append('agreement_type', record.selected.agreement_type);
      payload.append('project_fee', record.selected.fee === null ? 'Not fixed; estimate from $17,000; scoping required' : money(record.selected.fee));
      payload.append('initial_invoice', record.selected.deposit === null ? 'Scoping only; separate agreement required' : money(record.selected.deposit));
      payload.append('handoff_invoice', record.selected.deposit === null ? 'Scoping only; separate agreement required' : money(record.selected.deposit));
      payload.append('care_initial_commitment', money(record.selected.care.total));
      payload.append('care_start_condition', record.selected.care.start_condition || 'No care selected');
      payload.append('document_version', record.document.version);
      payload.append('evidence_sha256', record.evidence_sha256);
      const { signature_png, ...textRecord } = record;
      payload.append('acceptance_record', JSON.stringify(textRecord));
      payload.append('signature', `${record.signer_name}\nSigned (browser UTC): ${record.signed_at_browser_utc}\n${record.electronic_consent}`);
      // Text-only submissions work when the account does not permit file uploads.
      // The PDF still includes the optional drawing and remains available after success.
      if (uploadAttachments) {
        payload.append('signed_pdf', cachedPDF, `${record.acceptance_id}.pdf`);
        if (record.signature_png) {
          const bytes = Uint8Array.from(atob(record.signature_png.split(',')[1]), character => character.charCodeAt(0));
          payload.append('handwritten_signature', new Blob([bytes], { type: 'image/png' }), `${record.acceptance_id}-signature.png`);
        }
      }
      // Start the upload timeout after preparing the PDF, allowing for the service's 30-second limit.
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
      status.textContent = record.selected.fee === null
        ? 'Thank you. Your scoping call request was received. I’ll get in touch to review the website and portal requirements before quoting the build. No project or care commitment has been made.'
        : 'Thank you. Your signed acceptance was received. I’ll send the initial invoice the same day and get in touch about kickoff.';
      status.dataset.state = 'success';
      byId('acceptance-reference').textContent = `Reference: ${record.acceptance_id}. Signed ${new Date(record.signed_at_browser_utc).toLocaleString()}.`;
      byId('acceptance-receipt').hidden = false;
      byId('download-acceptance-pdf').disabled = false;
    } catch (error) {
      status.textContent = requestStarted && (error.name === 'AbortError' || error instanceof TypeError)
        ? 'I couldn’t confirm your acceptance was received. Your details are still here. Please use the email link at the bottom of this proposal before submitting again.'
        : error instanceof TypeError
          ? 'Your signed PDF could not be prepared. Nothing was submitted. Please refresh this page and try again, or use the email link at the bottom of this proposal.'
          : error.message;
      status.dataset.state = 'error';
    } finally {
      clearTimeout(timeout); pending = false; form.removeAttribute('aria-busy');
      controls.forEach((control, index) => {
        if (!accepted) control.disabled = disabled[index];
      });
      submit.textContent = accepted ? 'Signature recorded' : option.value === 'opt3' ? 'Request a scoping call' : 'Sign & accept proposal';
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
      pdf.text('17C STUDIO  /  MR REBUILD', page.margin, 28);
      pdf.setFont('times', 'normal'); pdf.setFontSize(first ? 25 : 16);
      pdf.text(record.selected.fee === null ? 'Signed portal scoping request' : 'Signed proposal acceptance', page.margin, first ? 62 : 47);
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
    keyValue('Project fee', record.selected.fee === null ? `Starting estimate: ${money(record.selected.estimate_from)}; not a fixed quote.` : money(record.selected.fee));
    if (record.selected.deposit !== null) {
      keyValue('Initial invoice (50%)', money(record.selected.deposit));
      keyValue('At handoff (50%)', money(record.selected.deposit));
      keyValue('Invoice due dates', 'Within 7 days of issue. Initial invoice sent the same day you sign.');
    }
    const plan = record.selected.care;
    keyValue('Ongoing care', plan.months
      ? `${plan.label}: ${money(plan.monthly)}/month. Three-month minimum: ${money(plan.total)}, billed monthly from the agreed start date. Then month to month at the selected rate, with 30 days notice to end after the minimum.`
      : 'No care plan selected.');
    if (record.selected.fee === null) paragraph('This is a signed scoping request, not a fixed portal build quote. A separate agreement is required before work begins.');
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
      ['Scope and boundaries', 'scope_and_exclusions'],
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
    paragraph('This copy records the selected scope, commercial terms, and electronic signature. Option 3 is a scoping request only and requires a separate fixed quote and agreement. The receiving-service submission records the typed signature, consent, and selected options; this PDF and any drawn signature are retained there only when file uploads are enabled. Dates shown use the signer’s browser clock, not a trusted server timestamp. This is an electronic acceptance record, not a certificate-backed digital signature. This page does not collect an IP address. Keep the receiving-service record with this copy.', { size: 9.5, color: colors.muted });

    const pageCount = pdf.getNumberOfPages();
    for (let number = 1; number <= pageCount; number++) {
      pdf.setPage(number);
      pdf.setDrawColor(...colors.line); pdf.line(page.margin, 751, page.width - page.margin, 751);
      setText(8, 'normal', colors.muted);
      pdf.text('17C Studio | Mr Rebuild', page.margin, 768);
      pdf.text(`${number} / ${pageCount}`, page.width - page.margin, 768, { align: 'right' });
    }
    pdf.setProperties({ title: record.selected.fee === null ? 'Mr Rebuild signed portal scoping request' : 'Mr Rebuild signed proposal acceptance', author: '17C Studio', subject: record.acceptance_id });
    return pdf;
  }

  updateSummary();
  submit.disabled = !window.jspdf?.jsPDF;
  if (submit.disabled) {
    status.textContent = 'The PDF tool could not load. Please refresh this page or use the email link above for help. Nothing has been submitted.';
    status.dataset.state = 'error';
  }
})();
