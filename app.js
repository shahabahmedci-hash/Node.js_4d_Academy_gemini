// app.js (Main Hopweb Server File)

// --- 1. Import Necessary Libraries ---
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

// For template rendering (assuming Hopweb uses Handlebars/HBS or a similar templating engine)
import hbs from 'hbs'; 

// --- Import Routes and Middleware ---
import authRouter from './src/routes/index.js'; // Auth routes (unprotected)
import dashboardRouter from './src/routes/app/dashboard.js';
import studentsRouter from './src/routes/app/students.js';
import financeRouter from './src/routes/app/finance.js';
import { requireAuth } from './src/routes/middleware.js';

// --- 2. Initialization ---
const app = express();
const port = 3000; // Or whatever port Hopweb uses

// --- 3. Template Engine Setup (Adjust this based on Hopweb's specific setup) ---

// Assuming views are in the root /views directory
app.set('views', path.join(process.cwd(), 'views')); 
app.set('view engine', 'html'); // Set your primary view engine
app.engine('html', hbs.__express); // Link .html files to the HBS engine

// Register Handlebars helpers (like the ifEquals we used in templates)
hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

// --- 4. Global Middleware Setup ---

// Serve static files (CSS, JS, images) from the public directory
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

// Parse application/json
app.use(bodyParser.json());

// --- 5. Route Mapping ---

// A. Unprotected Routes (Authentication)
// These routes handle login, signup, logout and are publicly accessible.
app.use('/', authRouter); 

// B. Protected Routes (The Main Application)
// All routes starting with /dashboard, /students, /finance must pass requireAuth.
app.use('/dashboard', requireAuth, dashboardRouter);
app.use('/students', requireAuth, studentsRouter);
app.use('/finance', requireAuth, financeRouter);

// --- 6. Error Handling / 404 Route ---
app.use((req, res) => {
    // If no route matches, return a 404 page (or redirect to dashboard if logged in)
    res.status(404).send("<h1>404 Not Found</h1><p>The page you requested does not exist.</p>");
});

// --- 7. Start Server ---
app.listen(port, () => {
    console.log(`4D Academy CMS running on http://localhost:${port}`);
    console.log('----------------------------------------------------');
    console.log('Next Steps: 1. Ensure all Supabase SQL is executed.');
    console.log('            2. Navigate to /login to start.');
});