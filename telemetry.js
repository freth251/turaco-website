/*
 * Turaco Addis — lightweight first-party telemetry.
 *
 * Design rules:
 *  - Never throw. Every entry point is wrapped; a telemetry failure must never
 *    affect the page, the carousels, or the forms.
 *  - Never touch the DOM. Listeners are passive/delegated and read-only, so
 *    nothing here can change layout or intercept a click.
 *  - Batched. Events queue and flush on a timer, on tab hide, and on unload.
 *
 * Backend: batches POST to /api/track/events as { batch: [...] }.
 * The legacy single page_view POST to /api/track is still sent unchanged so
 * existing dashboards keep working.
 */
(function () {
    'use strict';

    /* Same-origin by default, matching script.js. The old hardcoded
       localhost:8080 made every beacon cross-origin in dev, and sendBeacon
       cannot send an application/json body cross-origin without a preflight
       it is not allowed to make -- so events were dropped silently.
       Override with window.TURACO_CONFIG = { apiBase: '...' } if needed. */
    var ENDPOINT_BASE = (window.TURACO_CONFIG && window.TURACO_CONFIG.apiBase) || '';

    var BATCH_URL = ENDPOINT_BASE + '/api/track/events';
    var LEGACY_URL = ENDPOINT_BASE + '/api/track';

    var FLUSH_INTERVAL_MS = 10000;
    var MAX_QUEUE = 25;

    // Honour Do Not Track / Global Privacy Control.
    var optedOut = navigator.doNotTrack === '1' ||
                   window.doNotTrack === '1' ||
                   navigator.globalPrivacyControl === true;

    var queue = [];
    var startedAt = Date.now();
    var maxScroll = 0;
    var scrollMarksSent = {};

    function safe(fn) {
        return function () {
            try { return fn.apply(null, arguments); } catch (e) { /* never break the page */ }
        };
    }

    function randomId() {
        try {
            if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
        } catch (e) { /* fall through */ }
        return 'x' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    // Anonymous ids. No personal data, no cross-site identifiers.
    function storedId(store, key) {
        try {
            var id = store.getItem(key);
            if (!id) { id = randomId(); store.setItem(key, id); }
            return id;
        } catch (e) {
            return 'ephemeral'; // private mode / storage blocked
        }
    }

    var visitorId = optedOut ? 'dnt' : storedId(localStorage, 'tw_vid');
    var sessionId = optedOut ? 'dnt' : storedId(sessionStorage, 'tw_sid');

    function currentLang() {
        try { return localStorage.getItem('lang') || 'en'; } catch (e) { return 'en'; }
    }

    function send(url, payload) {
        var body = JSON.stringify(payload);
        try {
            if (navigator.sendBeacon) {
                // Survives unload, unlike a plain fetch.
                if (navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))) return;
            }
        } catch (e) { /* fall through to fetch */ }
        try {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body,
                keepalive: true
            }).catch(function () { /* telemetry is best-effort */ });
        } catch (e) { /* give up silently */ }
    }

    function flush() {
        if (!queue.length) return;
        var batch = queue;
        queue = [];
        send(BATCH_URL, { batch: batch });
    }

    function track(name, props) {
        if (optedOut || !name) return;
        queue.push({
            event: String(name),
            ts: new Date().toISOString(),
            page: window.location.pathname,
            lang: currentLang(),
            sessionId: sessionId,
            visitorId: visitorId,
            props: props || {}
        });
        if (queue.length >= MAX_QUEUE) flush();
    }

    // ---- automatic events -------------------------------------------------

    function trackPageView() {
        // Legacy shape, unchanged, so the existing /api/track handler still works.
        send(LEGACY_URL, { page: window.location.pathname, referrer: document.referrer });

        track('page_view', {
            referrer: document.referrer || null,
            title: document.title,
            viewport: window.innerWidth + 'x' + window.innerHeight,
            screen: (window.screen ? window.screen.width + 'x' + window.screen.height : null),
            query: window.location.search || null
        });
    }

    function label(el) {
        var text = (el.textContent || '').trim().replace(/\s+/g, ' ');
        return text.slice(0, 60) || null;
    }

    function wireClicks() {
        // One delegated, non-capturing, non-cancelling listener for the whole page.
        document.addEventListener('click', safe(function (e) {
            var el = e.target && e.target.closest ? e.target.closest('a, button') : null;
            if (!el) return;

            var href = el.getAttribute && el.getAttribute('href');

            if (href && href.indexOf('tel:') === 0) {
                track('phone_click', { value: href.slice(4) });
            } else if (href && href.indexOf('mailto:') === 0) {
                track('email_click', { value: href.slice(7) });
            } else if (el.closest('.contact__social') || el.closest('.site-footer__links')) {
                track('social_click', { href: href });
            } else if (el.closest('.room-card') || el.closest('.other-room')) {
                track('room_card_click', { href: href, label: label(el) });
            } else if (el.classList.contains('lang-pill')) {
                // Checked before .site-nav: a duplicate pill set lives inside
                // the mobile menu, and those clicks are language changes.
                track('lang_change', { to: el.dataset.lang });
            } else if (el.closest('.site-nav') || el.closest('.breadcrumb')) {
                track('nav_click', { href: href, label: label(el) });
            } else if (el.id === 'nav-toggle') {
                track('menu_open', {});
            } else if (el.classList.contains('btn')) {
                track('cta_click', { href: href, label: label(el) });
            } else if (href && /^https?:/i.test(href) && el.host !== window.location.host) {
                track('outbound_click', { href: href });
            }
        }), { passive: true });
    }

    // Language changes are captured by the delegated click handler above.

    function wireFormEngagement() {
        var started = {};
        document.addEventListener('focusin', safe(function (e) {
            var field = e.target;
            if (!field || !field.id) return;
            if (!/^(INPUT|TEXTAREA|SELECT)$/.test(field.tagName)) return;
            var form = field.closest('.contact-form') ? 'contact' : null;
            if (!form || started[form]) return;
            started[form] = true;
            track('form_start', { form: form, firstField: field.id });
        }), { passive: true });
    }

    function wireScrollDepth() {
        window.addEventListener('scroll', safe(function () {
            var doc = document.documentElement;
            var scrollable = doc.scrollHeight - window.innerHeight;
            if (scrollable <= 0) return;
            var pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
            if (pct > maxScroll) maxScroll = pct;
            [25, 50, 75, 100].forEach(function (mark) {
                if (pct >= mark && !scrollMarksSent[mark]) {
                    scrollMarksSent[mark] = true;
                    track('scroll_depth', { percent: mark });
                }
            });
        }), { passive: true });
    }

    function wireErrors() {
        window.addEventListener('error', safe(function (e) {
            track('js_error', {
                message: e.message ? String(e.message).slice(0, 200) : null,
                source: e.filename || null,
                line: e.lineno || null
            });
        }));
        window.addEventListener('unhandledrejection', safe(function (e) {
            var reason = e && e.reason;
            track('js_error', {
                message: String((reason && reason.message) || reason || '').slice(0, 200),
                kind: 'unhandledrejection'
            });
        }));
    }

    function wireExit() {
        var sentExit = false;
        var exit = safe(function () {
            if (sentExit) return;
            sentExit = true;
            track('page_exit', {
                secondsOnPage: Math.round((Date.now() - startedAt) / 1000),
                maxScrollPercent: maxScroll
            });
            flush();
        });
        // pagehide is the reliable one on iOS Safari; visibilitychange covers tab switches.
        window.addEventListener('pagehide', exit);
        document.addEventListener('visibilitychange', safe(function () {
            if (document.visibilityState === 'hidden') exit();
        }));
    }

    // Public API for explicit events fired from script.js / rooms/script.js.
    window.Turaco = window.Turaco || {};
    window.Turaco.track = safe(track);
    window.Turaco.flush = safe(flush);

    if (optedOut) return;

    safe(function () {
        setInterval(safe(flush), FLUSH_INTERVAL_MS);
        wireErrors();
        wireExit();
        wireScrollDepth();

        function init() {
            trackPageView();
            wireClicks();
            wireFormEngagement();
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', safe(init));
        } else {
            init();
        }
    })();
})();
