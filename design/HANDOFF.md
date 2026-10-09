# Turaco Addis — Redesign handoff

This folder is the visual reference for the redesign of the Turaco Addis Hotel site.
Implement it in the existing static site (`index.html`, `style.css`, `rooms/*/index.html`, `rooms/style.css`).

## Reference files

| File | What it shows | Width |
|---|---|---|
| `home-desktop.dc.html` | Homepage | 1440px |
| `home-mobile.dc.html` | Homepage | 390px |
| `room-standard-desktop.dc.html` | Standard Room page | 1440px |
| `room-standard-mobile.dc.html` | Standard Room page | 390px |

**How to read them.** These are design-tool files, not production pages:

- Treat the markup and inline styles as a spec for layout, spacing, sizes and colors. Rebuild them as clean, semantic HTML with classes in `style.css` / `rooms/style.css`. Don't copy the inline styles.
- The `<x-dc>`, `<helmet>`, `<sc-for>` tags and the `<script type="text/x-dc">` block are design-tool wrappers. Ignore them.
- `{{accent}}` means the accent color (`#A63A24`).
- `<sc-for list="{{rooms}}">` / `{{features}}` repeat a block for each item in the lists in the script block at the bottom of each file. Write the items out as static HTML.
- Every artboard has a fixed height. The real pages should size to their content.
- Image paths already point to `../images/…`, the site's own images.

## Design tokens

```css
:root {
  --ground: #F6F1E8;      /* page background (ivory) */
  --ground-2: #EFE7D9;    /* alternate section band */
  --surface: #FFFFFF;     /* cards, forms */
  --field: #FBF8F3;       /* input background */
  --ink: #1F2A22;         /* primary text, footer background */
  --muted: #4E574F;       /* secondary text */
  --line: #E3DACB;        /* borders */
  --line-strong: #CFC4B1; /* outline chips/buttons, input borders #D8CEBD */
  --forest: #1E4D3A;      /* eyebrows, links, events band, secondary buttons */
  --accent: #A63A24;      /* primary CTAs (turaco red) */
}
```

- **Fonts** (Google Fonts): `Fraunces` (400/500/600) for headings, prices and big numbers; `Manrope` (400–700) for everything else.
- **Type scale (desktop):**
  - Hero H1 88px, line-height 0.98, letter-spacing −0.02em, weight 500.
  - Section H2 44–52px.
  - Card H3 26–30px.
  - Body 16–19px, line-height 1.6–1.7.
  - Eyebrows 13px, uppercase, weight 700, letter-spacing 0.16em, color `--forest`.
- **Type scale (mobile):**
  - Hero H1 44px, section H2 28–36px.
  - Side padding 20px.
- **Radii:**
  - Buttons: pill (fully rounded).
  - Cards and images: 20–28px.
  - Inputs: 12px.
- **Layout:**
  - Desktop side padding 64px, section vertical padding 96–112px.
  - Grids use `gap`.
- **Buttons:** 48–56px tall.
  - Primary: filled `--accent`, white text.
  - Secondary: 1px `--ink` outline.
- **Touch targets:** at least 44px.
- **Logo:** `images/logo.jpg` has a white background. Use `mix-blend-mode: multiply` so it sits cleanly on the ivory.
- **Icons:** simple inline stroke SVGs (1.5px stroke, `--forest`). No emoji.
- **Removed from the old design:** the gold gradient buttons and the emoji flags.

## Homepage (`index.html`), top to bottom

1. **Header.**
   - Logo on the left.
   - Nav in the center: Rooms, Restaurant & Lounge, Events, Amenities, Contact.
   - On the right: language pills (EN / አማ / عربي) and a "Book a room" button that goes to `#contact`.
   - Mobile: logo, an EN pill and a menu button. The menu opens the nav.
2. **Hero.** Split layout:
   - Left: eyebrow, H1 "Affordable luxury in the heart of the city.", a short paragraph, and two buttons ("Book your stay" → `#contact`, "See rooms & rates" → `#rooms`).
   - Right: `front3.jpg`, 600×700, with a "Rooms from 3,000 Birr / night" tag in the corner.
   - **There is no date/availability booking form.** The site isn't connected to a booking system.
3. **Welcome band** (`--ground-2`):
   - `lobby1.jpg` on the left.
   - On the right: H2, the welcome copy, and three stats: "3 room types", "200 guest event hall", "Free Wi-Fi & parking".
4. **Rooms** (`#rooms`): three cards in a row. Each card has:
   - photo, tag, name and description;
   - the price in Birr / night;
   - a "Book" button that links to that room's page.
5. **Restaurant & Lounge** (`#dining`):
   - `bar1.jpg` large on the left.
   - On the right: `restaurant4.jpg` with the heading and copy under it.
   - **The copy is a placeholder** for the owner to fill in.
6. **Events** (`#events`): a full-width `--forest` band.
   - H2 "A hall for up to 200 guests.", copy, and a "Plan an event" button that goes to `#contact`.
   - **The photo frame is a placeholder.** The current `hall.jpg` is a corridor, not the event hall.
7. **Amenities** (`#amenities`): six icon + label items in a row, each with a top border.
   - Items: Free Wi-Fi, Central location, City views, Parking, Bar & restaurant, Satellite TV.
   - Mobile: two columns.
8. **Contact** (`#contact`):
   - Left card: heading, phone, email, and Instagram / Facebook / Google links.
   - Right: the existing contact form (name, phone, email, message). Keep its current submit behavior.
9. **Footer:** dark `--ink` background with the name, tagline, links and copyright.

## Room pages (`rooms/standard`, `rooms/deluxe-suite`, `rooms/double`)

Only the Standard Room is drawn. Apply the same layout to the other two, using each page's existing photos, features and price (Deluxe 4,200 Birr, Double 4,500 Birr).

1. **Header** as on the homepage. The primary button is "Call to book" (`tel:+251911208751`).
2. **Breadcrumb:** Home / Rooms / Room name.
3. **Gallery:**
   - Desktop: a 4-column grid. The main photo spans 2×2, a tall photo on the right spans 2 rows, and two small photos sit between them. There's a "View all photos" button that should open a lightbox of all the room's images.
   - Mobile: one large image with 3 thumbnails under it.
4. **Details:**
   - Eyebrow, H1, and chips for guests / beds / baths.
   - A short description.
   - An "In the room" feature list with check icons: 2 columns on desktop, 1 on mobile.
5. **Booking card** (a sticky sidebar on desktop, stacked on mobile):
   - The price.
   - A "Call +251 91 120 8751" button.
   - An "Email the front desk" button (`mailto:`, with the room name as the subject).
   - Check-in and check-out times. **These are placeholders: `[TIME]`.**
   - The note "our team will confirm your booking by phone".
   - **This replaces the old reservation form with dates, name, email and phone.** Confirm with the owner before deleting it if that form actually sends requests anywhere.
6. **Other rooms:** two horizontal cards linking to the other room pages.
7. **Footer.**

## Must keep working

- **Language switching:** the EN / AM / AR switching through `translations.js` and `script.js`.
  - Any new or renamed text elements need their translation keys wired up.
  - Arabic must switch the page to `dir="rtl"`, and the layout should mirror correctly.
- **Existing SEO:** the `<title>` / meta tags, `robots.txt` and `sitemap.xml`.
- **Responsive design:** everything must work from 360px to 1440px+. Use the mobile artboards as the small-screen reference.
- **Accessibility:**
  - Real `<button>` / `<a>` / `<label>` elements.
  - `alt` text on images.
  - `aria-label` on icon-only buttons.
  - Text contrast of at least 4.5:1.
