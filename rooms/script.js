// Page view tracking lives in telemetry.js.

// Thin wrapper so a missing telemetry.js can never break the page.
function track(event, props) {
    try {
        if (window.Turaco && window.Turaco.track) window.Turaco.track(event, props);
    } catch (e) { /* ignore */ }
}

/* --------------------------------------------------------------- Lightbox */

(function () {
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbCounter = document.getElementById('lb-counter');
    const lbClose = document.getElementById('lb-close');
    const lbPrev = document.getElementById('lb-prev');
    const lbNext = document.getElementById('lb-next');
    const galleryAll = document.getElementById('gallery-all');

    if (!lightbox || !lbImg) return;

    // Build the photo list from the desktop grid so the two galleries stay in sync.
    const sources = Array.from(document.querySelectorAll('.gallery__grid img'))
        .sort((a, b) => Number(a.dataset.index || 0) - Number(b.dataset.index || 0))
        .map(img => ({ src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' }));

    if (!sources.length) return;

    let current = 0;
    let lastFocused = null;

    function render() {
        const item = sources[current];
        lbImg.src = item.src;
        lbImg.alt = item.alt;
        if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + sources.length;
    }

    function open(index) {
        lastFocused = document.activeElement;
        current = ((index % sources.length) + sources.length) % sources.length;
        render();
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (lbClose) lbClose.focus();
        track('gallery_open', { index: current });
    }

    function close() {
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function step(delta) {
        current = ((current + delta) % sources.length + sources.length) % sources.length;
        render();
    }

    document.querySelectorAll('.gallery__grid img, .gallery__mobile img').forEach(img => {
        img.addEventListener('click', () => open(Number(img.dataset.index || 0)));
    });

    if (galleryAll) galleryAll.addEventListener('click', () => open(0));
    if (lbClose) lbClose.addEventListener('click', close);
    if (lbPrev) lbPrev.addEventListener('click', () => step(-1));
    if (lbNext) lbNext.addEventListener('click', () => step(1));

    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        // Arrow keys follow reading order, so they flip in RTL.
        const rtl = document.documentElement.dir === 'rtl';
        if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
        if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
    });
})();

/* ------------------------------------------------- Booking dates -> email */

(function () {
    const card = document.querySelector('.booking-card');
    const checkIn = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');
    const emailBtn = document.querySelector('.booking-card a[href^="mailto:"]');
    const hint = document.getElementById('date-hint');

    if (!card || !checkIn || !checkOut || !emailBtn) return;

    const EMAIL = 'amentamerat@gmail.com';
    const roomName = card.dataset.room || 'Room';

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    // Never offer a past arrival date, or a departure before arrival.
    checkIn.min = today();
    checkOut.min = today();

    function fmt(value) {
        if (!value) return '';
        // Render in the visitor's locale, falling back to the raw ISO value.
        try {
            const d = new Date(value + 'T00:00:00');
            return d.toLocaleDateString(document.documentElement.lang || 'en', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) {
            return value;
        }
    }

    function nights(a, b) {
        const ms = new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00');
        return Math.round(ms / 86400000);
    }

    function markInvalid(el, invalid) {
        const field = el.closest('.field');
        if (!field) return;
        field.classList.toggle('error', invalid);
        el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        let slot = field.querySelector('.error-message');
        if (!slot) {
            slot = document.createElement('span');
            slot.className = 'error-message';
            field.appendChild(slot);
        }
        slot.textContent = invalid ? t('err_date_past') : '';
    }

    function update() {
        // `min` only guards the picker; a typed date still lands in .value,
        // so every date is re-checked here before it reaches the mailto link.
        const now = today();
        checkIn.min = now;
        checkOut.min = checkIn.value && checkIn.value >= now ? checkIn.value : now;

        const ciBad = Boolean(checkIn.value) && (checkIn.value < now || !checkIn.checkValidity());
        markInvalid(checkIn, ciBad);

        // Clear an out-of-order departure rather than emailing nonsense.
        if (checkIn.value && checkOut.value && checkOut.value <= checkIn.value) {
            checkOut.value = '';
        }
        const coBad = Boolean(checkOut.value) && (checkOut.value < now || !checkOut.checkValidity());
        markInvalid(checkOut, coBad);

        // Only dates that actually pass validation are offered to the front desk.
        const from = ciBad ? '' : checkIn.value;
        const to = (coBad || ciBad) ? '' : checkOut.value;

        // Subject line stays in English so the front desk reads one consistent format.
        let subject = roomName + ' booking';
        const lines = ['Hello Turaco Addis,', '', 'I would like to book the ' + roomName + '.'];

        if (from && to) {
            subject += ' — ' + from + ' to ' + to;
            const n = nights(from, to);
            lines.push('Check-in: ' + from);
            lines.push('Check-out: ' + to);
            lines.push('Nights: ' + n);
        } else if (from) {
            subject += ' — from ' + from;
            lines.push('Check-in: ' + from);
        }

        lines.push('Guests: ');
        lines.push('', 'Thank you.');

        emailBtn.href = 'mailto:' + EMAIL +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(lines.join('\n'));

        if (hint) {
            hint.textContent = (from && to)
                ? fmt(from) + ' – ' + fmt(to) + ' · ' + nights(from, to) + ' night' +
                  (nights(from, to) === 1 ? '' : 's')
                : t('dates_hint');
        }
    }

    // Keep the button label and any date error in the visitor's language.
    document.addEventListener('turaco:langchange', update);

    [checkIn, checkOut].forEach(el => {
        el.addEventListener('change', () => {
            update();
            track('booking_dates', { room: roomName, hasDates: Boolean(checkIn.value && checkOut.value) });
        });
    });

    update();
})();

/* ---------------------------------------------- Reservation request form */

(function () {
    const form = document.getElementById('reserve-form');
    const card = document.querySelector('.booking-card');
    if (!form || !card) return;

    const API_BASE = (window.TURACO_CONFIG && window.TURACO_CONFIG.apiBase) || '';
    const roomName = card.dataset.room || 'Room';

    const checkIn = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');
    const guests = document.getElementById('guests');
    const nameEl = document.getElementById('res-name');
    const phoneEl = document.getElementById('res-phone');
    const emailEl = document.getElementById('res-email');
    const btn = document.getElementById('reserve-btn');
    const status = document.getElementById('reserve-status');

    let state = 'idle'; // idle | sending | success | error

    function mark(el, ok, msg) {
        const field = el.closest('.field') || el.closest('.booking-card__dates');
        if (!field) return;
        field.classList.toggle('error', !ok);
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        let slot = field.querySelector('.error-message');
        if (!slot) {
            slot = document.createElement('span');
            slot.className = 'error-message';
            field.appendChild(slot);
        }
        slot.textContent = ok ? '' : msg;
    }

    function render() {
        btn.disabled = state === 'sending';
        btn.classList.toggle('is-success', state === 'success');
        // Outcome is shown once, in #reserve-status below the button.
        btn.textContent = state === 'sending' ? t('reserve_sending') : t('btn_reserve');
        if (status) {
            status.textContent = state === 'error' ? t('reserve_failed')
                : state === 'success' ? t('reserve_success')
                : '';
            status.classList.toggle('is-error', state === 'error');
            status.classList.toggle('is-success', state === 'success');
        }
    }

    document.addEventListener('turaco:langchange', render);

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Disabling the button only stops clicks; Enter or a repeat submit
        // event still reaches here. Some old bookings were saved 3-4 times.
        if (state === 'sending') return;

        const today = new Date().toISOString().slice(0, 10);
        const checks = [
            [checkIn, Boolean(checkIn.value) && checkIn.value >= today, 'err_checkin'],
            [checkOut, Boolean(checkOut.value) && checkOut.value > checkIn.value, 'err_checkout'],
            [guests, Number(guests.value) > 0, 'err_guests'],
            [nameEl, nameEl.value.trim().length >= 2, 'err_name_short'],
            [phoneEl, /^\d{7,15}$/.test(phoneEl.value.replace(/\D/g, '')), 'err_phone'],
            [emailEl, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim()), 'err_email']
        ];

        let valid = true;
        let first = null;
        checks.forEach(([el, ok, key]) => {
            mark(el, ok, t(key));
            if (!ok) { valid = false; if (!first) first = el; }
        });

        if (!valid) {
            track('reserve_invalid', { roomType: roomName });
            if (first) first.focus();
            return;
        }

        // Guard against the double-submit that saved some old bookings 3-4 times.
        state = 'sending';
        render();
        track('reserve_submit', { roomType: roomName, guests: Number(guests.value) });

        fetch(`${API_BASE}/api/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nameEl.value.trim(),
                email: emailEl.value.trim(),
                phoneNumber: phoneEl.value.trim(),
                guests: Number(guests.value),
                checkIn: new Date(checkIn.value).toISOString(),
                checkOut: new Date(checkOut.value).toISOString(),
                roomType: roomName
            })
        })
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(() => {
                state = 'success';
                render();
                form.reset();
                track('reserve_success', { roomType: roomName });
            })
            .catch(err => {
                state = 'error';
                render();
                track('reserve_failure', {
                    roomType: roomName,
                    reason: String((err && err.message) || err).slice(0, 120)
                });
            });
    });

    [nameEl, phoneEl, emailEl].forEach(el => {
        el.addEventListener('input', () => {
            mark(el, true, '');
            if (state === 'success' || state === 'error') { state = 'idle'; render(); }
        });
    });

    render();
})();
