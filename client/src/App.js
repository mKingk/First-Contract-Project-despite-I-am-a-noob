import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AppBar, Toolbar, Typography, Container, Box, 
  Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// API base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

// Dashboard Component (Fixed Version)
const Dashboard = () => {
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [incomeRes, balanceRes] = await Promise.all([
          axios.get('/reports/income-statement'),
          axios.get('/reports/balance-sheet')
        ]);
        setIncomeStatement(incomeRes.data);
        setBalanceSheet(balanceRes.data);
      } catch (err) {
        setError('Failed to load data');
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0.00';
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (loading) return <Typography>Loading dashboard data...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      
      {incomeStatement && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Income Statement</Typography>
          <Typography>Total Income: GH₵{formatCurrency(incomeStatement.total_income)}</Typography>
          <Typography>Total Expenses: GH₵{formatCurrency(incomeStatement.total_expense)}</Typography>
          <Typography color={incomeStatement.profit_loss >= 0 ? 'green' : 'red'}>
            Profit/Loss: GH₵{formatCurrency(incomeStatement.profit_loss)}
          </Typography>
        </Paper>
      )}

      {balanceSheet && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Balance Sheet</Typography>
          <Typography>Accounts Payable: GH₵{formatCurrency(balanceSheet.payable_balance)}</Typography>
          <Typography>Accounts Receivable: GH₵{formatCurrency(balanceSheet.receivable_balance)}</Typography>
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="contained" component={Link} to="/income">Manage Income</Button>
        <Button variant="contained" component={Link} to="/expense">Manage Expenses</Button>
        <Button variant="contained" component={Link} to="/payable">Accounts Payable</Button>
        <Button variant="contained" component={Link} to="/receivable">Accounts Receivable</Button>
        <Button variant="contained" component={Link} to="/cash-flow">Cash Flow</Button>
      </Box>
    </Box>
  );
};

