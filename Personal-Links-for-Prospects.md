# Personal Links: Your Site, Made for Them

*An idea for Mariel, from Joel · October 2026*

## The idea

When you reach out to a business, send them a link to your own website that's already made for them.

The owner of Bearded Dutchman opens `[your-site]/?for=bearded-dutchman` and your site greets him by his business name, shows his logo, uses the personalization section you've already built, and ends by asking for a specific day and time to talk.

It says the same thing your walk-in does, without you in the room: *I care about your business working, and I took the time to show you.* It's also the kind of email people actually click.

## Why it fits how we sell

- **It's about them first.** Their name and their business at the top of the page, not your bio.
- **It shows the work.** Same reason TSF makes proposals as websites: you're showing what you do, not just telling them.
- **No soft asks.** The page ends with a proposed time ("Could I stop by Thursday at 10?"), with one tap to say yes or suggest another time.
- **It's not free work.** It's your site, personalized. No mockup of their site, no design opinions to argue about.

## How you'd use it

1. Walk in, or meet them, and have the real conversation.
2. Add them to your prospects file (business name, website, owner's first name, a line about what you love, a proposed time).
3. Send a short email or text with the brief attached and their personal link.
4. Follow up in person or by phone with the same specific ask.

## How it works (the short version)

- **A prospects file you control.** A small data file on your site lists each prospect: the exact name spelling, their domain, the owner's first name, a personal line, a proposed meeting time, and optionally a logo you've saved yourself.
- **Logos, with a good fallback.** First your own saved logo file, then a free logo service by domain (Logo.dev or Brandfetch, both free with a key), and if neither works, their name set beautifully in your own type. Most small Holland shops won't be in the logo databases, so the fallback has to look intentional. Make it look great and nobody will ever know a logo was missing.
- **If the link is wrong or old, your site just looks normal.** No errors, no broken pieces.
- **Optional:** a quiet analytics event so you know the link was opened, which helps you time your follow-up. Never mention that you saw them visit.

## A few rules

- **The prospects file is public.** Anyone who goes looking can read it. Only put in it what you'd happily say to their face.
- **Phones first.** Owners will open this between customers.
- **Keep the personal line real.** One true sentence from your visit beats three polished ones.
- **Level 2, later:** separate pages per prospect (like `/for/bearded-dutchman/`) so the link preview in a text message says "A few ideas for Bearded Dutchman." That takes a little more setup, so get the basic version working first.

---

## The prompt

Paste this into whatever AI you use to code (Claude, ChatGPT, Cursor, Copilot). Fill in the brackets first, and share your site's files with it.

```
I'm a freelance web designer. I want to add a "personal link" feature to my
portfolio site so I can send prospects a link that personalizes the site for
their business.

ABOUT MY SITE
- Built with: [plain HTML/CSS/JavaScript, or tell it what you use]
- Hosted on: [GitHub Pages / Netlify / other]
- I already have: a personalization section where a visitor types their
  business name and the copy updates, and a services wish list that collects
  selections and sends them to me.
- I'll share my files. Read them before suggesting anything, and match my
  existing code style, file structure, fonts and colors.

WHAT I WANT
1. A link like  mysite.com/?for=bearded-dutchman  personalizes the page.
2. Prospect details live in one small data file I edit by hand
   (for example prospects.json). Each entry has:
   - slug (used in the link)
   - businessName (exact spelling)
   - domain (their current website, optional)
   - firstName (owner's first name, optional)
   - personalLine (one sentence about what I love about their business)
   - proposedTime (for example "Thursday, Oct 16 at 10 AM", optional)
   - logo (path to a logo file I saved myself, optional)
3. When a valid slug is in the link:
   - Greet them near the top, e.g. "Hi Dave, I put this together for
     Bearded Dutchman."
   - Show their personal line.
   - Fill my existing personalization section with their business name
     automatically.
   - Pre-fill their business name in my wish list form.
   - End with a clear call to action using proposedTime:
     "Could I stop by [proposedTime]?" with two buttons:
     "That works" (opens an email to me, pre-filled) and
     "Suggest another time" (same, different wording).
     If there's no proposedTime, ask them to pick a day and time instead.
4. Logo, in this order:
   a. The logo file from my data file, if I added one.
   b. Otherwise, a free logo service by domain: [Logo.dev or Brandfetch],
      using my publishable key: [KEY].
   c. If that fails or returns nothing useful, show their business name as a
      styled wordmark (or initials) in my own fonts and brand colors.
      This fallback should look intentional and polished, not like an error.
5. If the slug is missing, misspelled or not in the file, the site looks and
   works exactly like normal. No errors, no empty boxes.
6. Optional: send an analytics event when a personal link is opened
   ([GA4 / my analytics tool]) with the slug, so I know it was viewed.
   Nothing on the page should tell the visitor they're being tracked.

CONSTRAINTS
- No new frameworks or build tools unless my site already uses them.
- Must work and look great on phones first.
- Keep it accessible (alt text for logos, readable contrast, keyboard friendly).
- Escape anything from the data file before putting it on the page.
- Remember the data file is public; don't suggest storing anything private
  in it.

HOW TO WORK WITH ME
1. First read my files and ask me any questions you need answered.
2. Then give me a short plan: which files you'll add or change, and why.
3. Build it in small steps and tell me exactly where each change goes.
4. Finish with a test checklist: a valid link, a link with no logo, a link
   whose logo fails, a bad slug, no slug, and how it looks on a phone.
5. Show me how to add a new prospect in under two minutes.

Later I may want separate pages per prospect (like /for/bearded-dutchman/)
so text-message link previews show their business name. Don't build that
yet, but don't design anything that would make it hard.
```
