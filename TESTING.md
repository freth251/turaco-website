# Turaco Addis — pre-launch testing plan

Status of the local stack as of 2026-10-08. Tick each box; anything unticked is a
launch blocker unless noted "nice to have".

## 0. Start the stack

```bash
# 1. Postgres (already installed as a brew service)
brew services start postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# 2. Backend  (reads ../turaco-backend/.env — DBURL points at localhost)
cd ~/turaco-backend && go run .          # "Server is running on port 8080..."

# 3. Site + API proxy  (NOT python3 -m http.server — that 501s on POST)
cd ~/turaco-website && python3 devserver.py --port 3000
```

Open http://localhost:3000 and **hard-refresh (Cmd-Shift-R)** — assets are at `?v=12`.

Warning: every contact submission sends a REAL email (to the addresses in
`RECEPIENTEMAIL`) and a REAL Telegram message. Prefix test messages with "TEST".

Useful queries while testing:

```bash
DBURL=$(grep '^DBURL=' ~/turaco-backend/.env | cut -d= -f2-)
psql "$DBURL" -c "SELECT name,email,phone_number,created_at FROM contacts ORDER BY created_at DESC LIMIT 5;"
psql "$DBURL" -c "SELECT event,page,lang,props FROM track_events ORDER BY id DESC LIMIT 20;"
psql "$DBURL" -c "SELECT count(*) FROM page_views;"
```

---

## 1. Backend wiring  — VERIFIED 2026-10-08

- [x] `OPTIONS /api/contact` → 200 with CORS headers
- [x] `POST /api/contact` → 200, row in `contacts`
- [x] `POST /api/track` (legacy) → 200, row in `page_views`
- [x] `POST /api/track/events` → 204, rows in `track_events`
- [x] `track_events` table created (`migrations_track_events.sql` applied)
- [x] Browser end-to-end: form submits, success state shows, form clears
- [ ] Confirm the notification email actually ARRIVED in the inbox
- [ ] Confirm the Telegram message actually ARRIVED
- [ ] `/api/reserve` — decide: still unused by the site (booking card replaced it).
      Either remove it or re-point something at it.

## 2. Contact form

- [ ] Valid submission → green success text, form clears, row in `contacts`
- [ ] Name 1 char → "at least 2 characters", focus moves to the field
- [ ] Message < 10 chars → "please write a little more"
- [ ] Invalid email (`a@b`) → error
- [ ] Phone `abc` → error; `0911234567` and `+251911208751` both accepted
- [ ] Whitespace-only message → rejected
- [ ] Double-click submit → only ONE row in `contacts` (button disables)
- [ ] Stop the backend → submit → inline error + Call/Email fallback appears,
      typed values are preserved, mailto body contains name/phone/email/message
- [ ] Switch language while the error is showing → message re-translates

## 3. Room pages (all three: standard, deluxe-suite, double)

- [ ] Price correct: 3,000 / 4,200 / 4,500
- [ ] "Call" button dials +251911208751
- [ ] "Email the front desk" opens mail with the room name in the subject
- [ ] Pick check-in + check-out → subject becomes "<Room> booking — <from> to <to>",
      body lists dates + night count
- [ ] Type a PAST date → inline "choose a date in the future", date excluded from mailto
- [ ] Check-out before check-in → cleared automatically
- [ ] Gallery lightbox: opens, arrows work, Escape closes, counter reads "2 / 4"
- [ ] "Other rooms" cards link to the right pages
- [ ] Breadcrumb links work

## 4. Languages (EN / አማ / عربي) — test on home AND a room page

- [ ] Header pill switches language; choice persists across pages and reloads
- [ ] Mobile (<900px): pill opens a dropdown with all THREE options
- [ ] Arabic sets `dir="rtl"` and the layout mirrors
- [ ] Phone number reads "+251 91 120 8751" (not reversed) in Arabic, everywhere:
      footer, contact card, booking card, form-error fallback
- [ ] Page `<title>` changes with the language
- [ ] No English left visible in AM/AR (brand names and the email are expected to stay Latin)

## 5. Responsive — 360, 406, 768, 894, 1054, 1180, 1280, 1440

- [ ] No horizontal scrollbar at any width, in any language
- [ ] Header never overlaps: logo stays 97x64 (73x48 mobile), nav never paints over the pills
- [ ] Event hall illustration visible at every width
- [ ] Mobile menu: opens, locks page scroll, traps Tab, Escape closes and returns focus
- [ ] "Book a room" in the menu is white-on-red and readable

## 6. Accessibility

- [ ] Tab from the top: first stop is "Skip to content", and it works
- [ ] All interactive elements reachable by keyboard, focus ring always visible
- [ ] Lighthouse accessibility >= 95 on home and a room page:
      `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"` first (needs Node >= 18)

## 7. Analytics

- [ ] Load a page, scroll, click a room card, switch language, close the tab
- [ ] `track_events` contains page_view, scroll_depth, room_card_click, lang_change, page_exit
- [ ] A language-pill click logs `lang_change` (not `nav_click`)
- [ ] Enable Do Not Track in the browser → NO new rows appear

## 8. Cross-browser / real device

- [ ] Safari desktop (date inputs and `<bdi>` differ most here)
- [ ] A real iPhone — tap-to-call, the menu, the date pickers
- [ ] A real Android phone
- [ ] Slow connection (DevTools "Fast 3G"): images lazy-load, nothing jumps

---

## 9. Before going live — NOT yet done

- [ ] **Production must proxy `/api` to the Go backend on the same origin**
      (nginx/Caddy). Without it the form posts to a static host and fails.
      This is what `devserver.py` emulates locally.
- [ ] Point `window.TURACO_CONFIG` only if the API lives on another origin;
      otherwise leave it unset so same-origin is used.
- [ ] Backend `.env` for production: real `DBURL`, `CORSORIGIN=https://turacoaddis.com`
- [ ] Run `migrations_track_events.sql` against the PRODUCTION database
- [ ] `amentamerat@gmail.com` mailbox/alias must exist and forward somewhere real
- [ ] HTTPS + HTTP→HTTPS redirect
- [ ] Submit `sitemap.xml` in Google Search Console; verify the Hotel JSON-LD
      in Google's Rich Results Test
- [ ] Street address still missing from the Hotel JSON-LD (TODO in index.html)
- [ ] Native-speaker review of the Amharic strings (see MEMORY notes:
      `መግቢያ`/`መውጫ` for check-in/out, `በሌሊት` for per-night)
- [ ] Owner content decisions: "Double Bed" room shows twin beds; Standard/Double
      galleries pad with lobby/exterior/bar photos; confirm the "private balcony" claim
- [ ] Replace `images/event-hall.svg` (an illustration) with a real photo
- [ ] Restaurant & Lounge copy is a neutral stand-in, not real copy
