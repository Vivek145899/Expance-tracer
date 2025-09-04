document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const totalExpensesElem = document.getElementById('total-expenses');
    const categorySummaryElem = document.getElementById('category-summary');
    const filterMonth = document.getElementById('filter-month');
    const filterCategory = document.getElementById('filter-category');
    const summaryMonthElem = document.getElementById('summary-month');
    const themeToggle = document.getElementById('theme-toggle');
    const formCardTitle = document.querySelector('#form-card h2');

    // Form fields
    const expenseIdInput = document.getElementById('expense-id');
    const dateInput = document.getElementById('date');
    const categoryInput = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // **NEW**: Date placeholder elements
    const dateInputContainer = document.querySelector('.date-input-container');

    // Load expenses from localStorage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    // Event Listeners
    expenseForm.addEventListener('submit', handleFormSubmit);
    expenseList.addEventListener('click', handleTableClick);
    cancelEditBtn.addEventListener('click', cancelEdit);
    filterMonth.addEventListener('change', renderUI);
    filterCategory.addEventListener('change', renderUI);
    themeToggle.addEventListener('click', toggleTheme);
    dateInput.addEventListener('input', updateDatePlaceholder); // **NEW**: Listener for date input

    // Initial render
    checkTheme();
    renderUI();
    updateDatePlaceholder(); // **NEW**: Initial check for date placeholder
    
    // **NEW**: Function to manage date placeholder visibility
    function updateDatePlaceholder() {
        if (dateInput.value) {
            dateInputContainer.classList.add('has-value');
        } else {
            dateInputContainer.classList.remove('has-value');
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        const expenseData = {
            id: expenseIdInput.value ? parseInt(expenseIdInput.value) : Date.now(),
            date: dateInput.value,
            category: categoryInput.value,
            amount: parseFloat(amountInput.value),
            description: descriptionInput.value.trim()
        };

        if (expenseIdInput.value) {
            expenses = expenses.map(exp => exp.id === expenseData.id ? expenseData : exp);
        } else {
            expenses.push(expenseData);
        }

        saveAndRender();
        resetForm();
    }
    
    function handleTableClick(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const id = parseInt(target.dataset.id);
        if (target.classList.contains('delete-btn')) {
            deleteExpense(id);
        } else if (target.classList.contains('edit-btn')) {
            editExpense(id);
        }
    }

    function deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenses = expenses.filter(expense => expense.id !== id);
            saveAndRender();
        }
    }

    function editExpense(id) {
        const expense = expenses.find(expense => expense.id === id);
        expenseIdInput.value = expense.id;
        dateInput.value = expense.date;
        categoryInput.value = expense.category;
        amountInput.value = expense.amount;
        descriptionInput.value = expense.description;
        
        submitBtn.lastChild.textContent = ' Update Expense';
        formCardTitle.textContent = 'Edit Expense';
        cancelEditBtn.style.display = 'inline-flex';
        updateDatePlaceholder(); // Update placeholder state when editing
    }
    
    function cancelEdit() {
        resetForm();
    }

    function resetForm() {
        expenseForm.reset();
        expenseIdInput.value = '';
        submitBtn.lastChild.textContent = ' Add Expense';
        formCardTitle.textContent = 'Add New Expense';
        cancelEditBtn.style.display = 'none';
        updateDatePlaceholder(); // Update placeholder state on reset
    }

    function saveAndRender() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderUI();
    }

    function renderUI() {
        const filteredExpenses = getFilteredExpenses();
        renderExpenses(filteredExpenses);
        renderSummary(filteredExpenses);
        updateSummaryTitle();
    }

    function renderExpenses(expensesToRender) {
        expenseList.innerHTML = '';
        if (expensesToRender.length === 0) {
            expenseList.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No expenses found for this period.</td></tr>`;
            return;
        }

        expensesToRender.sort((a, b) => new Date(b.date) - new Date(a.date));

        expensesToRender.forEach(expense => {
            const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
            const formattedDate = new Date(expense.date).toLocaleDateString('en-GB', dateOptions);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${expense.category}</td>
                <td>${expense.description || '-'}</td>
                <td style="text-align: right;">₹${expense.amount.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn action-btn edit-btn" data-id="${expense.id}">Edit</button>
                    <button class="btn action-btn delete-btn" data-id="${expense.id}">Delete</button>
                </td>
            `;
            expenseList.appendChild(row);
        });
    }

    function renderSummary(expensesToRender) {
        const total = expensesToRender.reduce((sum, exp) => sum + exp.amount, 0);
        totalExpensesElem.textContent = `₹${total.toFixed(2)}`;

        const categorySummary = expensesToRender.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});

        categorySummaryElem.innerHTML = '';
        if (Object.keys(categorySummary).length > 0) {
            const summaryTitle = document.createElement('h3');
            summaryTitle.textContent = 'Category Breakdown';
            categorySummaryElem.appendChild(summaryTitle);
        }
        for (const category in categorySummary) {
            const p = document.createElement('p');
            p.innerHTML = `${category} <span>₹${categorySummary[category].toFixed(2)}</span>`;
            categorySummaryElem.appendChild(p);
        }
    }

    function getFilteredExpenses() {
        let filtered = [...expenses];
        const month = filterMonth.value; 
        const category = filterCategory.value;
        if (month) filtered = filtered.filter(exp => exp.date.startsWith(month));
        if (category) filtered = filtered.filter(exp => exp.category === category);
        return filtered;
    }

    function updateSummaryTitle() {
        const month = filterMonth.value;
        if (month) {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            summaryMonthElem.textContent = date.toLocaleString('default', { month: 'short' });
        } else {
            summaryMonthElem.textContent = 'All Time';
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    }

    function checkTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.textContent = '🌙';
        }
    }
});
