// A draft can always be saved or copied; browsers cannot detect an email app.
(() => {
  const drafts = new WeakMap();
  window.clearEmailDraft = form => {
    const previous = drafts.get(form);
    if (!previous) return;
    URL.revokeObjectURL(previous.url);
    previous.region.remove();
    drafts.delete(form);
  };
  window.prepareEmailDraft = (form, { to, subject, body }) => {
    window.clearEmailDraft(form);
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const text = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const region = document.createElement('div');
    region.className = 'email-draft-fallback';
    const note = document.createElement('p');
    note.textContent = 'No email app? Save or copy this draft and send it using your webmail. Nothing has been sent yet.';
    const save = document.createElement('a');
    save.href = url; save.download = '17C-project-inquiry.txt'; save.textContent = 'Save inquiry as a text file';
    const details = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'View or copy your email draft';
    const draft = document.createElement('textarea');
    draft.readOnly = true; draft.value = text; draft.setAttribute('aria-label', 'Prepared email draft');
    details.append(summary, draft);
    // Keep the encoded link available for retrying an email app without retyping.
    const open = document.createElement('a'); open.href = mailto; open.textContent = 'Open prepared email draft';
    region.append(note, open, document.createElement('br'), save, details);
    form.append(region);
    drafts.set(form, { url, region });
    return mailto;
  };
})();
