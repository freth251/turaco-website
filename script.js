function newSwiper(swiperContainer){
    return new Swiper(swiperContainer, {
        loop: true,
      pagination: {
        el: '.swiper-pagination', clickable: true,
    
      },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      slidesPerView: 1, // Show only one slide at a time
      spaceBetween: 20, // No space between slides
      centeredSlides: true, // Center the slide
      speed: 1200, 
      cssMode: false, 
      effect: 'slide'
    
    });
}

function newSwiperAuto(swiperContainer){
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    return new Swiper(swiperContainer, {
        loop: true,
      pagination: {
        el: '.swiper-pagination', clickable: true,
    
      },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      slidesPerView: 1, // Show only one slide at a time
      spaceBetween: 20, // No space between slides
      centeredSlides: true, // Center the slide
      autoplay: {
        delay: 5000 + randomNumber*500, // Slide delay in milliseconds (3000ms = 3 seconds)
        disableOnInteraction: false, // Continue autoplay after user interactions (like swiping)
       },
       speed: 1200, 
       
       cssMode: false, 
       effect: 'slide', 
    });
}
document.addEventListener('DOMContentLoaded', function() {
    const scrollButtons = document.querySelectorAll('.scroll-button');
    
    scrollButtons.forEach(button => {
        button.addEventListener('click', function() {
            
            const targetId = this.getAttribute('data-target');
            if (!window.location.href.includes("index.html")){
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });

            }else{
            const targetElement = document.getElementById(targetId);
            
            console.log("TID: ", targetElement);
            console.log("TE: ", targetElement)
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }

        
            }
        });
    });


    const bookButtons = document.querySelectorAll('.book-button');

    bookButtons.forEach(button => {
        button.addEventListener('click', function(){
            window.location.href = "book.html"
        });
    });
    var swiperMain = newSwiperAuto('.swiper-container-main');

    var swiper1 = newSwiper('.swiper-container1');

    var swiper2 = newSwiper('.swiper-container2');

    var swiper3 = newSwiper('.swiper-container3');

    var swiperEvent = newSwiperAuto('.swiper-container-event');

    var swiperAmenities = newSwiperAuto('.swiper-container-amenities');

    var swiperCu = newSwiperAuto('.swiper-container-cu');


});

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const messageInput = document.getElementById('message');
const submitButton = document.getElementById('submit-btn');

// Validation functions
function validateName(name) {
    return name.trim().length > 0;
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
    const re = /^\d{10,15}$/; // Assumes a 10-digit phone number
    return re.test(phone.replace(/\D/g, '')); // Remove non-digits before testing
}

function validateMessage(message) {
    return message.trim().length > 0;
}

// Show error message
function showError(input, message) {
    const container = input.closest('.input-container');
    container.classList.add('error');
    const errorElement = container.querySelector('.error-message');
    errorElement.textContent = message;
}

// Clear error message
function clearError(input) {
    const container = input.closest('.input-container');
    container.classList.remove('error');
    const errorElement = container.querySelector('.error-message');
    errorElement.textContent = '';
}
function clearSubmit(){
    submitButton.classList.add('animating');
    setTimeout(() => {
        submitButton.classList.remove('animating');
    }, 1000);
    submitButton.classList.remove('submit-error');
    submitButton.classList.remove('submitted');
    submitButton.textContent = 'Reserve';
}

// Validate form on submit
submitButton.addEventListener('click', function(e) {
    console.log("Submitted");
    e.preventDefault();
    let isValid = true;

    // Validate name
    if (!validateName(nameInput.value)) {
        showError(nameInput, 'Name is required');
        isValid = false;
    } else {
        clearError(nameInput);
    }

    // Validate email
    if (!validateEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearError(emailInput);
    }

    // Validate phone
    if (!validatePhone(phoneInput.value)) {
        showError(phoneInput, 'Please enter a valid phone number');
        isValid = false;
    } else {
        clearError(phoneInput);
    }

    // Validate message
    if (!validateMessage(messageInput.value)) {
        showError(messageInput, 'Message is required');
        isValid = false;
    } else {
        clearError(messageInput);
    }

    if (isValid) {
        // If the form is valid, you can submit it here
        console.log('Form is valid. Submitting...');
        // form.submit(); // Uncomment this line to actually submit the form
        

        const postData = {
            name: nameInput.value,
            email: emailInput.value,
            phoneNumber: phoneInput.value,
            message: messageInput.value
        }

        fetch('http://localhost:8080/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)  // Convert data to JSON
        })
        .then(response => response.json())
        .then(data => {
            submitButton.textContent = "We'll get in touch shortly.";
            submitButton.classList.add('submitted', 'animating');
            setTimeout(() => {
                submitButton.classList.remove('animating');
            }, 1000);
           
            
        })
        .catch(error => {
            console.error('Error:', error)
            submitButton.textContent = 'Error! Please try again';
            submitButton.classList.add('submit-error', 'animating');
            setTimeout(() => {
                submitButton.classList.remove('animating');
            }, 1000);
        });
    }
});

// Clear errors on input
[nameInput, emailInput, phoneInput, messageInput].forEach(input => {
    input.addEventListener('click', function() {
        clearError(input);
        clearSubmit();
    });
});