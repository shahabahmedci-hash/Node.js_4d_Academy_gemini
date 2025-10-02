// public/js/security.js

document.addEventListener('DOMContentLoaded', () => {
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
    let timeoutId;

    function startInactivityTimer() {
        // Clear any existing timer
        clearTimeout(timeoutId);

        // Set a new timer
        timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS);
    }

    function resetInactivityTimer() {
        startInactivityTimer();
    }

    function handleLogout() {
        // Check if the user is currently on an auth page (prevent redirect loops)
        if (window.location.pathname.includes('/login') || window.location.pathname.includes('/signup')) {
            return;
        }
        
        // 1. Display message (optional, but good UX)
        alert('You have been logged out due to 10 minutes of inactivity.');

        // 2. Clear the JWT token from localStorage
        // Supabase stores its token under a specific key, typically:
        localStorage.removeItem('supabase.auth.token');
        
        // 3. Redirect to the login page
        window.location.href = '/login?message=Logged out due to inactivity.';
    }

    // Event listeners to reset the timer on user activity
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('scroll', resetInactivityTimer);
    
    // Start the timer when the page loads
    startInactivityTimer();
});
