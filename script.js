const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : window.location.origin;

// Page view tracking
fetch('https://turacoaddis.com/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: window.location.pathname, referrer: document.referrer })
});


function newSwiper(swiperContainer){
    return new Swiper(swiperContainer, {
        loop: true,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: true,
        speed: 1200,
        cssMode: false,
        effect: 'slide'
    });
}

function newSwiperAuto(swiperContainer){
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    return new Swiper(swiperContainer, {
        loop: true,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: true,
        autoplay: {
            delay: 5000 + randomNumber * 500,
            disableOnInteraction: false,
        },
        speed: 1200,
        cssMode: false,
        effect: 'slide',
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const scrollButtons = document.querySelectorAll('.scroll-button');
    const navLinks = document.getElementById('nav-links');

    scrollButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Close mobile nav on link click
            if (navLinks) navLinks.classList.remove('open');
        });
    });

    // Active nav highlighting via IntersectionObserver
    const navButtons = document.querySelectorAll('.scroll-button[data-target]');
    const sectionIds = ['a1', 'a3', 'a4', 'a5', 'a6'];
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.target === entry.target.id);
                });
            }
        });
    }, { threshold: 0.35 });
    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });

    newSwiperAuto('.swiper-container-main');
    newSwiper('.swiper-container1');
    newSwiper('.swiper-container2');
    newSwiper('.swiper-container3');
    newSwiperAuto('.swiper-container-event');
    newSwiperAuto('.swiper-container-amenities');
    newSwiperAuto('.swiper-container-cu');
});

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const messageInput = document.getElementById('message');
const submitButton = document.getElementById('submit-btn');

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

function validateMessage(message) {
    return message.trim().length > 0;
}

function showError(input, message) {
    const container = input.closest('.input-container');
    container.classList.add('error');
    container.querySelector('.error-message').textContent = message;
}

function clearError(input) {
    const container = input.closest('.input-container');
    container.classList.remove('error');
    container.querySelector('.error-message').textContent = '';
}

function clearSubmit() {
    submitButton.classList.add('animating');
    setTimeout(() => { submitButton.classList.remove('animating'); }, 1000);
    submitButton.classList.remove('submit-error', 'submitted');
    submitButton.textContent = t('form_submit');
}

submitButton.addEventListener('click', function(e) {
    e.preventDefault();
    let isValid = true;

    if (!validateName(nameInput.value)) {
        showError(nameInput, t('err_name'));
        isValid = false;
    } else {
        clearError(nameInput);
    }

    if (!validateEmail(emailInput.value)) {
        showError(emailInput, t('err_email'));
        isValid = false;
    } else {
        clearError(emailInput);
    }

    if (!validatePhone(phoneInput.value)) {
        showError(phoneInput, t('err_phone'));
        isValid = false;
    } else {
        clearError(phoneInput);
    }

    if (!validateMessage(messageInput.value)) {
        showError(messageInput, t('err_message'));
        isValid = false;
    } else {
        clearError(messageInput);
    }

    if (isValid) {
        const postData = {
            name: nameInput.value,
            email: emailInput.value,
            phoneNumber: phoneInput.value,
            message: messageInput.value
        };

        fetch(`${API_BASE}/api/contact`, {
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

[nameInput, emailInput, phoneInput, messageInput].forEach(input => {
    input.addEventListener('click', function() {
        clearError(input);
        clearSubmit();
    });
});
