
import { useEffect, useState } from 'react';
import api from './api';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line
} from 'recharts';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import './App.css';

function ExpenseDashboard({ currentUser, onLogout }) {

    // ================= STATES =================

    const [expenses, setExpenses] = useState([]);
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState(null);

    const [budget, setBudget] = useState(null);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [savingBudget, setSavingBudget] = useState(false);

    // Category-wise budgets
    const [categoryBudgets, setCategoryBudgets] = useState([]);
    const [categoryBudgetCategory, setCategoryBudgetCategory] = useState('FOOD');
    const [categoryBudgetAmount, setCategoryBudgetAmount] = useState('');
    const [savingCategoryBudget, setSavingCategoryBudget] = useState(false);

    const expenseCategories = [
        'FOOD', 'TRAVEL', 'SHOPPING', 'RENT', 'BILLS',
        'EDUCATION', 'HEALTH', 'ENTERTAINMENT', 'OTHER'
    ];

    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');

    const [currentPage, setCurrentPage] = useState(1);

    const recordsPerPage = 5;

    const [formData, setFormData] = useState({
        amount: '',
        type: 'EXPENSE',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        userId: currentUser.id
    });

    // ================= FETCH EXPENSES =================

    const fetchExpenses = async () => {
        try {
            const response = await api.get('/api/expenses');

            setExpenses(
                Array.isArray(response.data) ? response.data : []
            );

        } catch (error) {
            console.error('Error fetching expenses:', error);
            setMessage('Unable to load expenses');
        }
    };

    // ================= FETCH BUDGET SUMMARY =================

    const fetchBudgetSummary = async () => {
        try {
            const [year, month] = selectedMonth.split('-');

            const response = await api.get(
                `/api/budgets/summary?month=${Number(month)}&year=${Number(year)}`
            );

            setBudget(response.data);

        } catch (error) {
            console.error('Error fetching budget:', error);
            setBudget(null);
        }
    };

    // ================= CATEGORY BUDGET APIs =================

    const fetchCategoryBudgets = async () => {
        try {
            const response = await api.get('/api/category-budgets');
            setCategoryBudgets(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (error) {
            console.error('Error fetching category budgets:', error);
            setCategoryBudgets([]);
        }
    };

    const handleCategoryBudgetSubmit = async (e) => {
        e.preventDefault();

        if (!categoryBudgetAmount || Number(categoryBudgetAmount) <= 0) {
            setMessage('Please enter a valid category budget amount');
            return;
        }

        try {
            setSavingCategoryBudget(true);
            setMessage('');

            const [year, month] = selectedMonth.split('-');

            const payload = {
                category: categoryBudgetCategory,
                monthlyLimit: Number(categoryBudgetAmount),
                month: Number(month),
                year: Number(year)
            };

            const existingBudget = categoryBudgets.find(
                (item) =>
                    item.category === categoryBudgetCategory &&
                    Number(item.month) === Number(month) &&
                    Number(item.year) === Number(year)
            );

            if (existingBudget) {
                await api.put('/api/category-budgets', payload);
                setMessage(`${categoryBudgetCategory} budget updated successfully!`);
            } else {
                await api.post('/api/category-budgets', payload);
                setMessage(`${categoryBudgetCategory} budget added successfully!`);
            }

            setCategoryBudgetAmount('');
            await fetchCategoryBudgets();

        } catch (error) {
            console.error('Error saving category budget:', error);

            setMessage(
                typeof error.response?.data === 'string'
                    ? error.response.data
                    : 'Unable to save category budget'
            );

        } finally {
            setSavingCategoryBudget(false);
        }
    };

    const handleDeleteCategoryBudget = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category budget?')) {
            return;
        }

        try {
            await api.delete(`/api/category-budgets/${id}`);
            setMessage('Category budget deleted successfully');
            await fetchCategoryBudgets();

        } catch (error) {
            console.error('Error deleting category budget:', error);
            setMessage('Unable to delete category budget');
        }
    };

    // ================= ADD OR UPDATE BUDGET =================

    const handleBudgetSubmit = async (e) => {
        e.preventDefault();

        if (!budgetAmount || Number(budgetAmount) <= 0) {
            setMessage('Please enter a valid budget amount');
            return;
        }

        try {
            setSavingBudget(true);
            setMessage('');

            const [year, month] = selectedMonth.split('-');

            const payload = {
                monthlyLimit: Number(budgetAmount),
                month: Number(month),
                year: Number(year)
            };

            const budgetResponse = await api.get('/api/budgets');

            const existingBudgets = Array.isArray(budgetResponse.data)
                ? budgetResponse.data
                : [];

            const existingBudget = existingBudgets.find(
                (item) =>
                    Number(item.month) === Number(month) &&
                    Number(item.year) === Number(year)
            );

            if (existingBudget) {
                await api.put(
                    `/api/budgets/${existingBudget.id}`,
                    payload
                );

                setMessage('Monthly budget updated successfully!');

            } else {
                await api.post('/api/budgets', payload);
                setMessage('Monthly budget added successfully!');
            }

            setBudgetAmount('');
            await fetchBudgetSummary();

        } catch (error) {
            console.error('Error saving budget:', error);

            setMessage(
                error.response?.data?.message ||
                'Unable to save monthly budget'
            );

        } finally {
            setSavingBudget(false);
        }
    };

    // ================= INITIAL DATA =================

    useEffect(() => {
        fetchExpenses();
        fetchCategoryBudgets();
    }, []);

    useEffect(() => {
        fetchBudgetSummary();
        fetchCategoryBudgets();
    }, [selectedMonth]);

    // ================= FORM INPUT =================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    // ================= ADD / UPDATE EXPENSE =================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
                userId: Number(currentUser.id),
                user: {
                    id: Number(currentUser.id)
                }
            };

            if (editingId) {
                await api.put(
                    `/api/expenses/${editingId}`,
                    payload
                );

                setMessage('Expense updated successfully');

            } else {
                await api.post('/api/expenses', payload);
                setMessage('Expense added successfully');
            }

            setFormData({
                amount: '',
                type: 'EXPENSE',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                userId: currentUser.id
            });

            setEditingId(null);

            await fetchExpenses();
            await fetchBudgetSummary();

        } catch (error) {
            console.error('Error saving expense:', error);
            setMessage('Unable to save expense');
        }
    };

    // ================= EDIT EXPENSE =================

    const handleEdit = (expense) => {
        setEditingId(expense.id);

        setFormData({
            amount: expense.amount,
            type: expense.type,
            category: expense.category,
            description: expense.description || '',
            date: expense.date,
            userId: currentUser.id
        });

        setMessage('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // ================= CANCEL EDIT =================

    const handleCancel = () => {
        setEditingId(null);

        setFormData({
            amount: '',
            type: 'EXPENSE',
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            userId: currentUser.id
        });

        setMessage('');
    };

    // ================= DELETE EXPENSE =================

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        try {
            await api.delete(`/api/expenses/${id}`);

            setMessage('Transaction deleted successfully');

            await fetchExpenses();
            await fetchBudgetSummary();

        } catch (error) {
            console.error('Error deleting expense:', error);
            setMessage('Unable to delete transaction');
        }
    };

    // ================= MONTHLY RECORDS =================

    const monthlyRecords = expenses.filter((expense) =>
        expense.date?.startsWith(selectedMonth)
    );

    // ================= DASHBOARD CALCULATIONS =================

    const monthlyIncome = monthlyRecords
        .filter((expense) => expense.type === 'INCOME')
        .reduce(
            (total, expense) => total + Number(expense.amount),
            0
        );

    const monthlyExpense = monthlyRecords
        .filter((expense) => expense.type === 'EXPENSE')
        .reduce(
            (total, expense) => total + Number(expense.amount),
            0
        );

    const monthlySavings = monthlyIncome - monthlyExpense;
    const monthlyTransactions = monthlyRecords.length;

    // ================= MONTHLY COMPARISON =================

    const [selectedYear, selectedMonthNumber] =
        selectedMonth.split('-').map(Number);

    const previousDate = new Date(
        selectedYear,
        selectedMonthNumber - 2,
        1
    );

    const previousMonth =
        `${previousDate.getFullYear()}-${String(
            previousDate.getMonth() + 1
        ).padStart(2, '0')}`;

    const previousMonthRecords = expenses.filter((expense) =>
        expense.date?.startsWith(previousMonth)
    );

    const previousMonthExpense = previousMonthRecords
        .filter((expense) => expense.type === 'EXPENSE')
        .reduce(
            (total, expense) => total + Number(expense.amount),
            0
        );

    const expenseDifference = monthlyExpense - previousMonthExpense;

    const expenseChangePercentage = previousMonthExpense > 0
        ? (expenseDifference / previousMonthExpense) * 100
        : null;

    // ================= BUDGET ALERT CALCULATIONS =================

    const budgetLimit = Number(budget?.monthlyLimit || 0);

    const budgetSpent = Number(
        budget?.totalExpenses ?? monthlyExpense
    );

    const budgetUsage = budgetLimit > 0
        ? (budgetSpent / budgetLimit) * 100
        : 0;

    const progressWidth = Math.min(budgetUsage, 100);

    const budgetAlert =
        budgetLimit <= 0
            ? ''
            : budgetUsage >= 100
                ? 'EXCEEDED'
                : budgetUsage >= 80
                    ? 'WARNING'
                    : 'NORMAL';

    // ================= CATEGORY ANALYSIS =================

    const categoryData = Object.values(
        monthlyRecords
            .filter((expense) => expense.type === 'EXPENSE')
            .reduce((result, expense) => {
                const category = expense.category || 'Other';

                if (!result[category]) {
                    result[category] = {
                        name: category,
                        value: 0
                    };
                }

                result[category].value += Number(expense.amount);

                return result;
            }, {})
    );

    const totalCategoryExpenses = categoryData.reduce(
        (total, item) => total + item.value,
        0
    );

    // ================= CATEGORY BUDGET CALCULATIONS =================

    const selectedCategoryBudgets = categoryBudgets.filter(
        (item) =>
            Number(item.month) === selectedMonthNumber &&
            Number(item.year) === selectedYear
    );

    const categoryBudgetRows = selectedCategoryBudgets.map((item) => {
        const spent = monthlyRecords
            .filter(
                (expense) =>
                    expense.type === 'EXPENSE' &&
                    expense.category === item.category
            )
            .reduce((total, expense) => total + Number(expense.amount), 0);

        const limit = Number(item.monthlyLimit || 0);
        const remaining = limit - spent;
        const usage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
            ...item,
            spent,
            remaining,
            usage,
            status: spent > limit
                ? 'EXCEEDED'
                : usage >= 80
                    ? 'WARNING'
                    : 'WITHIN LIMIT'
        };
    });

    // ================= HIGHEST SPENDING CATEGORY =================

    const highestCategory = categoryData.length > 0
        ? categoryData.reduce((highest, current) =>
            current.value > highest.value ? current : highest
        )
        : null;

    // ================= DAILY SPENDING TRENDS =================

    const daysInMonth = new Date(
        selectedYear,
        selectedMonthNumber,
        0
    ).getDate();

    const dailyExpenseData = Array.from(
        { length: daysInMonth },
        (_, index) => {
            const day = index + 1;

            const date =
                `${selectedMonth}-${String(day).padStart(2, '0')}`;

            const dailyTotal = monthlyRecords
                .filter(
                    (expense) =>
                        expense.type === 'EXPENSE' &&
                        expense.date?.slice(0, 10) === date
                )
                .reduce(
                    (total, expense) =>
                        total + Number(expense.amount),
                    0
                );

            return {
                day: String(day),
                date,
                amount: dailyTotal
            };
        }
    );

    const highestSpendingDay = dailyExpenseData.reduce(
        (highest, current) =>
            current.amount > highest.amount ? current : highest,
        { day: '-', date: '', amount: 0 }
    );

    // ================= CATEGORY CHART COLORS =================

    const COLORS = [
        '#0088FE',
        '#00C49F',
        '#FFBB28',
        '#FF8042',
        '#8884d8',
        '#82ca9d',
        '#ff6384'
    ];

    // ================= MONTHLY COMPARISON CHART DATA =================

    const comparisonChartData = [
        {
            month: previousMonth,
            expenses: previousMonthExpense
        },
        {
            month: selectedMonth,
            expenses: monthlyExpense
        }
    ];

    // ================= CATEGORY FILTER OPTIONS =================

    const categories = [
        ...new Set(
            expenses
                .map((expense) => expense.category)
                .filter(Boolean)
        )
    ];

    // ================= SEARCH AND FILTER =================

    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch =
            (expense.description || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesType =
            filterType === 'ALL' ||
            expense.type === filterType;

        const matchesCategory =
            filterCategory === 'ALL' ||
            expense.category === filterCategory;

        return matchesSearch && matchesType && matchesCategory;
    });

    // ================= PAGINATION =================

    const totalPages = Math.ceil(
        filteredExpenses.length / recordsPerPage
    );

    const startIndex = (currentPage - 1) * recordsPerPage;

    const currentRecords = filteredExpenses.slice(
        startIndex,
        startIndex + recordsPerPage
    );

    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1);
    };

    // ================= EXPORT CSV =================

    const handleExportCSV = () => {
        if (filteredExpenses.length === 0) {
            alert('No transactions available to export');
            return;
        }

        const headers = [
            'ID',
            'Amount',
            'Type',
            'Category',
            'Description',
            'Date'
        ];

        const rows = filteredExpenses.map((expense) => [
            expense.id,
            expense.amount,
            expense.type,
            expense.category,
            expense.description,
            expense.date
        ]);

        const escapeCSV = (value) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map((row) =>
                row.map(escapeCSV).join(',')
            )
        ].join('\n');

        const blob = new Blob(
            ['\uFEFF' + csvContent],
            {
                type: 'text/csv;charset=utf-8;'
            }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'Personal_Expense_Report.csv';
        link.click();

        URL.revokeObjectURL(url);
    };

    // ================= EXPORT PDF REPORT =================

    const handleExportPDF = () => {
        if (monthlyRecords.length === 0) {
            alert('No transactions available for this month');
            return;
        }

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Personal Expense Tracker Report', 14, 20);

        doc.setFontSize(12);
        doc.text(`User: ${currentUser.name}`, 14, 27);
        doc.text(`Month: ${selectedMonth}`, 14, 34);

        doc.setFontSize(14);
        doc.text('Monthly Summary', 14, 46);

        autoTable(doc, {
            startY: 52,
            head: [['Description', 'Amount']],
            body: [
                ['Total Income', `Rs. ${monthlyIncome.toFixed(2)}`],
                ['Total Expenses', `Rs. ${monthlyExpense.toFixed(2)}`],
                ['Savings', `Rs. ${monthlySavings.toFixed(2)}`],
                ['Total Transactions', String(monthlyTransactions)],
                ['Previous Month Expenses', `Rs. ${previousMonthExpense.toFixed(2)}`],
                ['Expense Difference', `Rs. ${expenseDifference.toFixed(2)}`],
                [
                    'Highest Spending Category',
                    highestCategory
                        ? `${highestCategory.name} - Rs. ${highestCategory.value.toFixed(2)}`
                        : 'No Data'
                ]
            ]
        });

        let nextY = doc.lastAutoTable.finalY + 12;

        doc.setFontSize(14);
        doc.text('Category-wise Expense Details', 14, nextY);

        autoTable(doc, {
            startY: nextY + 5,
            head: [['Category', 'Amount', 'Percentage']],
            body: categoryData.map((item) => [
                item.name,
                `Rs. ${item.value.toFixed(2)}`,
                totalCategoryExpenses > 0
                    ? `${((item.value / totalCategoryExpenses) * 100).toFixed(2)}%`
                    : '0%'
            ])
        });

        nextY = doc.lastAutoTable.finalY + 12;

        doc.setFontSize(14);
        doc.text('Transaction Details', 14, nextY);

        autoTable(doc, {
            startY: nextY + 5,
            head: [[
                'ID',
                'Amount',
                'Type',
                'Category',
                'Description',
                'Date'
            ]],
            body: monthlyRecords.map((expense) => [
                expense.id,
                `Rs. ${Number(expense.amount).toFixed(2)}`,
                expense.type,
                expense.category,
                expense.description,
                expense.date
            ]),
            styles: {
                fontSize: 8
            },
            columnStyles: {
                4: {
                    cellWidth: 45
                }
            },
            horizontalPageBreak: true
        });

        doc.save(`Expense_Report_${selectedMonth}.pdf`);
    };

    // ================= UI =================

    return (
        <div className="container">

            <h1>Personal Expense Tracker</h1>

            {/* DASHBOARD NAVIGATION */}

            <nav className="dashboard-nav" aria-label="Dashboard navigation">
                <a href="#dashboard">Dashboard</a>
                <a href="#reports">Reports</a>
                <a href="#budgets">Budgets</a>
                <a href="#add-expense">Add Expense</a>
                <a href="#history">History</a>
            </nav>

            {/* USER PROFILE */}

            <div className="user-section">
                <div>
                    <h3>Welcome, {currentUser.name}!</h3>
                    <p>Email: {currentUser.email}</p>
                    <p>User ID: {currentUser.id}</p>
                </div>

                <button type="button" onClick={onLogout}>
                    Logout
                </button>
            </div>

            {message && (
                <p className="message">{message}</p>
            )}

            {/* MONTH SELECTION */}

            <div className="month-section">
                <label>Select Month: </label>

                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* MONTHLY DASHBOARD */}

            <h2 id="dashboard">Monthly Dashboard</h2>

            <div className="summary-cards">
                <div className="card">
                    <h3>Total Income</h3>
                    <h2>₹{monthlyIncome.toFixed(2)}</h2>
                </div>

                <div className="card">
                    <h3>Total Expenses</h3>
                    <h2>₹{monthlyExpense.toFixed(2)}</h2>
                </div>

                <div className="card">
                    <h3>Savings</h3>
                    <h2>₹{monthlySavings.toFixed(2)}</h2>
                </div>

                <div className="card">
                    <h3>Transactions</h3>
                    <h2>{monthlyTransactions}</h2>
                </div>
            </div>

            {/* MONTHLY EXPENSE REPORT */}

            <h2 id="reports">Monthly Expense Report</h2>

            <div className="summary-cards">
                <div className="card">
                    <h3>Current Month Expenses</h3>
                    <h2>₹{monthlyExpense.toFixed(2)}</h2>
                </div>

                <div className="card">
                    <h3>Previous Month Expenses</h3>
                    <h2>₹{previousMonthExpense.toFixed(2)}</h2>
                    <p>{previousMonth}</p>
                </div>

                <div className="card">
                    <h3>Expense Difference</h3>

                    <h2>₹{Math.abs(expenseDifference).toFixed(2)}</h2>

                    <p>
                        {expenseDifference > 0
                            ? 'Expenses increased'
                            : expenseDifference < 0
                                ? 'Expenses decreased'
                                : 'No change'}
                    </p>

                    {expenseChangePercentage !== null && (
                        <p>
                            {Math.abs(expenseChangePercentage).toFixed(1)}%
                            {' '}
                            {expenseDifference > 0
                                ? 'increase'
                                : expenseDifference < 0
                                    ? 'decrease'
                                    : 'change'}
                        </p>
                    )}

                    {previousMonthExpense === 0 && (
                        <p>No previous month expenses to compare.</p>
                    )}
                </div>

                <div className="card">
                    <h3>Highest Spending Category</h3>

                    <h2>
                        {highestCategory
                            ? highestCategory.name
                            : 'No Data'}
                    </h2>

                    <p>
                        ₹{highestCategory
                            ? highestCategory.value.toFixed(2)
                            : '0.00'}
                    </p>
                </div>
            </div>

            {/* MONTHLY COMPARISON BAR CHART */}

            <h3>Monthly Expense Comparison</h3>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />

                        <Bar
                            dataKey="expenses"
                            name="Expenses"
                            fill="#0088FE"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* DAILY SPENDING TRENDS */}

            <h2>Daily Spending Trends</h2>

            <div className="summary-cards">
                <div className="card">
                    <h3>Monthly Spending</h3>
                    <h2>₹{monthlyExpense.toFixed(2)}</h2>
                </div>

                <div className="card">
                    <h3>Highest Spending Day</h3>

                    <h2>
                        {highestSpendingDay.amount > 0
                            ? highestSpendingDay.date
                            : 'No Data'}
                    </h2>

                    <p>₹{highestSpendingDay.amount.toFixed(2)}</p>
                </div>
            </div>

            {monthlyExpense > 0 ? (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={dailyExpenseData}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                dataKey="day"
                                label={{
                                    value: 'Day of Month',
                                    position: 'insideBottom',
                                    offset: -5
                                }}
                            />

                            <YAxis />

                            <Tooltip
                                labelFormatter={(label) => `Day ${label}`}
                                formatter={(value) => [
                                    `₹${Number(value).toFixed(2)}`,
                                    'Daily Expense'
                                ]}
                            />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="amount"
                                name="Daily Expenses"
                                stroke="#0088FE"
                                strokeWidth={3}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p>No daily expense data available for this month.</p>
            )}

            {/* MONTHLY BUDGET SUMMARY */}

            <h2 id="budgets">Monthly Budget Summary</h2>

            <div className="budget-section">
                <h3>Add / Update Monthly Budget</h3>

                <form
                    onSubmit={handleBudgetSubmit}
                    className="expense-form"
                >
                    <input
                        type="number"
                        placeholder="Enter Monthly Budget"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                    />

                    <button type="submit" disabled={savingBudget}>
                        {savingBudget ? 'Saving...' : 'Save Budget'}
                    </button>
                </form>

                <p>
                    Selected budget month: <strong>{selectedMonth}</strong>
                </p>
            </div>

            {/* DISPLAY BUDGET SUMMARY */}

            {budget ? (
                <div className="budget-section">
                    <p>
                        <strong>Monthly Budget:</strong>{' '}
                        ₹{budgetLimit.toFixed(2)}
                    </p>

                    <p>
                        <strong>Total Expenses:</strong>{' '}
                        ₹{budgetSpent.toFixed(2)}
                    </p>

                    <p>
                        <strong>Remaining Budget:</strong>{' '}
                        ₹{Number(budget.remainingBudget || 0).toFixed(2)}
                    </p>

                    <p>
                        <strong>Status:</strong>{' '}
                        {budget.status || 'Not available'}
                    </p>
                </div>
            ) : (
                <p>
                    Budget information is not available. Please add a budget.
                </p>
            )}

            {/* BUDGET PROGRESS AND ALERT */}

            {budget && budgetLimit > 0 && (
                <div className="budget-section">
                    <h3>Budget Usage</h3>

                    <h2>{budgetUsage.toFixed(1)}%</h2>

                    <div className="budget-progress-track">
                        <div
                            className={`budget-progress-fill ${budgetAlert.toLowerCase()}`}
                            style={{ width: `${progressWidth}%` }}
                        />
                    </div>

                    {budgetAlert === 'NORMAL' && (
                        <p className="budget-normal">
                            Your budget is under control. Keep saving!
                        </p>
                    )}

                    {budgetAlert === 'WARNING' && (
                        <p className="budget-warning">
                            Warning! You have used 80% or more of your monthly budget.
                        </p>
                    )}

                    {budgetAlert === 'EXCEEDED' && (
                        <p className="budget-exceeded">
                            Alert! You have reached or exceeded your monthly budget.
                        </p>
                    )}

                    <p>
                        Remaining: ₹
                        {Number(budget.remainingBudget || 0).toFixed(2)}
                    </p>
                </div>
            )}

            {/* CATEGORY-WISE BUDGET LIMITS */}

            <h2>Category-wise Budget Limits</h2>

            <div className="budget-section">
                <h3>Add / Update Category Budget</h3>

                <form
                    onSubmit={handleCategoryBudgetSubmit}
                    className="expense-form"
                >
                    <select
                        value={categoryBudgetCategory}
                        onChange={(e) => setCategoryBudgetCategory(e.target.value)}
                        required
                    >
                        {expenseCategories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        placeholder="Enter category monthly limit"
                        value={categoryBudgetAmount}
                        onChange={(e) => setCategoryBudgetAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                    />

                    <button
                        type="submit"
                        disabled={savingCategoryBudget}
                    >
                        {savingCategoryBudget
                            ? 'Saving...'
                            : 'Save Category Budget'}
                    </button>
                </form>

                <p>
                    Category budget month: <strong>{selectedMonth}</strong>
                </p>

                <p>
                    Saving an existing category for this month updates its current limit.
                </p>
            </div>

            <h3>Category Budget Status</h3>

            {categoryBudgetRows.length > 0 ? (
                <div className="table-section">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Monthly Limit</th>
                                <th>Spent</th>
                                <th>Remaining</th>
                                <th>Usage</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {categoryBudgetRows.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.category}</td>
                                    <td>₹{Number(item.monthlyLimit).toFixed(2)}</td>
                                    <td>₹{item.spent.toFixed(2)}</td>

                                    <td className={
                                        item.remaining < 0
                                            ? 'negative-amount'
                                            : 'positive-amount'
                                    }>
                                        ₹{item.remaining.toFixed(2)}
                                    </td>

                                    <td>
                                        <div className="category-progress-track">
                                            <div
                                                className={`category-progress-fill ${
                                                    item.status === 'EXCEEDED'
                                                        ? 'exceeded'
                                                        : item.status === 'WARNING'
                                                            ? 'warning'
                                                            : 'normal'
                                                }`}
                                                style={{
                                                    width: `${Math.min(item.usage, 100)}%`
                                                }}
                                            />
                                        </div>

                                        {item.usage.toFixed(1)}%
                                    </td>

                                    <td className={
                                        item.status === 'EXCEEDED'
                                            ? 'status-exceeded'
                                            : item.status === 'WARNING'
                                                ? 'status-warning'
                                                : 'status-normal'
                                    }>
                                        {item.status}
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCategoryBudgetCategory(item.category);
                                                setCategoryBudgetAmount(String(item.monthlyLimit));
                                            }}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCategoryBudget(item.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>
                    No category budgets found for {selectedMonth}. Add a limit above.
                </p>
            )}

            {/* CATEGORY ANALYSIS */}

            <h2>Category-wise Expense Analysis</h2>

            {categoryData.length > 0 ? (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p>No expense data available for this month.</p>
            )}

            {/* CATEGORY TABLE */}

            <h3>Category Spending Details</h3>

            <div className="table-section">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>

                    <tbody>
                        {categoryData.length > 0 ? (
                            categoryData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>₹{item.value.toFixed(2)}</td>
                                    <td>
                                        {totalCategoryExpenses > 0
                                            ? ((item.value / totalCategoryExpenses) * 100).toFixed(2)
                                            : 0}%
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">
                                    No category expenses available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ADD / EDIT FORM */}

            <h2 id="add-expense">
                {editingId ? 'Edit Transaction' : 'Add Transaction'}
            </h2>

            <form onSubmit={handleSubmit} className="expense-form">
                <input
                    type="number"
                    name="amount"
                    placeholder="Enter Amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                />

                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                </select>

                <input
                    type="text"
                    name="category"
                    placeholder="Enter Category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="description"
                    placeholder="Enter Description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                />

                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                />

                <button type="submit">
                    {editingId ? 'Update Transaction' : 'Add Transaction'}
                </button>

                {editingId && (
                    <button
                        type="button"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                )}
            </form>

            {/* TRANSACTION HISTORY */}

            <h2 id="history">Transaction History</h2>

            {/* SEARCH AND FILTER */}

            <div className="filter-section">
                <input
                    type="text"
                    placeholder="Search by description"
                    value={searchTerm}
                    onChange={(e) =>
                        handleFilterChange(setSearchTerm, e.target.value)
                    }
                />

                <select
                    value={filterType}
                    onChange={(e) =>
                        handleFilterChange(setFilterType, e.target.value)
                    }
                >
                    <option value="ALL">All Types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                </select>

                <select
                    value={filterCategory}
                    onChange={(e) =>
                        handleFilterChange(setFilterCategory, e.target.value)
                    }
                >
                    <option value="ALL">All Categories</option>

                    {categories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={() => {
                        setSearchTerm('');
                        setFilterType('ALL');
                        setFilterCategory('ALL');
                        setCurrentPage(1);
                    }}
                >
                    Clear Filters
                </button>
            </div>

            {/* EXPORT BUTTONS */}

            <div className="export-section">
                <button
                    type="button"
                    onClick={handleExportCSV}
                >
                    Export CSV
                </button>

                <button
                    type="button"
                    onClick={handleExportPDF}
                >
                    Export PDF Report
                </button>
            </div>

            {/* EXPENSE TABLE */}

            <div className="table-section">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentRecords.length > 0 ? (
                            currentRecords.map((expense) => (
                                <tr key={expense.id}>
                                    <td>{expense.id}</td>

                                    <td>
                                        ₹{Number(expense.amount).toFixed(2)}
                                    </td>

                                    <td>{expense.type}</td>
                                    <td>{expense.category}</td>
                                    <td>{expense.description}</td>
                                    <td>{expense.date}</td>

                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(expense)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(expense.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">
                                    No transactions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}

            <div className="pagination">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Previous
                </button>

                <span>
                    Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                </span>

                <button
                    type="button"
                    disabled={currentPage >= totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </button>
            </div>

        </div>
    );
}

export default ExpenseDashboard;
