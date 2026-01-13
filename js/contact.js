// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
    setupContactForm();
});

function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleContactSubmission();
    });
}

function handleContactSubmission() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    const formMessage = document.getElementById('formMessage');

    // Get submit button
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // Validate email
    if (!validateEmail(email)) {
        showFormMessage('Please enter a valid email address', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
    }

    // Create contact data object
    const contactData = {
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: message,
        timestamp: new Date().toISOString()
    };

    // In production, this would send to your backend API
    // For now, we'll simulate the submission
    setTimeout(() => {
        // Store message in localStorage (in production, send to server)
        storeContactMessage(contactData);

        // Show success message
        showFormMessage('Thank you for your message! We will get back to you soon.', 'success');

        // Reset form
        contactForm.reset();

        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        // Also send email notification (in production)
        // sendEmailNotification(contactData);
    }, 1500);
}

function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function storeContactMessage(contactData) {
    let messages = JSON.parse(localStorage.getItem('lydistoriesMessages') || '[]');
    messages.push(contactData);
    localStorage.setItem('lydistoriesMessages', JSON.stringify(messages));
}

function showFormMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';

    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 5000);
}

// Optional: Add real-time validation
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = '#e74c3c';
            } else {
                this.style.borderColor = '#ddd';
            }
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const phone = this.value.replace(/[\s-]/g, '');
            // Allow both Ugandan and international formats
            if (this.value && phone.length < 10) {
                this.style.borderColor = '#e74c3c';
            } else {
                this.style.borderColor = '#ddd';
            }
        });
    }
});
