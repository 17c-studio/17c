# Wishlist Formspree delivery

The inquiry forms on `services.html` and `index.html` use `https://formspree.io/f/xoejkyvk`. This site uses plain HTML, CSS, and JavaScript with no bundler or backend. `wishlist.js` submits JSON with `fetch` and `Accept: application/json`, adapting the Vanilla JS AJAX approach to the existing wishlist behavior without adding a library.

Both forms collect required name, email, and project message, plus optional organization. The “Include my wishlist” checkbox attaches readable selections grouped by service. Inquiries also work without selected items. JavaScript provides inline validation, loading, field-level server errors, and success/failure feedback. A failed or timed-out request keeps contact input and selections in the current page. Successful acceptance resets the form and removes only submitted selections. Acceptance does not guarantee inbox delivery.

Without JavaScript, the form submits directly to Formspree using its `action` and `method="post"`; saved wishlist selections require JavaScript. Required inputs use native validation in this mode.

## Shared assets

Deploy `wishlist.js`, `wishlist.css`, and `wishlist-catalog.js` alongside both pages. The shared catalog resolves existing saved selection IDs on the homepage. When service checkbox IDs or labels change, update the matching entries in `wishlist-catalog.js` too.

Only selection IDs are stored in localStorage under `17c-project-wishlist-v1`. Contact details are not persisted. The public Formspree ID is configuration; no API key or server credentials are needed.

## Verify delivery

In the Formspree dashboard, confirm the intended recipient is verified and the deployed site domain is allowed if domain restrictions are enabled. Submit a test inquiry from the hosted site and confirm it arrives in the intended inbox. Check both forms with and without wishlist inclusion, and verify that failed submissions retain input and selections.

[Formspree AJAX documentation](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/).
