// src/routes/app/finance.js
import express from 'express';
import { supabaseAdmin } from '../../lib/db.js';

const router = express.Router();

// NOTE: This entire router should be placed behind the requireAuth middleware.

// Helper to fetch all students (needed for fee forms)
async function getAllStudents() {
    const { data: students, error } = await supabaseAdmin
        .from('students')
        .select('student_id, first_name, last_name, class_section')
        .order('last_name', { ascending: true });
    
    if (error) throw error;
    return students;
}

// --- GET: Main Finance Overview (Fees & Income/Expense List) ---
router.get('/', async (req, res) => {
    let financeData = { fees: [], expensesIncome: [] };
    let error = req.query.error;

    try {
        // 1. Fetch All Fees with Student Names
        const { data: fees, error: feeError } = await supabaseAdmin
            .from('fees')
            .select(`
                *,
                students (first_name, last_name)
            `)
            .order('due_date', { ascending: false });

        if (feeError) throw feeError;
        financeData.fees = fees;

        // 2. Fetch Recent Income and Expenses
        const { data: expensesIncome, error: eiError } = await supabaseAdmin
            .from('expenses_income')
            .select('*')
            .order('transaction_date', { ascending: false })
            .limit(10); // Show last 10 transactions

        if (eiError) throw eiError;
        financeData.expensesIncome = expensesIncome;

    } catch (e) {
        console.error('Error fetching finance data:', e.message);
        error = e.message;
    }

    res.render('finance/list', {
        title: 'Financial Management',
        activePage: 'finance',
        fees: financeData.fees,
        expensesIncome: financeData.expensesIncome,
        message: req.query.message,
        error: error
    });
});

// ----------------------------------------------------------------------
// FEE MANAGEMENT
// ----------------------------------------------------------------------

// GET: Display Add Fee Form
router.get('/fees/add', async (req, res) => {
    try {
        const students = await getAllStudents();
        res.render('finance/fee_form', { 
            title: 'Create New Fee Record',
            activePage: 'finance',
            students: students,
            isEdit: false
        });
    } catch (error) {
        res.redirect('/finance?error=Failed to load fee form: ' + error.message);
    }
});

// POST: Handle Add Fee Submission
router.post('/fees/save', async (req, res) => {
    const { student_id, amount, due_date, description } = req.body;
    
    try {
        const { error } = await supabaseAdmin
            .from('fees')
            .insert({
                student_id,
                amount: parseFloat(amount),
                due_date,
                description,
                // Status defaults to 'Unpaid' in the database
            });

        if (error) throw error;
        return res.redirect('/finance?message=New fee record created successfully!');
    } catch (error) {
        console.error('Error creating fee record:', error);
        return res.redirect(`/finance/fees/add?error=Failed to create fee record.`);
    }
});

// POST: Mark Fee as Paid (Uses the trigger/function we created earlier)
router.post('/fees/pay/:id', async (req, res) => {
    const feeId = req.params.id;
    const { paid_on } = req.body; // Expects a date input from the form

    try {
        // The database trigger will handle the status update and the income recording.
        const { error } = await supabaseAdmin
            .from('fees')
            .update({ paid_date: paid_on || new Date().toISOString() })
            .eq('fee_id', feeId)
            .eq('status', 'Unpaid'); // Crucial check

        if (error) throw error;
        
        return res.redirect('/finance?message=Fee successfully marked as Paid and Income recorded!');
    } catch (error) {
        console.error('Error marking fee as paid:', error);
        return res.redirect(`/finance?error=Failed to mark fee as paid: ${error.message}`);
    }
});

// ----------------------------------------------------------------------
// INCOME/EXPENSE MANAGEMENT
// ----------------------------------------------------------------------

// GET: Display Add Income/Expense Form
router.get('/transactions/add', async (req, res) => {
    res.render('finance/transaction_form', { 
        title: 'Add Income or Expense',
        activePage: 'finance',
        isEdit: false
    });
});

// POST: Handle Add Income/Expense Submission
router.post('/transactions/save', async (req, res) => {
    const { type, amount, transaction_date, description, category } = req.body;
    
    try {
        const { error } = await supabaseAdmin
            .from('expenses_income')
            .insert({
                type,
                amount: parseFloat(amount),
                transaction_date,
                description,
                category
            });

        if (error) throw error;
        return res.redirect(`/finance?message=${type} recorded successfully!`);
    } catch (error) {
        console.error('Error recording transaction:', error);
        return res.redirect(`/finance/transactions/add?error=Failed to record transaction.`);
    }
});


export default router;
