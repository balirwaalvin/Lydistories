// Import Firebase service
import firebaseService from './firebase-service.js';

// Default admin credentials (in production, this should be in a secure database)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
    email: 'admin@lydistories.com'
};

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Make togglePassword globally accessible
window.togglePassword = togglePassword;

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginError = document.getElementById('loginError');
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            
            // Validate credentials locally first
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                // Set admin session
                sessionStorage.setItem('lydistoriesAdmin', 'true');
                sessionStorage.setItem('adminUsername', username);
                
                // Redirect to dashboard
                window.location.href = 'admin-dashboard.html';
            } else {
                // Show error
                loginError.textContent = 'Invalid username or password';
                loginError.classList.add('show');
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Clear after 3 seconds
                setTimeout(() => {
                    loginError.classList.remove('show');
                }, 3000);
            }
        });
    }
});
