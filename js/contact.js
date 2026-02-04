// Import Firebase service
import firebaseService from './firebase-service.js';

// Contact page - no form handling needed, just animations
document.addEventListener('DOMContentLoaded', function() {
    console.log('Contact page loaded with animations');
});
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
