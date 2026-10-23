# Work page

`work.html` uses the existing static-site stack and shared studio fonts, color tokens, header, footer, and buttons. Page-specific layout and interactions live in `work.css` and `work.js`. This refinement changes only those three files and this note.

## Presentation

The page has four sections: introduction, selected work, a compact typography experiment, and a closing invitation. Each of the three projects has one large native-scroll screenshot, a category, a title, a short introduction, and links to the full design and confirmed live site when available. Desktop compositions alternate on the same grid; smaller screens keep the preview before the copy.

One native “Behind the project” disclosure holds the challenge, solution, role, and a short design observation. The observation has one save action tied to an existing wishlist service. Removed the separate annotations, journey controls, repeated outcomes and project contact links, extra Glass House statement, archive experiment card, and standalone wishlist section. Obsolete page-specific CSS and journey JavaScript were removed.

## Content still needed

The “My role” entries retain the owner-requested lorem ipsum placeholders. Replace these with accurate personal contributions and collaborator credits before publishing. No responsibilities or measured outcomes have been invented.

Live links confirmed by the owner and checked during this refinement:
- Haworth: https://haworthhotel.com/
- Dare to Hope: https://hope.edu/admissions/landing/

Glass House has a saved preview only; no live URL has been supplied. Authentic matched before images would be needed for a comparison feature. Spring Sweet remains outside the three-project collection pending content and imagery.

## Interactions

- Saved screenshots scroll with wheel, touch, and keyboard, with or without JavaScript. Full-design links open the original captures. Haworth uses the existing 600px image, verified to render in the browser.
- Disclosures work without JavaScript. The typography slider enables when its handler is ready and shows the current weight; the no-script fallback leaves a static sample.
- Save actions use existing catalog IDs and the existing `17c-project-wishlist-v1` localStorage array. Existing selections are preserved; saved actions show a consistent state and do not add duplicates. A wishlist link routes to the existing inquiry form when selections exist and services otherwise. Storage failures hide save actions and show feedback.
- Reduced-motion preferences disable the page’s motion and transitions. No animation library is added.

Original untracked work.html was backed up to `/tmp/17c-work-original.html` during the initial implementation.
