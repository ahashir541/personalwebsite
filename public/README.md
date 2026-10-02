# Syed Hashir Ali — Personal Site

A static portfolio built with plain HTML, CSS, and JavaScript. There is no build step or framework; the site can be deployed to any static host.

## Folder structure

```
├── index.html          Home
├── about.html          About and education
├── journey.html        Competition and leadership overview
├── geneva.html         FIRST Global Challenge — Geneva 2022
├── singapore.html      FIRST Global Challenge — Singapore 2023
├── robotron.html       ROBOTRON '26
├── experience.html     Experience and skills
├── certifications.html Certificates and recognition
├── media.html          Press, podcast, and video
├── contact.html        Contact form and direct links
├── style.css           Shared styling and responsive layouts
├── main.js             Navigation, reveal effects, counters, contact form
├── videos/             Local video clips
│   └── shorts/         Add future short clips here (see README.txt)
├── assets/images/      Portfolio photos and media stills
└── assets/certificates/ Seven certificate scans converted to PNG
```

## Adding your photos & videos

The competition pages use the supplied Switzerland and Singapore photos; the media page uses the Samaa TV and podcast stills. The homepage and media page use `videos/reel-1.mp4`.

The homepage has four portrait-format short-video cards with green-and-black video-slot placeholders and “Coming soon” labels. Add vertical MP4 clips using these filenames in `videos/shorts/`:

- `robotics-talks.mp4`
- `one-to-one-meeting.mp4`
- `podcast-guest.mp4`
- `stem-partnerships.mp4`

The matching card filenames are recorded in `data-short-video` attributes in `index.html`. When clips are ready, replace each card’s `.home-short-card__screen` placeholder with an HTML `<video controls playsinline preload="metadata">` element and a `<source>` that uses its recorded path. Keep the existing card content to preserve its layout. No standalone Samaa TV or podcast video files were present in the folder at the time this README was updated.

The Certificates page displays seven PNG scans extracted from the portfolio PDF, plus additional credential records transcribed from the portfolio and LinkedIn PDFs. `Syed_Hashir_Certificates.pdf.pdf` is currently a zero-byte file; replace it with the readable PDF if it contains additional certificates. Where date ranges differed between the portfolio and the newer LinkedIn export, the newer LinkedIn dates are used.

## Editing content

Content is written directly into each HTML page (not pulled from a database), so to change text: open the relevant `.html` file in any text editor and edit it directly. Colors, fonts, and spacing all live in `style.css` — change the values at the top (`:root { --accent: ... }`) to restyle the whole site at once.

## Turning on the contact form

The form on `contact.html` currently just shows a message on submit — it doesn't send email yet. Two easy free options:

**Option A — Formspree (recommended, 5 minutes)**
1. Go to formspree.io, sign up free, create a new form, copy the form endpoint URL it gives you.
2. In `contact.html`, change `<form id="contact-form" class="contact-form">` to `<form id="contact-form" class="contact-form" action="https://formspree.io/f/YOUR_ID" method="POST">`.
3. Remove the `e.preventDefault()` line in `main.js`'s contact form handler (or just delete that whole `if (contactForm)` block) so the form submits normally to Formspree.

**Option B — Netlify Forms**
If you deploy via Netlify (below), add `data-netlify="true"` to the `<form>` tag and Netlify handles submissions automatically, visible in your Netlify dashboard.

## Deploying to your own domain

Pick one — all are free or near-free:

**Netlify (easiest)**
1. Go to netlify.com → sign up → "Add new site" → "Deploy manually" → drag the whole `hashir-website` folder into the upload box.
2. Netlify gives you a live `.netlify.app` link instantly.
3. Go to Site settings → Domain management → "Add a custom domain" → enter your domain → follow the DNS instructions it gives you (usually adding a CNAME or A record at wherever you bought the domain, e.g. Namecheap/GoDaddy).

**Vercel** — same idea as Netlify: sign up, drag-and-drop or connect a GitHub repo, add custom domain in project settings.

**GitHub Pages (free, good if you already use GitHub)**
1. Create a new GitHub repo, push this folder's contents to it.
2. Repo Settings → Pages → set source to your main branch.
3. Settings → Pages → "Custom domain" → enter your domain, then add the DNS records GitHub shows you at your domain registrar.

**Traditional web hosting (cPanel/FTP)**
If you bought hosting + domain together (common with local Pakistani providers), just upload the entire contents of `hashir-website/` into the `public_html` folder via FTP or the File Manager in cPanel. No build step needed — it works as-is.

## Before you formally launch — checklist

- [x] Add the provided event, portrait, Samaa TV, and podcast photos
- [ ] Add your short clips to `videos/shorts/` and connect them to the prepared homepage cards (see `videos/shorts/README.txt`)
- [ ] Add the separate Samaa TV and podcast video files when available
- [x] Convert available certificate scans from the portfolio PDF to PNG
- [ ] Re-upload the empty standalone certificates PDF if it contains additional scans
- [ ] Connect the contact form (Option A or B above)
- [ ] Replace placeholder testimonials on `media.html` once you have real quotes
- [ ] Update the `<title>` and meta description in each page's `<head>` if you want different SEO text
- [ ] Test on your phone — everything is responsive, but always double-check real devices before launch
