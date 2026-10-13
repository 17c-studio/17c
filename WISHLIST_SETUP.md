# Wishlist email delivery

By default, the wishlist inquiry opens an email draft addressed to `marielwhitney.design@gmail.com`, with the visitor’s name, email, optional organization, required project message, and selected wishlist items. The visitor sends that draft in their email app. The wishlist form opens the draft directly without displaying a follow-up draft panel or message. Opening a draft does not claim delivery or clear the form or selections. An inquiry can also be started without selected items. The “Include my wishlist” checkbox lets visitors choose whether their selected services are attached. Unchecking it preserves selections; successful direct submission clears only the items included in that submission.

Required-field maximum lengths are validated explicitly; the project message is limited to 5,000 code units, matching HTML maxlength behavior.

You can optionally configure an endpoint for direct submission instead; the button then reads “Send my wishlist.”

## Connect Formspree

1. Create a Formspree form and set its recipient to **marielwhitney.design@gmail.com**. Verify that recipient in Formspree. If a different recipient is intended, change it in Formspree and update the contact fallback text in `wishlist.js`.
2. Copy the form endpoint, such as `https://formspree.io/f/YOUR_FORM_ID`.
3. Set `data-endpoint="https://formspree.io/f/YOUR_FORM_ID"` on `#wishlist-form` in `services.html`.
4. Configure the allowed site domain and spam protection in the service dashboard. Submit a real test inquiry after configuration, then confirm its arrival in the recipient inbox.

The public form ID is configuration, not a secret. The browser sends JSON containing name, email, optional business, project, subject, grouped wishlist, and a readable message. Formspree handles delivery credentials; never add an API key or SMTP password to these static files.

An alternative server endpoint must accept this same JSON payload, validate the required name, email, and project fields and any wishlist items server-side, apply spam/rate protection, and return JSON `{ "ok": true }` with a successful HTTP status **only after the email service accepts the message**. Keep its recipient address and sending credentials on the server. Errors must return a non-success status or `{ "ok": false }`. A successful HTTP status alone is not enough for this interface to claim success.

The browser saves only selected catalog IDs under `17c-project-wishlist-v1`. Contact information is never saved to localStorage. Failed, unconfigured, malformed-response, and timed-out requests preserve the wishlist. Successful acceptance clears the submitted wishlist items and contact form. Acceptance is not a guarantee of inbox delivery.

## Verification

After changing delivery configuration, verify validation, loading, failure with preserved selections, and explicit `{ "ok": true }` acceptance with reset. Confirm real delivery in the recipient inbox after connecting an endpoint.

[Formspree AJAX documentation](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax).
