// public/js/ui.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Theme (Dark/Light Mode)
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme on load
    document.body.classList.add(savedTheme + '-mode');
    updateThemeToggleIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.body.classList.remove('light-mode', 'dark-mode');
            document.body.classList.add(newTheme + '-mode');
            localStorage.setItem('theme', newTheme);
            updateThemeToggleIcon(newTheme);
        });
    }

    function updateThemeToggleIcon(theme) {
        if (themeToggle) {
            // Use simple emoji icons: 🌙 (Moon) for light theme (to switch to dark), ☀️ (Sun) for dark theme
            themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
        }
    }

    // 2. Header Scroll Effect (Logo Shift)
    const headerOverlay = document.querySelector('.header-overlay');
    if (headerOverlay) {
        window.addEventListener('scroll', () => {
            // Add 'scrolled' class after scrolling past 50px
            if (window.scrollY > 50) {
                headerOverlay.classList.add('scrolled');
            } else {
                headerOverlay.classList.remove('scrolled');
            }
        });
    }
});

// 3. Password Visibility Toggle (Global Function for HTML templates)
window.togglePasswordVisibility = function(id) {
    const input = document.getElementById(id);
    const toggle = input.nextElementSibling; // Assumes toggle is the next element
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = '🙈'; // Hide icon
    } else {
        input.type = 'password';
        toggle.innerHTML = '👁️'; // Show icon
    }
};
