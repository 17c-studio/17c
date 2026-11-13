// Optional client-review layout. Shopping submits to Spring Sweet's own cart.
(() => {
  const section = document.querySelector('[data-ss-alternative]');
  if (!section) return;
  const tabs = [...section.querySelectorAll('[data-ss-alt-tab]')];
  const panels = [...section.querySelectorAll('[data-ss-alt-panel]')];
  const viewAll = section.querySelector('[data-ss-alt-view-all]');
  const status = section.querySelector('[data-ss-alt-status]');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const imageURL = source => {
    const url = new URL(source, 'https://springsweet.com');
    if (url.protocol !== 'https:' || !['cdn.shopify.com', 'springsweet.com'].includes(url.hostname)) return null;
    url.searchParams.set('width', '700');
    return url.href;
  };
  const initializeCard = async card => {
    if (card.dataset.ssAltInitialized) return;
    card.dataset.ssAltInitialized = 'true';
    const image = card.querySelector('[data-ss-alt-image]');
    const imageControls = card.querySelector('[data-ss-alt-image-controls]');
    const form = card.querySelector('[data-ss-alt-form]');
    const select = card.querySelector('[data-ss-alt-variant]');
    const fallback = card.querySelector('[data-ss-alt-fallback]');
    const price = card.querySelector('[data-ss-alt-price]');
    const soldOut = card.querySelector('[data-ss-alt-sold-out]');
    let images = JSON.parse(card.dataset.ssAltImages).map(imageURL).filter(Boolean);
    let imageIndex = 0;
    const showImage = direction => {
      imageIndex = (imageIndex + direction + images.length) % images.length;
      image.src = images[imageIndex];
    };
    card.querySelector('[data-ss-alt-image-prev]').addEventListener('click', () => showImage(-1));
    card.querySelector('[data-ss-alt-image-next]').addEventListener('click', () => showImage(1));
    imageControls.hidden = images.length < 2;
    try {
      const url = new URL(`/products/${encodeURIComponent(card.dataset.ssAltProduct)}.js`, 'https://springsweet.com');
      url.searchParams.set('currency', 'USD');
      const response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Product unavailable');
      const product = await response.json();
      if (!product.title || !Number.isFinite(product.price) || !Array.isArray(product.variants) || !product.variants.length) throw new Error('Incomplete product');
      card.querySelector('[data-ss-alt-title]').textContent = product.title;
      image.alt = product.title;
      price.textContent = `${product.price_varies ? 'From ' : ''}${money.format(product.price / 100)}`;
      const currentImages = (product.images || []).map(imageURL).filter(Boolean);
      if (currentImages.length) {
        images = currentImages;
        imageIndex = 0;
        image.src = images[0];
        imageControls.hidden = images.length < 2;
      }
      const variants = product.variants.filter(variant => Number.isSafeInteger(variant.id) && Number.isFinite(variant.price));
      if (!variants.length) throw new Error('No valid variants');
      const available = variants.filter(variant => variant.available === true);
      soldOut.hidden = available.length !== 0;
      if (!available.length) {
        fallback.textContent = 'View details';
        return;
      }
      if (variants.length > 1) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Choose size / option';
        select.append(placeholder);
      }
      variants.forEach(variant => {
        const option = document.createElement('option');
        option.value = String(variant.id);
        option.textContent = `${variant.title} — ${money.format(variant.price / 100)}${variant.available ? '' : ' · Sold out'}`;
        option.disabled = variant.available !== true;
        select.append(option);
      });
      if (variants.length === 1) {
        select.value = String(available[0].id);
        select.hidden = true;
        card.querySelector('.ss-alternative-variant-label').hidden = true;
      }
      select.addEventListener('change', () => {
        const variant = available.find(item => String(item.id) === select.value);
        if (!variant) return;
        price.textContent = money.format(variant.price / 100);
        const source = variant.featured_image?.src;
        const selectedImage = source && imageURL(source);
        if (selectedImage) {
          image.src = selectedImage;
          const position = images.indexOf(selectedImage);
          if (position !== -1) imageIndex = position;
        }
      });
      // Native validation requires a real option before navigating to the store cart.
      form.addEventListener('submit', event => {
        if (!available.some(variant => String(variant.id) === select.value)) {
          event.preventDefault();
          select.reportValidity();
        }
      });
      form.hidden = false;
      fallback.hidden = true;
    } catch {
      // Keep the real product link usable if price/stock cannot be verified.
      form.hidden = true;
      fallback.hidden = false;
    }
  };
  const activate = (index, announce = true) => {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    viewAll.href = tabs[index].href;
    viewAll.setAttribute('aria-label', `View all ${tabs[index].textContent.trim()}`);
    panels[index].querySelectorAll('[data-ss-alt-product]').forEach(initializeCard);
    if (announce) status.textContent = `Showing ${tabs[index].textContent.trim()}`;
  };
  section.querySelector('[data-ss-alt-tablist]').setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].tabIndex = 0;
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activate(index);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next);
      tabs[next].focus();
    });
  });
  section.classList.add('ss-alternative-enhanced');
  activate(0, false);
})();
