/* Where the API lives.
   Default is SAME-ORIGIN, so production calls /api/contact on turacoaddis.com and
   there is never a hardcoded host in shipped code. To point a local page at a
   local backend, define the override before this script loads:
       <script>window.TURACO_CONFIG = { apiBase: 'http://localhost:8080' };</script> */
const API_BASE = (window.TURACO_CONFIG && window.TURACO_CONFIG.apiBase) || '';
const FRONT_DESK_EMAIL = 'amentamerat@gmail.com';
const FRONT_DESK_TEL = '+251911208751';

// Thin wrapper so a missing telemetry.js can never break the forms.
function track(event, props) {
    try {
        if (window.Turaco && window.Turaco.track) window.Turaco.track(event, props);
    } catch (e) { /* ignore */ }
}

const contactForm = document.getElementById('contact-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const messageInput = document.getElementById('message');
const submitButton = document.getElementById('submit-btn');
const formStatus = document.getElementById('form-status');
const formFallback = document.getElementById('form-fallback');

// The button's meaning is held here, not scraped from its text, so it can be
// re-translated when the visitor switches language mid-flow.
let submitState = 'idle'; // idle | sending | success | error

function validateName(name) {
    return name.trim().length >= 2;
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim().toLowerCase());
}

function validatePhone(phone) {
    // Accepts local (0911234567) and international (+251911208751) formats.
    return /^\d{7,15}$/.test(phone.replace(/\D/g, ''));
}

function validateMessage(message) {
    return message.trim().length >= 10;
}

function showError(input, message) {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.add('error');
    const slot = field.querySelector('.error-message');
    if (slot) slot.textContent = message;
    input.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.remove('error');
    const slot = field.querySelector('.error-message');
    if (slot) slot.textContent = '';
    input.removeAttribute('aria-invalid');
}

function mailtoFallback() {
    const subject = 'Website enquiry';
    const lines = [
        nameInput && nameInput.value ? 'Name: ' + nameInput.value : '',
        phoneInput && phoneInput.value ? 'Phone: ' + phoneInput.value : '',
        emailInput && emailInput.value ? 'Email: ' + emailInput.value : '',
        '',
        messageInput ? messageInput.value : ''
    ].filter(Boolean);
    return 'mailto:' + FRONT_DESK_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
}

// Renders the button + status area from `submitState`, in the current language.
function renderSubmitState() {
    if (!submitButton) return;

    submitButton.classList.toggle('is-success', submitState === 'success');
    submitButton.classList.remove('is-error');
    submitButton.disabled = submitState === 'sending';

    // The outcome is reported once, in the status line below the button.
    // The button only ever says what it does.
    if (submitState === 'sending') submitButton.textContent = t('form_sending');
    else submitButton.textContent = t('form_submit');

    if (formStatus) {
        formStatus.textContent = submitState === 'error' ? t('err_send_failed')
            : submitState === 'success' ? t('success_contact')
            : '';
        formStatus.classList.toggle('is-error', submitState === 'error');
        formStatus.classList.toggle('is-success', submitState === 'success');
    }

    if (formFallback) {
        // On failure, hand the visitor a phone number and a pre-filled email
        // so the enquiry is not simply lost. Labels are translated by the
        // data-i18n spans; only the hrefs are built here, so the <bdi>-wrapped
        // number is never replaced by textContent.
        formFallback.hidden = submitState !== 'error';
        const call = formFallback.querySelector('[data-fallback="call"]');
        const mail = formFallback.querySelector('[data-fallback="email"]');
        if (call) call.href = 'tel:' + FRONT_DESK_TEL;
        if (mail) mail.href = mailtoFallback();
    }
}

function setSubmitState(state) {
    submitState = state;
    renderSubmitState();
}

if (contactForm && submitButton) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const checks = [
            [nameInput, validateName(nameInput.value),
                nameInput.value.trim() ? 'err_name_short' : 'err_name'],
            [emailInput, validateEmail(emailInput.value), 'err_email'],
            [phoneInput, validatePhone(phoneInput.value), 'err_phone'],
            [messageInput, validateMessage(messageInput.value),
                messageInput.value.trim() ? 'err_message_short' : 'err_message']
        ];

        let isValid = true;
        let firstInvalid = null;
        checks.forEach(([input, ok, errKey]) => {
            if (ok) {
                clearError(input);
            } else {
                showError(input, t(errKey));
                isValid = false;
                if (!firstInvalid) firstInvalid = input;
            }
        });

        if (!isValid) {
            track('form_invalid', { form: 'contact' });
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const postData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            phoneNumber: phoneInput.value.trim(),
            message: messageInput.value.trim()
        };

        setSubmitState('sending');
        track('form_submit', { form: 'contact' });

        fetch(`${API_BASE}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        })
            .then(response => {
                // An HTTP error is a failure, not a success with an error body.
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(() => {
                setSubmitState('success');
                contactForm.reset();
                track('form_success', { form: 'contact' });
            })
            .catch(error => {
                setSubmitState('error');
                track('form_failure', {
                    form: 'contact',
                    reason: String((error && error.message) || error).slice(0, 120)
                });
            });
    });

    [nameInput, emailInput, phoneInput, messageInput].forEach(input => {
        if (!input) return;
        input.addEventListener('input', function () {
            clearError(input);
            if (submitState === 'success' || submitState === 'error') setSubmitState('idle');
        });
    });

    renderSubmitState();
}

// Re-render the button and status in the newly chosen language.
document.addEventListener('turaco:langchange', renderSubmitState);
