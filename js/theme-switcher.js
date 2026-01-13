// Theme Switcher Functionality
(function() {
    'use strict';

    // Get saved theme or default to light
    const savedTheme = localStorage.getItem('lydistoriesTheme') || 'light';
    
    // Apply theme on page load
    document.addEventListener('DOMContentLoaded', function() {
        applyTheme(savedTheme);
        initializeThemeSwitcher();
    });

    function initializeThemeSwitcher() {
        const themeToggle = document.getElementById('themeToggle');
        const themeMenu = document.getElementById('themeMenu');
        const themeOptions = document.querySelectorAll('.theme-option');

        if (!themeToggle || !themeMenu) return;

        // Toggle theme menu
        themeToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            themeMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!themeMenu.contains(e.target) && e.target !== themeToggle) {
                themeMenu.classList.remove('active');
            }
        });

        // Theme selection
        themeOptions.forEach(option => {
            const theme = option.dataset.theme;
            
            // Mark current theme as active
            if (theme === savedTheme) {
                option.classList.add('active');
            }

            option.addEventListener('click', function() {
                const selectedTheme = this.dataset.theme;
                
                // Remove active class from all options
                themeOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to selected option
                this.classList.add('active');
                
                // Apply theme
                applyTheme(selectedTheme);
                
                // Save to localStorage
                localStorage.setItem('lydistoriesTheme', selectedTheme);
                
                // Close menu
                themeMenu.classList.remove('active');
                
                // Show confirmation
                showThemeChangeNotification(selectedTheme);
            });
        });
    }

    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        let themeColor = '#2c3e50'; // default
        switch(theme) {
            case 'dark':
                themeColor = '#1a1a2e';
                break;
            case 'ocean':
                themeColor = '#006d77';
                break;
            case 'sunset':
                themeColor = '#6d597a';
                break;
            case 'forest':
                themeColor = '#2d6a4f';
                break;
        }
        
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = themeColor;
    }

    function showThemeChangeNotification(theme) {
        // Remove existing notification
        const existingNotification = document.querySelector('.theme-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${capitalizeFirstLetter(theme)} theme applied!</span>
        `;
        
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Export for use in other scripts if needed
    window.applyTheme = applyTheme;
})();
