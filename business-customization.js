window.studioBusinessReady = (async () => {
      await window.studioProspectReady;
      if (new URLSearchParams(window.location.search).get('for') || window.studioProspect) return;
      document.querySelector('.customization')?.removeAttribute('hidden');
      // Change this key if your project needs its own saved business name.
      const storageKey = 'business-customization';
      const toggle = document.querySelector('#customization-toggle');
      const panel = document.querySelector('#customization-panel');
      const form = document.querySelector('#customization-form');
      if (!toggle || !panel || !form) return;
      const customization = toggle.closest('.customization');
      const header = document.querySelector('.header');
      const cover = document.querySelector('.cover');
      const mobile = window.matchMedia('(max-width: 700px)');
      const placeCustomization = () => {
        const parent = mobile.matches ? cover : header;
        if (parent && customization) parent.append(customization);
      };
      placeCustomization();
      mobile.addEventListener('change', placeCustomization);
      const business = form.elements.business;
      const counter = document.querySelector('#business-counter');
      const error = document.querySelector('#customization-error');
      const normalize = value => typeof value === 'string' ? value.trim().slice(0, 20).trim() : '';
      let saved = '';
      try { saved = normalize(localStorage.getItem(storageKey)); } catch { /* Use original copy. */ }

      const applyBusiness = () => {
        window.studioCustomBusiness = saved;
        window.dispatchEvent(new Event('studio:business-change'));
      };
      const count = () => {
        business.value = business.value.slice(0, 20);
        counter.textContent = `${business.value.length} / 20`;
      };
      const restore = () => {
        business.value = saved;
        count();
        error.textContent = '';
      };
      const close = (returnFocus = false) => {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (returnFocus) toggle.focus();
      };
      toggle.addEventListener('click', () => {
        if (!panel.hidden) return close(true);
        restore();
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        business.focus();
      });
      document.addEventListener('pointerdown', event => {
        if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close();
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) {
          event.preventDefault();
          close(true);
        }
      });
      // Non-modal popup: Tab can continue into the rest of the page.
      document.addEventListener('focusin', event => {
        if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close();
      });
      business.addEventListener('input', count);
      form.addEventListener('submit', event => {
        event.preventDefault();
        const next = normalize(business.value);
        try { localStorage.setItem(storageKey, next); }
        catch {
          error.textContent = 'Your browser could not save these changes. Please allow site storage and try again.';
          return;
        }
        saved = next;
        applyBusiness();
        close(true);
      });
      restore();
      applyBusiness();
    })();
