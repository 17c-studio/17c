# Proposal analytics

One shared implementation, `shared/js/proposal-analytics.js`, uses GA4 measurement ID `G-YLJXMRYNPY`. It never installs Google's tag in a proposal document. It creates an invisible, empty `shared/proposal-analytics-frame.html` document containing the same script in transport mode. This keeps GA's automatic form/link/title/history collection away from client content. Keep both files together when publishing.

## Registry and activation

| Proposal | Internal ID | Enabled | Source status |
| --- | --- | --- | --- |
| MR Rebuild | p001 | Yes | Active acceptance, no unresolved draft placeholders |
| Van Noord | p002 | Yes | Active acceptance, no unresolved draft placeholders |
| Estella Rose (current) | p003 | Yes | Active acceptance, fixed scope and prices; replaces legacy draft |
| Spring Sweet | p004 | No | Acceptance enabled; analytics remains explicitly off pending final tracking review |
| ZCS | p005 | No | Internal TODO register requires confirmation of pricing, terms, scope and evidence |
| Estella Rose legacy (`proposal-erf.html`) | p006 | No | Explicit draft with contractual details still to confirm |
| Sample (`proposal.html`) | p007 | No | Illustrative example, not a client proposal |
| Template | Unassigned | No | Placeholder template |

These are source-level final/draft decisions for tracking, not a certification of live form delivery or launch readiness. IDs identify proposal records, never people. Do not recycle an ID or change it when revising an existing proposal. Reserve the next unused ID here when creating a new proposal.

The entry in each proposal head is the complete page-level configuration:

```html
<script src="shared/js/proposal-analytics.js"
        data-proposal-id="p008"
        data-enabled="false"
        data-options-selector="#investment" defer></script>
```

For a new proposal, copy the template, assign its next unique ID, and keep `data-enabled="false"` while drafting. Confirm the selector points to the section where scope/options and pricing begin. After final review, change only `data-enabled` to `true`. Leave sample/legacy pages inactive. Keep `<meta name="robots" content="noindex, nofollow">` on every proposal. Keep only one include and never copy the public-site GA snippet into a proposal.

## Events and privacy

- `proposal_open`: once on each enabled page load, after analytics is allowed.
- `proposal_options_view`: once when any part of the configured options/pricing section enters the viewport. Large sections need not fit entirely on screen. If consent is pending, visibility is remembered in memory and sent after grant.
- Both carry `proposal_id`, a generic title (`17C Studio proposal p001`), an empty page referrer, and a synthetic page location (`https://17c.studio/proposals/p001`). Synthetic locations are reporting labels, not public destinations.
- The tag's global defaults and config are sanitized before its library loads. The transport document's own URL contains only the internal ID and optional fixed campaign/debug flags. Both the iframe navigation and Google script request suppress referrers. No Google script runs alongside proposal content, inputs, signature canvases, client titles, or actual proposal URLs.
- Only a complete, exact campaign triple survives: `utm_source=17c_studio&utm_medium=email&utm_campaign=proposal`. Extra parameters/fragments are dropped, including utm_content, utm_term, click IDs, email and name. Duplicate or altered required campaign values discard the entire campaign. No raw query values or DOM strings cross into the transport document.
- No page_view is requested by this integration. GA may still produce automatic session/engagement events; they run only in the generic transport document with sanitized defaults, never the proposal. Public-site GA setup is unchanged, including its enhanced-measurement settings.
- Drafts do not create a transport frame, load GA, or emit either event.

## Consent

At implementation, the public site loads GA4 directly and has no CMP, stored consent key, or consent-change API. Proposal tracking follows that existing default rather than inventing a consent banner. The existing Google opt-out flag `window['ga-disable-G-YLJXMRYNPY'] === true` blocks initialization. Advertising consent is denied and Google signals/ad personalization are disabled for proposals.

A future consent manager can set `window.studioAnalyticsConsent` **before** this deferred script runs: `granted`, `denied`, or `pending`. Any explicit value other than `granted` prevents Google loading and events. After changing the value (or the GA opt-out flag), dispatch `window.dispatchEvent(new Event('studio:analytics-consent'))`. Revoking consent sets the transport's GA opt-out flag and updates its consent state; regranting does not duplicate either proposal event. This adapter is not a replacement for configuring a site-wide consent policy.

## Email-ready links after publishing

- MR Rebuild: https://17c.studio/proposal-mr-rebuild.html?utm_source=17c_studio&utm_medium=email&utm_campaign=proposal
- Van Noord: https://17c.studio/proposal-van-noord.html?utm_source=17c_studio&utm_medium=email&utm_campaign=proposal
- Estella Rose: https://17c.studio/proposal-estella-rose.html?utm_source=17c_studio&utm_medium=email&utm_campaign=proposal

## GA4 setup and DebugView after publishing

1. In the correct GA4 property, open **Admin → Custom definitions → Create custom dimension**. Name it **Proposal ID**, use **Event** scope, and set event parameter to `proposal_id`. This enables comparison by the same ID across both events. Standard reporting can take 24–48 hours after registration.
2. Open an enabled proposal in your browser. In DevTools Console run:

   ```js
   sessionStorage.setItem('studio:proposal-analytics-debug', 'true');
   location.reload();
   ```

   Debug mode is local to this tab/session and is never enabled through a URL parameter. Do not include it in client emails.
3. In GA4, open **Admin → Data display → DebugView** and choose your debug device. Allow analytics if a consent manager has since been added. Use a browser without an analytics blocker for this check.
4. At the top of the proposal, verify one `proposal_open` with its expected `proposal_id`. Scroll to the options/pricing section and verify one `proposal_options_view` with the same ID. Scroll away/back and resize: no additional copy of either event. Reload: a new pair is allowed, with the view event waiting for the pricing section again. If the section is visible at load, both can arrive immediately in that order.
5. Inspect `page_location`, `page_title`, `page_referrer` and campaign attribution. Expect only the synthetic ID URL, generic title, empty referrer, and approved generic email campaign. No client filename/title, input value, signature, or arbitrary parameter should appear.
6. Visit Spring Sweet/ZCS/legacy/sample/template pages: neither custom event should appear for those IDs. No analytics iframe or Google tag should load on those pages.
7. Turn debug mode off when done:

   ```js
   sessionStorage.removeItem('studio:proposal-analytics-debug');
   location.reload();
   ```

References: [GA4 configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [automatic enhanced measurement](https://support.google.com/analytics/answer/9216061), [DebugView](https://support.google.com/analytics/answer/7201382), [event parameters and custom dimensions](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters).

## Local regression checks without live Analytics hits

Requires Python 3, `websocket-client`, and Chrome. Serve the repository with `python3 -m http.server 8765 --bind 127.0.0.1`. Start a separate Chrome profile:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-first-run --remote-debugging-port=9223 --user-data-dir=/tmp/17c-proposal-analytics-tests about:blank
```

Then run `python3 tests/proposal_analytics_browser.py`. The test enables interception **before navigation** and aborts every `*collect*` request. It loads the real Google tag to inspect actual attempted wire payloads but sends no Analytics collection hits. It does not submit acceptance forms. It checks enabled/draft pages, timings, once-only behavior, duplicate includes, mobile resize, reload, exact campaign allowlisting, consent and opt-out, fragments, and the non-IntersectionObserver fallback. Receiving the events in the hosted GA4 property still requires the post-publish DebugView check above.
