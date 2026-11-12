(() => {
  const printButton = document.querySelector('.print-button');
  printButton.hidden = false;
  printButton.addEventListener('click', () => window.print());

  // Keep the section index aligned with the chapter currently being read.
  const links = [...document.querySelectorAll('.proposal-index a')];
  const sections = links.map(link => document.querySelector(link.hash));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const current = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target.id;
      links.forEach(link => {
        if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-5% 0px -55% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  // Include every project detail in a printed or PDF copy, then restore the view.
  let previousDisclosureState;
  window.addEventListener('beforeprint', () => {
    if (previousDisclosureState) return;
    previousDisclosureState = [...document.querySelectorAll('details')].map(element => ({ element, open: element.open }));
    previousDisclosureState.forEach(({ element }) => { element.open = true; });
  });
  window.addEventListener('afterprint', () => {
    previousDisclosureState?.forEach(({ element, open }) => { element.open = open; });
    previousDisclosureState = undefined;
  });
})();
