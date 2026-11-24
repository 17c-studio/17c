# Client proposals

| Client/version | Public entry page | Supporting folder |
| --- | --- | --- |
| Mr Rebuild | [proposal-mr-rebuild.html](../proposal-mr-rebuild.html) | `mr-rebuild/` |
| Van Noord | [proposal-van-noord.html](../proposal-van-noord.html) | `van-noord/` |
| Sasquatch | [proposal-sasquatch.html](../proposal-sasquatch.html) | `sasquatch/` |
| Spring Sweet | [proposal-spring-sweet.html](../proposal-spring-sweet.html) | `spring-sweet/` |
| Zeeland Christian School | [proposal-zcs.html](../proposal-zcs.html) | `zcs/` |
| Estella Rose | [proposal-estella-rose.html](../proposal-estella-rose.html) | `estella-rose/` |
| Estella Rose legacy | [proposal-erf.html](../proposal-erf.html) | `estella-rose/legacy/` |
| Sample | [proposal.html](../proposal.html) | `sample/` |
| Template | [proposal-template-17c.html](../proposal-template-17c.html) | Self-contained template |

Edit the root HTML entry page for content. Client folders contain their scripts, styles, and imagery. Public URLs stay unchanged so previously shared links continue working.

Keep client changes scoped to that client's files. Signing scripts and submission configuration remain separate for each proposal.

For proposal tracking, ID assignments, draft activation, privacy boundaries, and GA4 verification, follow [ANALYTICS.md](ANALYTICS.md). The template includes the shared script with tracking explicitly disabled.

Spring Sweet acceptance uses the shared Formspree destination already used by the other proposals. Its pinned PDF library is served locally from `shared/vendor/jspdf-4.2.1.umd.min.js`; keep that file with the deployment. Typed consent and the full text acceptance record are submitted; the optional drawn signature and generated PDF stay in the client’s download. Analytics activation remains independent of form activation.

Run `python3 tests/spring_sweet_acceptance_browser.py` with a separate Chrome debugging instance on port 9223 to check selections, consent, payment totals, complete records, PDF generation, errors/retries, and duplicate-submit protection. The tests block Formspree and Analytics requests and send no live acceptance. Provider-side delivery to the intended inbox still requires a separately authorized live test.
