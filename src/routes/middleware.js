// src/routes/middleware.js
// NOTE: For this middleware to work, you need to ensure the client-side JWT 
// is correctly passed to the server (e.g., via an HTTP-only cookie or Authorization header).

import { getAuthenticatedUser } from '../lib/auth.js';

// Middleware function to check authentication status before rendering a protected page
export const requireAuth = async (req, res, next) => {
    // 1. Retrieve the JWT token. This depends on how Hopweb/Express handles client tokens.
    // OPTION A: If using a simple Bearer token in the header (common for client-server APIs)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // OPTION B: If using a cookie (more secure for full-stack apps)
    // const token = req.cookies['sb-access-token']; // Requires cookie-parser setup

    if (!token) {
        // No token found, redirect to login with error
        return res.redirect('/login?error=Session expired or not logged in.');
    }

    // 2. Verify the token with Supabase
    const { user, is_admin } = await getAuthenticatedUser(token);

    if (!user) {
        // Token is invalid or expired
        // You might want to clear the cookie here if it exists
        return res.redirect('/login?error=Session invalid. Please log in again.');
    }

    // 3. Token is valid. Attach user object to the request for downstream routes
    req.user = user;
    req.is_admin = is_admin;
    next();
};