// Income Component with Delete
const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [newIncome, setNewIncome] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = () => {
    axios.get('/income').then(res => setIncomes(res.data));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIncome({ ...newIncome, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/income', newIncome).then(res => {
      fetchIncomes();
      setNewIncome({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: ''
      });
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this income record?')){
      axios.delete(`/income/${id}`)
        .then(() => fetchIncomes())
        .catch(err => console.error('Delete failed: ',err));
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Income Records</Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Add New Income</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              type="date"
              name="date"
              value={newIncome.date}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Description"
              name="description"
              value={newIncome.description}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Amount"
              type="number"
              name="amount"
              value={newIncome.amount}
              onChange={handleInputChange}
              required
            />
            <Button type="submit" variant="contained">Add</Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incomes.map(income => (
              <TableRow key={income.income_id}>
                <TableCell>{income.date}</TableCell>
                <TableCell>{income.description}</TableCell>
                <TableCell>GH₵{income.amount}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDelete(income.income_id)}
                    color="error"
                    aria-label="delete"
                  >
                    <DeleteIcon/>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Expense Component
const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = () => {
    axios.get('/expense').then(res => setExpenses(res.data));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/expense', newExpense).then(res => {
      fetchExpenses();
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: ''
      });
    });
  }; 

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this expense Record?')) {
      axios.delete(`/expense/${id}`)
        .then(() => fetchExpenses())
        .catch(err => console.error('Delete failed:',err));
    }
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Expense Records</Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Add New Expense</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              type="date"
              name="date"
              value={newExpense.date}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Description"
              name="description"
              value={newExpense.description}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Amount"
              type="number"
              name="amount"
              value={newExpense.amount}
              onChange={handleInputChange}
              required
            />
            <Button type="submit" variant="contained">Add</Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map(expense => (
              <TableRow key={expense.expense_id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>GH₵{expense.amount}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDelete(expense.expense_id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Accounts Payable Component with Delete
const AccountsPayable = () => {
  const [payables, setPayables] = useState([]);
  const [newPayable, setNewPayable] = useState({
    vendor_name: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    status: 'Unpaid'
  });

  useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = () => {
    axios.get('/payable').then(res => setPayables(res.data));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPayable({ ...newPayable, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/payable', newPayable).then(res => {
      fetchPayables();
      setNewPayable({
        vendor_name: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'Unpaid'
      });
    });
  };

  const updateStatus = (id, status) => {
    axios.put(`/payable/${id}`, { status }).then(() => {
      fetchPayables();
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this Payables?')) {
      axios.delete(`/payable/${id}`)
        .then(() => fetchPayables())
        .catch(err => console.error('Delete failed:', err))
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Accounts Payable</Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Add New Payable</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Vendor Name"
              name="vendor_name"
              value={newPayable.vendor_name}
              onChange={handleInputChange}
              required
            />
            <TextField
              type="date"
              name="date"
              value={newPayable.date}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Amount"
              type="number"
              name="amount"
              value={newPayable.amount}
              onChange={handleInputChange}
              required
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={newPayable.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Unpaid">Unpaid</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained">Add</Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payables.map(payable => (
              <TableRow key={payable.payable_id}>
                <TableCell>{payable.vendor_name}</TableCell>
                <TableCell>{payable.date}</TableCell>
                <TableCell>GH₵{payable.amount}</TableCell>
                <TableCell>{payable.status}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap:1}}>
                  {payable.status === 'Unpaid' && (
                    <Button 
                      variant="outlined" 
                      color="success"
                      onClick={() => updateStatus(payable.payable_id, 'Paid')}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  <IconButton
                    onClick={() => handleDelete(payable.payable_id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Accounts Receivable Component
const AccountsReceivable = () => {
  const [receivables, setReceivables] = useState([]);
  const [newReceivable, setNewReceivable] = useState({
    customer_name: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    status: 'Unpaid'
  });

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = () => {
    axios.get('/receivable').then(res => setReceivables(res.data));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReceivable({ ...newReceivable, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/receivable', newReceivable).then(res => {
      fetchReceivables();
      setNewReceivable({
        customer_name: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'Unpaid'
      });
    });
  };

  const updateStatus = (id, status) => {
    axios.put(`/receivable/${id}`, { status }).then(() => {
      fetchReceivables();
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this receivable?')) {
      axios.delete(`/receivable/${id}`)
        .then(() => fetchReceivables())
        .catch(err => console.error('Delete failed:', err));
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Accounts Receivable</Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Add New Receivable</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Customer Name"
              name="customer_name"
              value={newReceivable.customer_name}
              onChange={handleInputChange}
              required
            />
            <TextField
              type="date"
              name="date"
              value={newReceivable.date}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Amount"
              type="number"
              name="amount"
              value={newReceivable.amount}
              onChange={handleInputChange}
              required
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={newReceivable.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Unpaid">Unpaid</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained">Add</Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receivables.map(receivable => (
              <TableRow key={receivable.receivable_id}>
                <TableCell>{receivable.customer_name}</TableCell>
                <TableCell>{receivable.date}</TableCell>
                <TableCell>GH₵{receivable.amount}</TableCell>
                <TableCell>{receivable.status}</TableCell>
                <TableCell>
                  <Box sx= {{ display: 'flex', gap:1}}>
                    {receivable.status === 'Unpaid' && (
                      <Button 
                        variant="outlined" 
                        color="success"
                        onClick={() => updateStatus(receivable.receivable_id, 'Paid')}
                      >
                        Mark as Paid
                      </Button>
                    )}
                    <IconButton
                      onClick={() => handleDelete(receivable.receivable_id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

  

// Cash Flow Component
const CashFlow = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashFlowData, setCashFlowData] = useState(null);

  useEffect(() => {
    // fetchCashFlow();
  }, [startDate, endDate]);

  const fetchCashFlow = () => {
    axios.get('/reports/cash-flow', {
      params: { startDate, endDate }
    }).then(res => setCashFlowData(res.data))
    .catch(err => console.error('Error fetching cash flow:', err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCashFlow();
  };

  const chartData = {
    labels: cashFlowData?.income.map(item => item.date) || [],
    datasets: [
      {
        label: 'Income',
        data: cashFlowData?.income.map(item => item.amount) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Expenses',
        data: cashFlowData?.expenses.map(item => item.amount) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Cash Flow Statement</Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Select Date Range</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <Button type="submit" variant="contained">Generate</Button>
          </Box>
        </form>
      </Paper>

      {cashFlowData && (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Cash Flow Chart</Typography>
            <Line data={chartData} />
          </Box>

          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>Income</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cashFlowData.income.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>GH₵{item.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>Expenses</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cashFlowData.expenses.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>GH₵{item.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

// Main App Component
const App = () => {
  return (
    <BrowserRouter>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GULIBU FINANCIAL REPORTS
          </Typography>
          <Button color="inherit" component={Link} to="/">Dashboard</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/payable" element={<AccountsPayable />} />
          <Route path="/receivable" element={<AccountsReceivable />} />
          <Route path="/cash-flow" element={<CashFlow />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
};

export default App;