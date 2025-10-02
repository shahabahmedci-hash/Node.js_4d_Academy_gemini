// src/routes/app/dashboard.js
import express from 'express';
import { supabaseAdmin } from '../../lib/db.js'; // Use admin to bypass RLS for aggregate reports

const router = express.Router();

router.get('/', async (req, res) => {
    // req.user and req.is_admin are attached by the requireAuth middleware

    let analyticsData = {
        totalStudents: 0,
        paidFeesCount: 0,
        unpaidFeesCount: 0,
        lastMonthIncome: 0,
        monthlyReports: []
    };

    try {
        // --- 1. Fetch Total Students ---
        const { count: studentCount, error: studentError } = await supabaseAdmin
            .from('students')
            .select('*', { count: 'exact', head: true });

        if (studentError) throw studentError;
        analyticsData.totalStudents = studentCount;

        // --- 2. Fetch Fee Status Counts ---
        const { data: feeCounts, error: feeError } = await supabaseAdmin.rpc('get_fee_status_counts'); 
        // NOTE: We'll define 'get_fee_status_counts' in the next step to keep SQL clean

        if (feeError) throw feeError;
        
        analyticsData.paidFeesCount = feeCounts.find(c => c.status === 'Paid')?.count || 0;
        analyticsData.unpaidFeesCount = feeCounts.find(c => c.status === 'Unpaid')?.count || 0;


        // --- 3. Fetch Last Month's Income ---
        // NOTE: A more complex RPC for reporting is ideal, but for simplicity:
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const { data: incomeData, error: incomeError } = await supabaseAdmin
            .from('expenses_income')
            .select('amount')
            .eq('type', 'Income')
            .gte('transaction_date', lastMonth.toISOString().split('T')[0]);

        if (incomeError) throw incomeError;
        
        analyticsData.lastMonthIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);


        // --- 4. Fetch Monthly Reports (Mock for chart data structure) ---
        // Ideally, this uses a custom RPC for aggregated monthly data.
        analyticsData.monthlyReports = [
            { month: 'Jan', income: 45000, expense: 12000 },
            { month: 'Feb', income: 52000, expense: 15000 },
            { month: 'Mar', income: 68000, expense: 18000 },
        ];


    } catch (error) {
        console.error('Dashboard Data Fetch Error:', error.message);
        // Continue rendering the page but with error message
        analyticsData.error = 'Could not load all analytics data.';
    }

    res.render('dashboard', {
        title: 'Dashboard',
        activePage: 'dashboard',
        analytics: analyticsData,
        // Pass the JSON data for Chart.js rendering client-side
        chartDataJson: JSON.stringify(analyticsData.monthlyReports) 
    });
});

export default router;
