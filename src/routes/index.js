// src/routes/index.js
// NOTE: This assumes an environment like Express.js where 'express' and 'router' are available.
import express from 'express';
import { supabaseClient } from '../lib/db.js'; // For client-side signout
import { customLogin, customSignup, verifyAndResetPassword } from '../lib/auth.js';
// The requireAuth middleware is not used directly here as these are public routes
// import { requireAuth } from './middleware.js'; 

const router = express.Router();

// --- GET: Default route renders the Welcome Page ---
router.get('/', (req, res) => {
    // Renders views/index.html (the welcome page)
    res.render('index', { title: 'Welcome to 4D Academy' });
});

// ----------------------------------------------------------------------
// LOGIN & LOGOUT
// ----------------------------------------------------------------------

// GET: Display Login Form
router.get('/login', (req, res) => {
    // If a valid session is already found client-side, JS should redirect to /dashboard.
    res.render('auth/login', { title: 'Login', error: req.query.error, message: req.query.message });
});

// POST: Handle Login Submission
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    const { session, error } = await customLogin(phone, password);

    if (error) {
        return res.render('auth/login', { title: 'Login', error: 'Invalid phone or password.' });
    }

    // SUCCESS: The user is authenticated. Supabase client saved the JWT in localStorage.
    // We only need to redirect to the protected area.
    res.redirect('/dashboard');
});

// GET: Handle Logout
router.get('/logout', async (req, res) => {
    // Invalidate the session on the server (Supabase)
    await supabaseClient.auth.signOut(); 
    
    // Client-side JS will handle clearing localStorage. Redirect.
    res.redirect('/login?message=You have been logged out.');
});


// ----------------------------------------------------------------------
// SIGNUP
// ----------------------------------------------------------------------

// GET: Display Signup Form
router.get('/signup', (req, res) => {
    res.render('auth/signup', { title: 'Create Account', error: null });
});

// POST: Handle Signup Submission
router.post('/signup', async (req, res) => {
    const { phone, password, confirm_password, q1, q2, a1, a2, a1_answer, a2_answer } = req.body;
    
    // Basic validation
    if (password !== confirm_password) {
        return res.render('auth/signup', { title: 'Create Account', error: 'Passwords do not match.' });
    }

    const { session, error } = await customSignup(phone, password, q1, q2, a1_answer, a2_answer); // Note: a1/a2 are answers here

    if (error) {
        return res.render('auth/signup', { title: 'Create Account', error: error.includes('already exists') ? 'Phone number already registered.' : 'Signup failed. Please try again.' });
    }

    // SUCCESS: User is created and logged in. Redirect to dashboard.
    res.redirect('/dashboard');
});


// ----------------------------------------------------------------------
// FORGOT PASSWORD
// ----------------------------------------------------------------------

// GET: Display Forgot Password Form
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgotPassword', { title: 'Reset Password', message: null, error: false });
});

// POST: Handle Forgot Password Submission (Verify Answers & Reset)
router.post('/forgot-password', async (req, res) => {
    const { phone, answer1, answer2, new_password, confirm_new_password } = req.body;

    if (new_password !== confirm_new_password) {
        return res.render('auth/forgotPassword', { 
            title: 'Reset Password', 
            message: 'Error: New passwords do not match.',
            error: true
        });
    }

    const { success, error } = await verifyAndResetPassword(phone, answer1, answer2, new_password);

    if (success) {
        return res.redirect('/login?message=Password reset successful. Please log in.');
    } else {
        return res.render('auth/forgotPassword', { 
            title: 'Reset Password', 
            message: 'Error: Verification failed. Check phone number or security answers.',
            error: true
        });
    }
});


export default router;