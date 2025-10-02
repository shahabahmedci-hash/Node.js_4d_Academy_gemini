// src/routes/app/students.js
import express from 'express';
import { supabaseAdmin } from '../../lib/db.js';

const router = express.Router();

// NOTE: This entire router should be placed behind the requireAuth middleware 
// in your main application file to ensure only the Admin can access it.

// --- GET: List All Students ---
router.get('/', async (req, res) => {
    try {
        const { data: students, error } = await supabaseAdmin
            .from('students')
            .select('*')
            .order('last_name', { ascending: true }); // Order by last name

        if (error) throw error;

        res.render('students/list', { 
            title: 'Student Management',
            activePage: 'students',
            students: students || [],
            message: req.query.message // Used for success/error messages after actions
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.render('students/list', { 
            title: 'Student Management',
            activePage: 'students',
            students: [],
            error: 'Failed to load student data.'
        });
    }
});


// --- GET: Display Add/Edit Student Form ---
router.get('/form/:id?', async (req, res) => {
    const studentId = req.params.id;
    let student = null;
    let title = 'Add New Student';

    try {
        if (studentId) {
            // Fetch student data for editing
            const { data, error } = await supabaseAdmin
                .from('students')
                .select('*')
                .eq('student_id', studentId)
                .single();

            if (error) throw error;
            student = data;
            title = `Edit Student: ${data.first_name} ${data.last_name}`;
        }

        res.render('students/form', {
            title: title,
            activePage: 'students',
            student: student, // null for new, object for edit
            isEdit: !!studentId
        });

    } catch (error) {
        console.error('Error fetching student for form:', error);
        res.redirect('/students?error=Student not found or failed to load form.');
    }
});


// --- POST: Handle Add/Edit Submission ---
router.post('/save', async (req, res) => {
    const { student_id, first_name, last_name, phone, address, class_section, father_name } = req.body;
    const isEditing = !!student_id;

    const studentData = { first_name, last_name, phone, address, class_section, father_name };

    try {
        if (isEditing) {
            // UPDATE operation
            const { error } = await supabaseAdmin
                .from('students')
                .update(studentData)
                .eq('student_id', student_id);

            if (error) throw error;
            return res.redirect('/students?message=Student updated successfully!');
            
        } else {
            // INSERT operation
            const { error } = await supabaseAdmin
                .from('students')
                .insert(studentData);
            
            if (error) throw error;
            return res.redirect('/students?message=New student added successfully!');
        }
    } catch (error) {
        console.error('Error saving student:', error);
        const errorMessage = isEditing ? 'Failed to update student.' : 'Failed to add new student.';
        res.redirect(`/students/form/${student_id || ''}?error=${errorMessage}`);
    }
});


// --- POST: Handle Delete Student ---
router.post('/delete/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        // NOTE: If this student has associated fees, you must decide the policy (cascade delete or prevent deletion).
        // For simplicity, we assume no existing fee records in the initial state or that cascade delete is managed.
        
        const { error } = await supabaseAdmin
            .from('students')
            .delete()
            .eq('student_id', studentId);

        if (error) {
             // Specific error for foreign key constraint (if fees exist)
             if (error.code === '23503') {
                throw new Error('Cannot delete student. They have associated fee records.');
             }
             throw error;
        }

        res.redirect('/students?message=Student deleted successfully!');

    } catch (error) {
        console.error('Error deleting student:', error);
        res.redirect(`/students?error=${error.message}`);
    }
});

export default router;
