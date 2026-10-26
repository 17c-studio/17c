// Reduce basic address harvesting; this is obfuscation, not encryption.
// Static links lead to the Connect form when JavaScript is unavailable.
(() => {
  const address = atob('bWFyaWVsQDE3Yy5zdHVkaW8=');
  window.studioEmailAddress = address;
  document.querySelectorAll('a[data-email]').forEach(link => {
    const params = new URLSearchParams();
    if (link.dataset.emailSubject) params.set('subject', link.dataset.emailSubject);
    const query = params.toString();
    link.href = `mailto:${address}${query ? `?${query}` : ''}`;
  });
})();
