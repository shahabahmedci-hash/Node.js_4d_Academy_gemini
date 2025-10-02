// src/lib/auth.js
import { supabaseClient, supabaseAdmin } from './db.js';
import { ADMIN_UUID } from '../config/supabase.js';

// --- CUSTOM SIGNUP (Server-Side using Admin Client) ---
export async function customSignup(phone, password, q1, q2, a1, a2) {
    try {
        // 1. Create a dummy email using the phone number (Supabase Auth requires an email format)
        const email = `${phone}@4dacademy.local`; 

        // 2. Use the Admin client to create the user, bypassing email verification requirements
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Automatically confirm since we are not using email for auth
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 3. Insert the actual phone number and security details into your custom user_profiles table
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
                user_id: userId,
                phone_number: phone,
                security_q1: q1,
                security_q2: q2,
                security_a1: a1,
                security_a2: a2,
            });

        if (profileError) {
            // If profile insert fails, clean up by deleting the user
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        // 4. If successful, automatically log the user in
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (sessionError) throw sessionError;

        return { session: sessionData.session, error: null };

    } catch (error) {
        console.error('Signup Error:', error);
        return { session: null, error: error.message };
    }
}

// --- CUSTOM LOGIN (Using Phone Number & Password) ---
export async function customLogin(phone, password) {
    try {
        // Construct the dummy email
        const email = `${phone}@4dacademy.local`;
        
        // Use the standard client to log in
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        
        return { session: data.session, error: null };
        
    } catch (error) {
        return { session: null, error: 'Invalid phone number or password.' };
    }
}

// --- FORGOT PASSWORD / SECURITY CHECK (Server-Side) ---
export async function verifyAndResetPassword(phone, answer1, answer2, newPassword) {
    try {
        // 1. Call the Supabase Postgres function to verify security answers
        const { data: verifyData, error: verifyError } = await supabaseAdmin.rpc('verify_security_answers', {
            p_phone_number: phone,
            p_answer1: answer1,
            p_answer2: answer2,
        });

        if (verifyError || !verifyData) throw new Error("Verification failed. Check your phone number or security answers.");

        const userId = verifyData; // This is the user's UUID returned by the function

        // 2. Use the Admin client to update the user's password directly
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (resetError) throw resetError;

        return { success: true, error: null };
        
    } catch (error) {
        console.error('Password Reset Error:', error);
        return { success: false, error: error.message };
    }
}

// --- LOGOUT ---
export async function customLogout() {
    const { error } = await supabaseClient.auth.signOut();
    return { error: error ? error.message : null };
}

// --- CHECK AUTH STATUS (Server-Side Helper for Middleware) ---
export async function getAuthenticatedUser(token) {
    if (!token) return { user: null };
    
    // Check if the token is valid with the Admin client
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) return { user: null };

    // Check if the user is the Admin
    const is_admin = data.user.id === ADMIN_UUID;

    return { user: data.user, is_admin: is_admin };
}
