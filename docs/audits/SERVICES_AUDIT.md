# Services audit — October 5, 2026

Interactive checks ran in Chrome on macOS against the local services page. The cover, typography, colors, editorial layout, and disclosure styling were preserved. Temporary local fixtures suppressed native email-app opening and provided light-theme/reduced-motion conditions. No email was sent.

## Confirmed issues and fixes

| Issue | Evidence | Fix |
| --- | --- | --- |
| Focus was lost after removing the last wishlist item and dismissing the dialog. | The floating opener became hidden; closing left `document.activeElement` on BODY. | Explicit restoration returns to the original visible opener, or “Build your project wishlist” when the list is empty. |
| Native Tab cycling included browser chrome/BODY before wrapping. | Repeated Tab presses left the dialog controls during Chrome's native cycle. | Explicit Tab/Shift+Tab boundary wrapping keeps keyboard focus on dialog controls while native modal inertness remains in effect. |
| An empty dialog provided no explanation. | Its summary container was blank after the final removal. | Added a short empty-state message; focus stays on Close after the final removal. |
| Prepared draft links could retain items or form values after changes. | The previous code generated the fallback once and did not invalidate it on subsequent edits/removals. | Fields, checkbox changes, and removals clear the old draft links and status. Resubmitting generates a fresh snapshot. |
| Programmatically supplied overlong inquiries could bypass native maxlength validity. | A 5,028-code-unit value supplied through the browser test tool had `validity.tooLong === false` and generated a draft. | Added explicit maxlength validation for required inquiry fields. A 5,001-character project is rejected with a field-associated message; 5,000 is accepted. |
| Floating wishlist could obscure a control. | Its rectangle overlapped the fallback draft textarea. | Hide the floating pill when its rectangle overlaps a control; restore it when clear. Added an inline “Review wishlist” button using the existing text-button styling so review stays available in the form. It is hidden when empty. |
| Duplicated disclosure expanded state could lag native open state. | Immediate checks after Enter/Space found aria-expanded inconsistent with details.open. | Removed the redundant summary aria-expanded values and synchronization; native details/summary exposes expanded/collapsed state. |
| Studio copy mixed singular and plural voice and included “Together, I create.” | Confirmed in the source and rendered expanded chapters. | “Working with you, I create”; “my services,” “I’ll collect,” “My Website Care & Growth Partnership,” and consistent singular explanations/status copy. Collaborative “let’s” wording remains. |

## Actual test results

### Disclosures and dialog

- All six service disclosures operated with Enter and Space. Each focused summary had a visible 2px outline. The wishlist explanation button also opened with Enter and closed with Space; its hidden state and aria-expanded agreed.
- With three items selected, forward Tab repeatedly remained inside the dialog after the fix; Shift+Tab on Close wrapped to the inquiry link. The same boundary wrapping worked with an empty list and a short-height viewport.
- Escape closed the dialog. A nonempty dialog returned focus to its inline review opener and, in a separate test with the floating pill clear of other controls, to its floating opener. The inquiry link closed the dialog and focused `wishlist-inquiry-title`.
- Removed a middle item: focus moved to the next remaining Remove button; its source checkbox became unchecked and count changed from 3 to 2.
- Removed all 63 items using keyboard Enter. The last removal left focus on Close, displayed the empty message, unchecked every source checkbox, and hid both wishlist review openers. Escape returned focus to the builder button. Refresh retained the empty selection.

### Counts, groups, persistence, and drafts

- Three selected IDs across two service groups survived refresh and remained checked.
- All 63 catalog entries appeared in six groups. Two item labels intentionally occur in different service groups; counts are based on catalog IDs, not distinct label strings.
- A two-group/two-item list became one group/one item after removing the first group's last selection; the removed checkbox was unchecked.
- Checked “Include my wishlist”: decoded draft bullet entries matched the selected catalog entries exactly, in catalog order. Tested four-item, three-item-after-removal, and all-63-item cases.
- Unchecked “Include my wishlist”: draft contained zero wishlist bullet entries while selections stayed saved.
- Changing inclusion, removing an item, or editing the inquiry cleared the previous fallback. Regenerating created only one current fallback panel. Editing also cleared the outdated “draft ready” status.
- Special-character test covered `&`, `+`, `#`, `%`, accented characters, curly apostrophes, emoji, Japanese text, and newlines. The generated subject/body decoded correctly.
- Accepted a 5,000-code-unit project plus all 63 selections. Its body was 7,165 code units. A 5,001-character project was rejected, focused Project, and produced no draft.
- Downloaded the full inquiry fallback and independently read its UTF-8 contents: 7,377 bytes, all 63 bullet entries, and the tested Unicode characters preserved. Browser inspection masks the copy textarea's email-containing value, so the saved file was used for full-content verification.
- The no-app fallback always offers a text download and selectable draft before any native email-app attempt; preparing it does not claim delivery or clear selections.

### Layout, navigation, and motion

- All chapters expanded and all 63 items selected: tested 320, 360, 375, 390, 414, and 430px widths in both dark and light themes. Page width equaled viewport width; the dialog stayed inside the viewport and had no internal horizontal overflow. At 320px the dialog was 286px wide; its full-list height was bounded to approximately 675px in an 844px viewport.
- Equivalent 200% desktop reflow: 735×400 and 640×400 CSS viewports in both themes, with the expanded page and a selected-item dialog. No page or dialog horizontal overflow. A full 63-item dialog also stayed within a 735×400 viewport, bounded to 320px high.
- Native browser 200% zoom was attempted but could not be verified: browser keyboard shortcuts did not change reported scale and the native desktop control failed. The equivalent viewport checks are reflow simulations, not a native-zoom pass.
- Clicking all six chapter navigation links after expanding all chapters updated the hash and highlighted the matching chapter. Checks waited for each matching aria-current state during smooth scrolling.
- Reduced-motion fixture: heading animation `none`, heading opacity 1, scroll behavior `auto`, and no Lenis instance/classes. The fixture applied the production media rules and simulated the JavaScript media preference; OS settings were not changed.
- Floating-control collision test at 320px with the fallback open: when a control intersected the pill's rectangle, its visibility became hidden; when clear, it was visible. Inline review remained keyboard-operable and restored focus after Escape.
- Final JavaScript syntax checks passed. No missing ID/ARIA references or duplicate IDs in services.html. Final console error check was empty.

## Limits

Physical touch devices, Safari, Firefox, OS email-handler absence, native 200% zoom, and actual email delivery were not verified. The email-opening step was suppressed in local test fixtures while exercising the production draft helper and download fallback. The optional delivery endpoint remains unconfigured and was not exercised. Test selections were cleared, the original dark theme was retained, and viewport overrides were reset.

![Empty wishlist with focus retained inside the dialog](audit/services-empty-wishlist.png)
