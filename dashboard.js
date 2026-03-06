/* ============================================================
   DASHBOARD.JS
   ============================================================ */

let dashChartMonthly = null;
let dashChartDonut = null;

function renderDashboard(user) {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Today's stats
    const todaySales = DB.getSalesByDate(user.id, today);
    const allSales = DB.getAll(user.id, 'sales');
    const allPurchases = DB.getAll(user.id, 'purchases');
    const allExpenses = DB.getAll(user.id, 'expenses');

    const todaySalesTotal = DB.sumField(todaySales, 'total');
    const todayPurchases = DB.getAll(user.id, 'purchases').filter(p => p.date === today);
    const todayPurchaseTotal = DB.sumField(todayPurchases, 'total');
    const todayExpenses = DB.getAll(user.id, 'expenses').filter(e => e.date === today);
    const todayExpenseTotal = DB.sumField(todayExpenses, 'amount');

    // Monthly stats
    const monthSales = DB.getSalesByMonth(user.id, year, month);
    const monthPurchases = DB.getPurchasesByMonth(user.id, year, month);
    const monthExpenses = DB.getExpensesByMonth(user.id, year, month);
    const mSales = DB.sumField(monthSales, 'total');
    const mPurch = DB.sumField(monthPurchases, 'total');
    const mExp = DB.sumField(monthExpenses, 'amount');
    const mProfit = mSales - mPurch - mExp;

    const totalRevenue = DB.sumField(allSales, 'total');
    const totalExpenses = DB.sumField(allExpenses, 'amount') + DB.sumField(allPurchases, 'total');

    const page = document.getElementById('page-dashboard');
    page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Dashboard / <span class="hindi">डैशबोर्ड</span></h1>
        <div class="subtitle">${user.businessName || user.name} · ${formatDate(today)}</div>
      </div>
      <button class="btn-secondary" onclick="renderDashboard(window._currentUser)">↻ Refresh</button>
    </div>

    <!-- Profit Banner -->
    <div class="profit-banner ${mProfit >= 0 ? 'positive' : 'negative'}">
      <div>
        <div class="profit-label">This Month's Net Profit / <span class="hindi">इस महीने का लाभ</span></div>
        <div class="profit-value">${fmt(mProfit)}</div>
        <div style="font-size:.85rem;margin-top:.5rem;opacity:.8">
          Sales ${fmt(mSales)} − Purchases ${fmt(mPurch)} − Expenses ${fmt(mExp)}
        </div>
      </div>
      <div style="font-size:4rem;opacity:.4">${mProfit >= 0 ? '📈' : '📉'}</div>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card green" onclick="navigate('sales')">
        <div class="stat-label">Today's Sales / आज बिक्री</div>
        <div class="stat-value">${fmt(todaySalesTotal)}</div>
        <div class="stat-sub">${todaySales.length} transaction(s)</div>
        <div class="stat-icon">💰</div>
      </div>
      <div class="stat-card blue" onclick="navigate('purchases')">
        <div class="stat-label">Today's Purchases / आज खरीद</div>
        <div class="stat-value">${fmt(todayPurchaseTotal)}</div>
        <div class="stat-sub">${todayPurchases.length} transaction(s)</div>
        <div class="stat-icon">🛒</div>
      </div>
      <div class="stat-card red" onclick="navigate('expenses')">
        <div class="stat-label">Today's Expenses / आज खर्च</div>
        <div class="stat-value">${fmt(todayExpenseTotal)}</div>
        <div class="stat-sub">${todayExpenses.length} item(s)</div>
        <div class="stat-icon">💸</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">Total Revenue / कुल कमाई</div>
        <div class="stat-value">${fmt(totalRevenue)}</div>
        <div class="stat-sub">All time</div>
        <div class="stat-icon">🏆</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Monthly Sales / मासिक बिक्री</div>
        <div class="stat-value">${fmt(mSales)}</div>
        <div class="stat-sub">${monthSales.length} transactions</div>
        <div class="stat-icon">📅</div>
      </div>
      <div class="stat-card cyan" onclick="navigate('inventory')">
        <div class="stat-label">Inventory Items / स्टॉक</div>
        <div class="stat-value">${DB.getAll(user.id, 'inventory').length}</div>
        <div class="stat-sub">${DB.getAll(user.id, 'inventory').filter(i => i.quantity <= i.minQty).length} low stock</div>
        <div class="stat-icon">📦</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button class="quick-btn" onclick="navigate('sales')">
        <div class="quick-btn-icon">💰</div>
        <div class="quick-btn-label">Add Sale</div>
        <div class="quick-btn-sub">बिक्री दर्ज करें</div>
      </button>
      <button class="quick-btn" onclick="navigate('purchases')">
        <div class="quick-btn-icon">🛒</div>
        <div class="quick-btn-label">Add Purchase</div>
        <div class="quick-btn-sub">खरीद दर्ज करें</div>
      </button>
      <button class="quick-btn" onclick="navigate('expenses')">
        <div class="quick-btn-icon">💸</div>
        <div class="quick-btn-label">Add Expense</div>
        <div class="quick-btn-sub">खर्च दर्ज करें</div>
      </button>
      <button class="quick-btn" onclick="navigate('reports')">
        <div class="quick-btn-icon">📊</div>
        <div class="quick-btn-label">View Reports</div>
        <div class="quick-btn-sub">रिपोर्ट देखें</div>
      </button>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-title">📊 Monthly Overview (Last 30 Days)</div>
        <canvas id="dash-chart-monthly" height="220"></canvas>
      </div>
      <div class="card">
        <div class="card-title">🥧 This Month Breakdown</div>
        <canvas id="dash-chart-donut" height="220"></canvas>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="recent-grid">
      <div class="card">
        <div class="card-title">💰 Recent Sales <a href="#" onclick="navigate('sales')" style="font-size:.8rem;color:var(--primary);margin-left:auto;font-weight:500">View All →</a></div>
        ${recentSalesHTML(user)}
      </div>
      <div class="card">
        <div class="card-title">🛒 Recent Purchases <a href="#" onclick="navigate('purchases')" style="font-size:.8rem;color:var(--primary);margin-left:auto;font-weight:500">View All →</a></div>
        ${recentPurchasesHTML(user)}
      </div>
    </div>
  `;

    renderMonthlyChart(user);
    renderDonutChart(mSales, mPurch, mExp);
}

function recentSalesHTML(user) {
    const sales = DB.getAll(user.id, 'sales').slice(-5).reverse();
    if (!sales.length) return `<div class="empty-state"><div class="empty-icon">💰</div><p>No sales yet</p></div>`;
    return `<div class="table-wrapper"><table>
    <thead><tr><th>Product</th><th>Date</th><th>Amount</th></tr></thead>
    <tbody>
      ${sales.map(s => `<tr>
        <td><strong>${esc(s.product)}</strong><br><small style="color:var(--text-muted)">Qty: ${s.quantity}</small></td>
        <td>${formatDate(s.date)}</td>
        <td><span class="badge badge-green">${fmt(s.total)}</span></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function recentPurchasesHTML(user) {
    const purchases = DB.getAll(user.id, 'purchases').slice(-5).reverse();
    if (!purchases.length) return `<div class="empty-state"><div class="empty-icon">🛒</div><p>No purchases yet</p></div>`;
    return `<div class="table-wrapper"><table>
    <thead><tr><th>Product</th><th>Date</th><th>Amount</th></tr></thead>
    <tbody>
      ${purchases.map(p => `<tr>
        <td><strong>${esc(p.product)}</strong><br><small style="color:var(--text-muted)">${esc(p.supplier || '')}</small></td>
        <td>${formatDate(p.date)}</td>
        <td><span class="badge badge-red">${fmt(p.total)}</span></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function renderMonthlyChart(user) {
    const ctx = document.getElementById('dash-chart-monthly');
    if (!ctx) return;
    if (dashChartMonthly) { dashChartMonthly.destroy(); dashChartMonthly = null; }

    const labels = [], salesData = [], purchData = [], expData = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const daySales = DB.getSalesByDate(user.id, dateStr);
        const dayPurch = DB.getAll(user.id, 'purchases').filter(p => p.date === dateStr);
        const dayExp = DB.getAll(user.id, 'expenses').filter(e => e.date === dateStr);

        labels.push(d.getDate() + '/' + (d.getMonth() + 1));
        salesData.push(DB.sumField(daySales, 'total'));
        purchData.push(DB.sumField(dayPurch, 'total'));
        expData.push(DB.sumField(dayExp, 'amount'));
    }

    dashChartMonthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Sales', data: salesData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)', tension: .4, fill: true, pointRadius: 2 },
                { label: 'Purchases', data: purchData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.08)', tension: .4, fill: true, pointRadius: 2 },
                { label: 'Expenses', data: expData, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.08)', tension: .4, fill: true, pointRadius: 2 },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v), font: { size: 10 } } }
            }
        }
    });
}

function renderDonutChart(sales, purch, exp) {
    const ctx = document.getElementById('dash-chart-donut');
    if (!ctx) return;
    if (dashChartDonut) { dashChartDonut.destroy(); dashChartDonut = null; }

    dashChartDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sales', 'Purchases', 'Expenses'],
            datasets: [{ data: [sales, purch, exp], backgroundColor: ['#10b981', '#ef4444', '#f59e0b'], borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: true, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
    });
}
