// Default admin credentials (in production, this should be in a secure database)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
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

// Handle login form submission
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    
    // Validate credentials
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
        
        // Clear after 3 seconds
        setTimeout(() => {
            loginError.classList.remove('show');
        }, 3000);
    }
});
