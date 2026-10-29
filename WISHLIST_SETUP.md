# Inquiry and wishlist delivery

`index.html`, `services.html`, and `form.html` POST to `https://formspree.io/f/xoejkyvk`. The public endpoint ID is configuration, not a secret API key.

`inquiry.js` provides shared field validation, a pending state with inputs temporarily locked, field-level rejection messages, a 20-second timeout, and polite success/error status feedback. Required name, email, and project fields have stable accessible names. Organization is optional. A hidden `_gotcha` field is included in HTML and AJAX payloads for Formspree's honeypot filtering. Its wrapper uses `hidden`, `inert`, and `display: none` rather than visual clipping, to reduce accidental browser autofill. Nonempty honeypot values are still sent unchanged for server-side filtering.

`wishlist.js` manages selection IDs, the review dialog, inclusion choice, and optional readable wishlist content. Only selected IDs are stored under `17c-project-wishlist-v1`. Form contact data is not persisted. Failed requests leave inputs and selections in the current page. Successful acceptance resets the form and removes only selections included in that request. Acceptance is not proof of inbox delivery.

Without JavaScript the HTML form uses a standard POST and native validation. A saved wishlist cannot be attached without JavaScript.

## Hosted acceptance checklist

- [ ] Confirm endpoint ownership and the intended verified recipient in Formspree.
- [ ] Confirm account/project retention, recipient access, integrations, CAPTCHA or other spam controls, and any domain restrictions.
- [ ] From the final hosted domain, submit an authorized test inquiry on all three pages and verify inbox receipt. Test services with and without wishlist inclusion.
- [ ] Confirm timeout, rate-limit, CAPTCHA, and network-error behavior against the actual account configuration. The local audit exercised simulated responses only.
- [ ] Confirm spam submissions are filtered server-side. A honeypot is one layer, not complete spam protection.
- [ ] Approve the draft Privacy Policy against actual provider settings.

Deploy `inquiry.js`, `wishlist.js`, `wishlist-catalog.js`, `wishlist.css`, `launch.js`, and `launch.css` along with each page's other referenced resources. Update catalog labels and IDs whenever service selections change.

Implementation references: [Formspree AJAX documentation](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/) and [Formspree honeypot documentation](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering).
