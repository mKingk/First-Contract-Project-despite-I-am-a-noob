const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: 'admin100', // replace with your MySQL password
    database: 'financial_management'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

// Income Routes
app.get('/api/income', (req, res) => {
    db.query('SELECT * FROM income', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/income', (req, res) => {
    const { date, description, amount } = req.body;
    db.query(
        'INSERT INTO income (date, description, amount) VALUES (?, ?, ?)',
        [date, description, amount],
        (err, result) => {
            if (err) throw err;
            res.json({ id: result.insertId, date, description, amount });
        }
    );
});

// Expense Routes
app.get('/api/expense', (req, res) => {
    db.query('SELECT * FROM expense', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/expense', (req, res) => {
    const { date, description, amount } = req.body;
    db.query(
        'INSERT INTO expense (date, description, amount) VALUES (?, ?, ?)',
        [date, description, amount],
        (err, result) => {
            if (err) throw err;
            res.json({ id: result.insertId, date, description, amount });
        }
    );
});

// Accounts Payable Routes
app.get('/api/payable', (req, res) => {
    db.query('SELECT * FROM accounts_payable', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/payable', (req, res) => {
    const { vendor_name, date, amount, status } = req.body;
    db.query(
        'INSERT INTO accounts_payable (vendor_name, date, amount, status) VALUES (?, ?, ?, ?)',
        [vendor_name, date, amount, status],
        (err, result) => {
            if (err) throw err;
            res.json({ id: result.insertId, vendor_name, date, amount, status });
        }
    );
});

app.put('/api/payable/:id', (req, res) => {
    const { status } = req.body;
    db.query(
        'UPDATE accounts_payable SET status = ? WHERE payable_id = ?',
        [status, req.params.id],
        (err, result) => {
            if (err) throw err;
            res.json({ message: 'Updated successfully' });
        }
    );
});

// Accounts Receivable Routes
app.get('/api/receivable', (req, res) => {
    db.query('SELECT * FROM accounts_receivable', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/receivable', (req, res) => {
    const { customer_name, date, amount, status } = req.body;
    db.query(
        'INSERT INTO accounts_receivable (customer_name, date, amount, status) VALUES (?, ?, ?, ?)',
        [customer_name, date, amount, status],
        (err, result) => {
            if (err) throw err;
            res.json({ id: result.insertId, customer_name, date, amount, status });
        }
    );
});

app.put('/api/receivable/:id', (req, res) => {
    const { status } = req.body;
    db.query(
        'UPDATE accounts_receivable SET status = ? WHERE receivable_id = ?',
        [status, req.params.id],
        (err, result) => {
            if (err) throw err;
            res.json({ message: 'Updated successfully' });
        }
    );
});

// Reports
app.get('/api/reports/income-statement', (req, res) => {
    db.query('SELECT SUM(amount) as total_income FROM income', (err, incomeResult) => {
        if (err) throw err;
        db.query('SELECT SUM(amount) as total_expense FROM expense', (err, expenseResult) => {
            if (err) throw err;
            const profitLoss = incomeResult[0].total_income - expenseResult[0].total_expense;
            res.json({
                total_income: incomeResult[0].total_income || 0,
                total_expense: expenseResult[0].total_expense || 0,
                profit_loss: profitLoss || 0
            });
        });
    });
});

app.get('/api/reports/balance-sheet', (req, res) => {
    db.query('SELECT SUM(amount) as payable_balance FROM accounts_payable WHERE status = "Unpaid"', (err, payableResult) => {
        if (err) throw err;
        db.query('SELECT SUM(amount) as receivable_balance FROM accounts_receivable WHERE status = "Unpaid"', (err, receivableResult) => {
            if (err) throw err;
            res.json({
                payable_balance: payableResult[0].payable_balance || 0,
                receivable_balance: receivableResult[0].receivable_balance || 0
            });
        });
    });
});

app.get('/api/reports/cash-flow', (req, res) => {
    const { startDate, endDate } = req.query;
    db.query('SELECT date, amount FROM income WHERE date BETWEEN ? AND ? ORDER BY date', [startDate, endDate], (err, incomeResult) => {
        if (err) throw err;
        db.query('SELECT date, amount FROM expense WHERE date BETWEEN ? AND ? ORDER BY date', [startDate, endDate], (err, expenseResult) => {
            if (err) throw err;
            res.json({
                income: incomeResult,
                expenses: expenseResult
            });
        });
    });
});

// Add these DELETE routes right before app.listen()

// ===== DELETE ROUTES ===== //
// Delete income entry
app.delete('/api/income/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM income WHERE income_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting income:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to delete income record'
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No income record found with that ID'
            });
        }

        res.json({
            success: true,
            message: 'Income record deleted successfully'
        });
    });
});

// Delete expense entry
app.delete('/api/expense/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM expense WHERE expense_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting expense:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to delete expense record'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No expense record found with that ID'
            });
        }

        res.json({
            success: true,
            message: 'Expense record deleted successfully'
        });
    });
});

// Delete payable entry
app.delete('/api/payable/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM accounts_payable WHERE payable_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting payable:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to delete payable record'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No payable record found with that ID'
            });
        }

        res.json({
            success: true,
            message: 'Payable record deleted successfully'
        });
    });
});

// Delete receivable entry
app.delete('/api/receivable/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM accounts_receivable WHERE receivable_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting receivable:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to delete receivable record'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No receivable record found with that ID'
            });
        }

        res.json({
            success: true,
            message: 'Receivable record deleted successfully'
        });
    });
});

// ===== IMPROVED ERROR HANDLING ===== //
// Add this middleware to handle uncaught errors
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});