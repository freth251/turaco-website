// Get all form elements
const checkIn = document.getElementById('check-in');
const checkOut = document.getElementById('check-out');
const guests = document.getElementById("guests");
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitButton = document.getElementById('submit-btn');
const roomType = document.getElementById("room-type")
const inputContainer = '.input-container'
const dateContainer = '.check-date'
const selectContainer= '.select-container'

// Validation functions

function validateCurrentDate(date){
    const givenDate = new Date(date);
    const currentDate = new Date();
    return givenDate > currentDate;
}
function validateDate(checkIn, checkOut) {

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    return checkOutDate > checkInDate;
}

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

function validateGuests(guests){
    if (guests === "X") {
        return false;
    }
    return true

}
// Show error message
function showError(input, message) {
    const container = input.closest('.input-container');
    container.classList.add('error');
    const errorElement = container.querySelector('.error-message');
    errorElement.textContent = message;
}

function showError(input, message, containerType) {
    const container = input.closest(containerType);
    container.classList.add('error');
    const errorElement = container.querySelector('.error-message');
    errorElement.textContent = message;
}

// Clear error message
function clearError(input, containerType) {
    const container = input.closest(containerType);
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

    // Validate dates

    if(!validateCurrentDate(checkIn.value)){
        showError(checkIn, 'Invalid Check In date', dateContainer);
        isValid = false;
    } else {

        clearError(checkIn, dateContainer);
    }

    if(!validateCurrentDate(checkOut.value)){
        showError(checkOut, 'Invalid Check Out date', dateContainer);
        isValid = false;
    } else {
        clearError(checkOut, dateContainer);
    }
    
    if (!validateDate(checkIn.value, checkOut.value) && validateCurrentDate(checkIn.value) && validateCurrentDate(checkOut.value)) {
        showError(checkIn, 'Check in date must be greater than check out date', dateContainer);
        showError(checkOut, '', dateContainer);

        isValid = false;

    } else {
        if (isValid){
            clearError(checkIn, dateContainer);
            clearError(checkOut, dateContainer);
        }
    }
    // Validate name
    if (!validateName(nameInput.value)) {
        showError(nameInput, 'Name is required', inputContainer);
        isValid = false;
    } else {
        clearError(nameInput, inputContainer);
    }

    // Validate email
    if (!validateEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address', inputContainer);
        isValid = false;
    } else {
        clearError(emailInput, inputContainer);
    }

    // Validate phone
    if (!validatePhone(phoneInput.value)) {
        showError(phoneInput, 'Please enter a valid phone number', inputContainer);
        isValid = false;
    } else {
        clearError(phoneInput, inputContainer);
    }

    if (!validateGuests(guests.value)) {
        showError(guests, 'Please enter a valid phone number', selectContainer);
        isValid = false;
    } else {
        clearError(guests, selectContainer);
    }

    

    if (isValid) {
        console.log('Form is valid. Submitting...');
        const checkInDate = new Date(checkIn.value);
        const checkOutDate = new Date(checkOut.value);
        const postData = {
            checkIn: checkInDate.toISOString(),
            checkOut: checkOutDate.toISOString(),
            guests: parseInt(guests.value, 10),
            name: nameInput.value,
            email: emailInput.value,
            phoneNumber: phoneInput.value,
            roomType: roomType.textContent,
        }

        fetch('http://localhost:8080/api/reserve', {
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

[guests].forEach(input => {
    input.addEventListener('click', function() {
        clearError(input, selectContainer);
        clearSubmit();
    });
});

console.log(roomType.textContent)