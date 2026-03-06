const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : window.location.origin;

// Page view tracking
fetch('https://turacoaddis.com/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: window.location.pathname, referrer: document.referrer })
});

const checkIn = document.getElementById('check-in');
const checkOut = document.getElementById('check-out');
const guests = document.getElementById('guests');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitButton = document.getElementById('submit-btn');
const roomType = document.getElementById('room-type');

const inputContainer = '.input-container';
const dateContainer = '.check-date';
const selectContainer = '.select-container';

function validateCurrentDate(date) {
    return new Date(date) > new Date();
}

function validateDate(checkIn, checkOut) {
    return new Date(checkOut) > new Date(checkIn);
}

function validateName(name) {
    return name.trim().length > 0;
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
    const re = /^\d{10,15}$/;
    return re.test(phone.replace(/\D/g, ''));
}

function validateGuests(guests) {
    return guests !== 'X';
}

function showError(input, message, containerType) {
    const container = input.closest(containerType);
    container.classList.add('error');
    container.querySelector('.error-message').textContent = message;
}

function clearError(input, containerType) {
    const container = input.closest(containerType);
    container.classList.remove('error');
    container.querySelector('.error-message').textContent = '';
}

function clearSubmit() {
    submitButton.classList.add('animating');
    setTimeout(() => { submitButton.classList.remove('animating'); }, 1000);
    submitButton.classList.remove('submit-error', 'submitted');
    submitButton.textContent = t('room_reserve');
}

submitButton.addEventListener('click', function(e) {
    e.preventDefault();
    let isValid = true;

    if (!validateCurrentDate(checkIn.value)) {
        showError(checkIn, t('err_checkin'), dateContainer);
        isValid = false;
    } else {
        clearError(checkIn, dateContainer);
    }

    if (!validateCurrentDate(checkOut.value)) {
        showError(checkOut, t('err_checkout'), dateContainer);
        isValid = false;
    } else {
        clearError(checkOut, dateContainer);
    }

    if (!validateDate(checkIn.value, checkOut.value)
        && validateCurrentDate(checkIn.value)
        && validateCurrentDate(checkOut.value)) {
        showError(checkIn, t('err_dates'), dateContainer);
        showError(checkOut, '', dateContainer);
        isValid = false;
    } else if (isValid) {
        clearError(checkIn, dateContainer);
        clearError(checkOut, dateContainer);
    }

    if (!validateName(nameInput.value)) {
        showError(nameInput, t('err_name'), inputContainer);
        isValid = false;
    } else {
        clearError(nameInput, inputContainer);
    }

    if (!validateEmail(emailInput.value)) {
        showError(emailInput, t('err_email'), inputContainer);
        isValid = false;
    } else {
        clearError(emailInput, inputContainer);
    }

    if (!validatePhone(phoneInput.value)) {
        showError(phoneInput, t('err_phone'), inputContainer);
        isValid = false;
    } else {
        clearError(phoneInput, inputContainer);
    }

    if (!validateGuests(guests.value)) {
        showError(guests, t('err_guests'), selectContainer);
        isValid = false;
    } else {
        clearError(guests, selectContainer);
    }

    if (isValid) {
        const postData = {
            checkIn: new Date(checkIn.value).toISOString(),
            checkOut: new Date(checkOut.value).toISOString(),
            guests: parseInt(guests.value, 10),
            name: nameInput.value,
            email: emailInput.value,
            phoneNumber: phoneInput.value,
            roomType: roomType.dataset.roomType,
        };

        fetch(`${API_BASE}/api/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            submitButton.textContent = t('success_contact');
            submitButton.classList.add('submitted', 'animating');
            setTimeout(() => { submitButton.classList.remove('animating'); }, 1000);
        })
        .catch(error => {
            submitButton.textContent = t('err_try_again');
            submitButton.classList.add('submit-error', 'animating');
            setTimeout(() => { submitButton.classList.remove('animating'); }, 1000);
        });
    }
});

[nameInput, emailInput, phoneInput].forEach(input => {
    input.addEventListener('click', function() {
        clearError(input, inputContainer);
        clearSubmit();
    });
});

[checkIn, checkOut].forEach(input => {
    input.addEventListener('click', function() {
        clearError(input, dateContainer);
        clearSubmit();
    });
});

guests.addEventListener('click', function() {
    clearError(guests, selectContainer);
    clearSubmit();
});
