/* ============================================================
   EXPENSES.JS
   ============================================================ */

const EXPENSE_CATEGORIES = [
    'Rent / किराया', 'Electricity / बिजली', 'Labour / मजदूरी',
    'Transport / ट्रांसपोर्ट', 'Telephone / फोन', 'Packaging / पैकेजिंग',
    'Advertising / विज्ञापन', 'Maintenance / रखरखाव', 'Food / खाना',
    'Taxes / टैक्स', 'Other / अन्य'
];

function renderExpenses(user) {
    const today = new Date().toISOString().slice(0, 10);
    const allExp = DB.getAll(user.id, 'expenses').reverse();

    const page = document.getElementById('page-expenses');
    page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>💸 Expenses / <span class="hindi">खर्च</span></h1>
        <div class="subtitle">Track your business expenses</div>
      </div>
    </div>

    <!-- Add Expense Form -->
    <div class="form-card">
      <h2>➕ Add Expense / <span class="hindi">खर्च दर्ज करें</span></h2>
      <div class="form-row">
        <div class="form-group">
          <label>Date / तारीख</label>
          <input type="date" id="exp-date" value="${today}" />
        </div>
        <div class="form-group">
          <label>Category / श्रेणी</label>
          <select id="exp-category">
            ${EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Amount / राशि (₹)</label>
          <input type="number" id="exp-amount" placeholder="0.00" min="0" step="0.01" />
        </div>
        <div class="form-group">
          <label>Description / विवरण</label>
          <input type="text" id="exp-desc" placeholder="Details about this expense..." />
        </div>
      </div>
      <button class="btn-primary" onclick="addExpense()" style="width:100%;padding:1rem;font-size:1rem;">
        💾 Save Expense / खर्च सेव करें
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="stats-grid" style="margin-bottom:1.5rem">
      ${buildExpenseSummary(user)}
    </div>

    <!-- Expenses Table -->
    <div class="card">
      <div class="card-title" style="justify-content:space-between">
        <span>📋 Expense History / खर्च इतिहास</span>
        <div style="display:flex;gap:.5rem;align-items:center">
          <input type="month" id="exp-filter-month" style="padding:.4rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.8rem;background:var(--bg-card);color:var(--text)" oninput="filterExpTable()" />
          <button class="btn-secondary" onclick="exportExpensesCSV()">⬇ Export CSV</button>
        </div>
      </div>
      <div id="exp-table-container">
        ${buildExpTable(allExp)}
      </div>
    </div>
  `;
}

function buildExpenseSummary(user) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const allExp = DB.getAll(user.id, 'expenses');
    const todayExp = allExp.filter(e => e.date === today);
    const monthExp = DB.getExpensesByMonth(user.id, now.getFullYear(), now.getMonth() + 1);

    const catTotals = {};
    allExp.forEach(e => {
        const cat = e.category || 'Other';
        catTotals[cat] = (catTotals[cat] || 0) + (parseFloat(e.amount) || 0);
    });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    return `
    <div class="stat-card red">
      <div class="stat-label">Today / आज</div>
      <div class="stat-value">${fmt(DB.sumField(todayExp, 'amount'))}</div>
      <div class="stat-sub">${todayExp.length} entries</div>
      <div class="stat-icon">📅</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-label">This Month / इस महीने</div>
      <div class="stat-value">${fmt(DB.sumField(monthExp, 'amount'))}</div>
      <div class="stat-sub">${monthExp.length} entries</div>
      <div class="stat-icon">🗓</div>
    </div>
    <div class="stat-card purple">
      <div class="stat-label">All Time / सभी समय</div>
      <div class="stat-value">${fmt(DB.sumField(allExp, 'amount'))}</div>
      <div class="stat-sub">${allExp.length} entries</div>
      <div class="stat-icon">💸</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-label">Top Category</div>
      <div class="stat-value" style="font-size:1rem">${topCat ? esc(topCat[0].split('/')[0].trim()) : '—'}</div>
      <div class="stat-sub">${topCat ? fmt(topCat[1]) : ''}</div>
      <div class="stat-icon">🏷</div>
    </div>
  `;
}

function addExpense() {
    const user = window._currentUser;
    const date = document.getElementById('exp-date').value;
    const category = document.getElementById('exp-category').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const desc = document.getElementById('exp-desc').value.trim();

    if (!date) return showToast('Please enter date', 'error');
    if (!amount || amount <= 0) return showToast('Enter valid amount / राशि डालें', 'error');

    DB.insert(user.id, 'expenses', { date, category, amount, description: desc });
    showToast('✅ Expense recorded! / खर्च दर्ज हो गया!', 'success');
    renderExpenses(user);
}

function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    DB.delete(window._currentUser.id, 'expenses', id);
    showToast('Expense deleted', 'info');
    renderExpenses(window._currentUser);
}

function filterExpTable() {
    const month = document.getElementById('exp-filter-month')?.value;
    const user = window._currentUser;
    let exp = DB.getAll(user.id, 'expenses').reverse();
    if (month) exp = exp.filter(e => e.date.startsWith(month));
    const container = document.getElementById('exp-table-container');
    if (container) container.innerHTML = buildExpTable(exp);
}

function buildExpTable(expenses) {
    if (!expenses.length) return `<div class="empty-state"><div class="empty-icon">💸</div><h3>No Expenses Found</h3><p>Add your first expense above.</p></div>`;
    const total = DB.sumField(expenses, 'amount');
    return `
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Action</th></tr></thead>
        <tbody>
          ${expenses.map(e => `<tr>
            <td>${formatDate(e.date)}</td>
            <td><span class="badge badge-yellow">${esc(e.category || 'Other')}</span></td>
            <td style="color:var(--text-muted)">${esc(e.description || '—')}</td>
            <td><strong style="color:var(--danger)">${fmt(e.amount)}</strong></td>
            <td><button class="btn-danger" onclick="deleteExpense('${e.id}')">🗑</button></td>
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;background:var(--bg)">
            <td colspan="3">Total / कुल</td>
            <td colspan="2" style="color:var(--danger);font-size:1.05rem">${fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function exportExpensesCSV() {
    const user = window._currentUser;
    const expenses = DB.getAll(user.id, 'expenses');
    if (!expenses.length) return showToast('No expenses to export', 'warning');
    const wb = XLSX.utils.book_new();
    const data = [['Date', 'Category', 'Description', 'Amount'],
    ...expenses.map(e => [e.date, e.category || '', e.description || '', e.amount])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Expenses');
    XLSX.writeFile(wb, `DukanBook_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📥 Expenses exported!', 'success');
}
