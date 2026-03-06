/* ============================================================
   REPORTS.JS
   ============================================================ */

let reportChart = null;

function renderReports(user) {
    const page = document.getElementById('page-reports');
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    const monthStr = `${thisYear}-${String(thisMonth).padStart(2, '0')}`;

    page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>📊 Reports / <span class="hindi">रिपोर्ट</span></h1>
        <div class="subtitle">Analyze your business performance</div>
      </div>
    </div>

    <!-- Profit Period Selector -->
    <div class="card" style="margin-bottom:1.5rem">
      <div class="card-title">💹 Profit Analysis / लाभ विश्लेषण</div>
      <div class="profit-period-btns" style="margin-bottom:1.25rem">
        <button class="profit-period-btn active" id="pbtn-today" onclick="showPeriodProfit('today',this)">Today / आज</button>
        <button class="profit-period-btn" id="pbtn-week" onclick="showPeriodProfit('week',this)">This Week / इस सप्ताह</button>
        <button class="profit-period-btn" id="pbtn-month" onclick="showPeriodProfit('month',this)">This Month / इस महीने</button>
        <button class="profit-period-btn" id="pbtn-year" onclick="showPeriodProfit('year',this)">This Year / इस साल</button>
      </div>
      <div id="profit-summary">
        ${buildProfitSummary(user, 'today')}
      </div>
    </div>

    <!-- Monthly Chart -->
    <div class="card" style="margin-bottom:1.5rem">
      <div class="card-title" style="justify-content:space-between">
        <span>📈 Monthly Trend / मासिक ट्रेंड</span>
        <select id="trend-year" onchange="renderTrendChart()" style="padding:.4rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.85rem;background:var(--bg-card);color:var(--text)">
          <option value="${thisYear}">${thisYear}</option>
          <option value="${thisYear - 1}">${thisYear - 1}</option>
        </select>
      </div>
      <canvas id="trend-chart" height="180"></canvas>
    </div>

    <!-- Report Tabs -->
    <div class="report-tabs">
      <button class="report-tab active" id="rtab-sales" onclick="switchReportTab('sales',this)">💰 Sales Report</button>
      <button class="report-tab" id="rtab-purchases" onclick="switchReportTab('purchases',this)">🛒 Purchase Report</button>
      <button class="report-tab" id="rtab-expenses" onclick="switchReportTab('expenses',this)">💸 Expense Report</button>
      <button class="report-tab" id="rtab-profit" onclick="switchReportTab('profit',this)">📊 Profit Report</button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <input type="month" id="report-month" value="${monthStr}" onchange="renderReportTab()" />
      <button class="btn-success" onclick="exportCurrentReport()">⬇ Export Excel</button>
    </div>

    <!-- Report Content -->
    <div id="report-content"></div>
  `;

    window._currentReportTab = 'sales';
    renderTrendChart();
    renderReportTab();
}

function showPeriodProfit(period, btn) {
    document.querySelectorAll('.profit-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('profit-summary').innerHTML = buildProfitSummary(window._currentUser, period);
}

function buildProfitSummary(user, period) {
    const now = new Date();
    let start, end;
    const fmt2 = d => d.toISOString().slice(0, 10);

    if (period === 'today') {
        start = end = fmt2(now);
    } else if (period === 'week') {
        const day = now.getDay();
        const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        start = fmt2(mon); end = fmt2(now);
    } else if (period === 'month') {
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        end = fmt2(now);
    } else {
        start = `${now.getFullYear()}-01-01`;
        end = fmt2(now);
    }

    const { totalSales, totalPurchases, totalExpenses, profit } = DB.calcProfit(user.id, start, end);
    const isPos = profit >= 0;

    return `
    <div class="stats-grid">
      <div class="stat-card green"><div class="stat-label">Total Sales</div><div class="stat-value">${fmt(totalSales)}</div><div class="stat-icon">💰</div></div>
      <div class="stat-card red"><div class="stat-label">Total Purchases</div><div class="stat-value">${fmt(totalPurchases)}</div><div class="stat-icon">🛒</div></div>
      <div class="stat-card orange"><div class="stat-label">Total Expenses</div><div class="stat-value">${fmt(totalExpenses)}</div><div class="stat-icon">💸</div></div>
      <div class="stat-card ${isPos ? 'purple' : 'red'}">
        <div class="stat-label">Net Profit / लाभ</div>
        <div class="stat-value">${fmt(profit)}</div>
        <div class="stat-sub">${isPos ? '📈 Profit' : '📉 Loss'}</div>
        <div class="stat-icon">${isPos ? '🏆' : '⚠️'}</div>
      </div>
    </div>
  `;
}

function renderTrendChart() {
    if (reportChart) { reportChart.destroy(); reportChart = null; }
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    const user = window._currentUser;
    const year = parseInt(document.getElementById('trend-year')?.value || new Date().getFullYear());
    const labels = [], salesData = [], purchData = [], profitData = [];

    for (let m = 1; m <= 12; m++) {
        const s = DB.getSalesByMonth(user.id, year, m);
        const p = DB.getPurchasesByMonth(user.id, year, m);
        const e = DB.getExpensesByMonth(user.id, year, m);
        const ms = DB.sumField(s, 'total');
        const mp = DB.sumField(p, 'total');
        const me = DB.sumField(e, 'amount');
        labels.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]);
        salesData.push(ms);
        purchData.push(mp + me);
        profitData.push(ms - mp - me);
    }

    reportChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Sales', data: salesData, backgroundColor: 'rgba(16,185,129,.75)', borderRadius: 6 },
                { label: 'Costs', data: purchData, backgroundColor: 'rgba(239,68,68,.65)', borderRadius: 6 },
                { label: 'Profit', data: profitData, type: 'line', borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,.1)', tension: .4, fill: true, pointRadius: 4, borderWidth: 2 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 12 } } } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) } }
            }
        }
    });
}

function switchReportTab(tab, btn) {
    document.querySelectorAll('.report-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window._currentReportTab = tab;
    renderReportTab();
}

function renderReportTab() {
    const tab = window._currentReportTab || 'sales';
    const month = document.getElementById('report-month')?.value;
    const user = window._currentUser;
    const [year, mon] = month ? month.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
    const container = document.getElementById('report-content');
    if (!container) return;

    if (tab === 'sales') {
        const data = DB.getSalesByMonth(user.id, year, mon);
        const total = DB.sumField(data, 'total');
        container.innerHTML = `
      <div class="card">
        <div class="card-title" style="justify-content:space-between">
          <span>💰 Sales Report – ${month}</span>
          <span style="font-size:1.1rem;font-weight:800;color:var(--success)">${fmt(total)}</span>
        </div>
        ${buildSalesTable(data.reverse())}
      </div>`;
    } else if (tab === 'purchases') {
        const data = DB.getPurchasesByMonth(user.id, year, mon);
        const total = DB.sumField(data, 'total');
        container.innerHTML = `
      <div class="card">
        <div class="card-title" style="justify-content:space-between">
          <span>🛒 Purchase Report – ${month}</span>
          <span style="font-size:1.1rem;font-weight:800;color:var(--danger)">${fmt(total)}</span>
        </div>
        ${buildPurTable(data.reverse())}
      </div>`;
    } else if (tab === 'expenses') {
        const data = DB.getExpensesByMonth(user.id, year, mon);
        const total = DB.sumField(data, 'amount');
        container.innerHTML = `
      <div class="card">
        <div class="card-title" style="justify-content:space-between">
          <span>💸 Expense Report – ${month}</span>
          <span style="font-size:1.1rem;font-weight:800;color:var(--warning)">${fmt(total)}</span>
        </div>
        ${buildExpTable(data.reverse())}
      </div>`;
    } else if (tab === 'profit') {
        const prefix = `${year}-${String(mon).padStart(2, '0')}`;
        const { totalSales, totalPurchases, totalExpenses, profit } = DB.calcProfit(user.id, prefix + '-01', prefix + '-31');
        const isPos = profit >= 0;
        container.innerHTML = `
      <div class="card">
        <div class="card-title">📊 Profit Report – ${month}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem">
          <div style="padding:1.25rem;background:var(--success-light);border-radius:12px;border:2px solid var(--success)">
            <div style="font-size:.8rem;font-weight:700;color:#065f46;text-transform:uppercase">Total Sales</div>
            <div style="font-size:1.75rem;font-weight:800;color:#065f46">${fmt(totalSales)}</div>
          </div>
          <div style="padding:1.25rem;background:var(--danger-light);border-radius:12px;border:2px solid var(--danger)">
            <div style="font-size:.8rem;font-weight:700;color:#991b1b;text-transform:uppercase">Total Purchases</div>
            <div style="font-size:1.75rem;font-weight:800;color:#991b1b">${fmt(totalPurchases)}</div>
          </div>
          <div style="padding:1.25rem;background:var(--warning-light);border-radius:12px;border:2px solid var(--warning)">
            <div style="font-size:.8rem;font-weight:700;color:#92400e;text-transform:uppercase">Total Expenses</div>
            <div style="font-size:1.75rem;font-weight:800;color:#92400e">${fmt(totalExpenses)}</div>
          </div>
          <div style="padding:1.25rem;background:${isPos ? '#e0e7ff' : '#fee2e2'};border-radius:12px;border:2px solid ${isPos ? 'var(--primary)' : 'var(--danger)'}">
            <div style="font-size:.8rem;font-weight:700;color:${isPos ? '#312e81' : '#991b1b'};text-transform:uppercase">Net Profit / लाभ</div>
            <div style="font-size:1.75rem;font-weight:800;color:${isPos ? '#312e81' : '#991b1b'}">${fmt(profit)}</div>
          </div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:1.25rem;font-size:.9rem">
          <div style="font-weight:700;margin-bottom:.75rem">📐 Formula / गणना:</div>
          <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;font-size:1rem">
            <span style="background:var(--success-light);color:#065f46;padding:.3rem .8rem;border-radius:8px;font-weight:700">${fmt(totalSales)}</span>
            <span style="font-size:1.3rem">−</span>
            <span style="background:var(--danger-light);color:#991b1b;padding:.3rem .8rem;border-radius:8px;font-weight:700">${fmt(totalPurchases)}</span>
            <span style="font-size:1.3rem">−</span>
            <span style="background:var(--warning-light);color:#92400e;padding:.3rem .8rem;border-radius:8px;font-weight:700">${fmt(totalExpenses)}</span>
            <span style="font-size:1.3rem">=</span>
            <span style="background:${isPos ? 'var(--primary-light)' : 'var(--danger-light)'};color:${isPos ? 'var(--primary-dark)' : '#991b1b'};padding:.3rem .8rem;border-radius:8px;font-weight:700;font-size:1.1rem">${fmt(profit)}</span>
          </div>
        </div>
      </div>`;
    }
}

function exportCurrentReport() {
    const user = window._currentUser;
    const tab = window._currentReportTab || 'sales';
    const month = document.getElementById('report-month')?.value || '';
    const [year, mon] = month ? month.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
    const wb = XLSX.utils.book_new();

    if (tab === 'sales') {
        const data = DB.getSalesByMonth(user.id, year, mon);
        const rows = [['Date', 'Product', 'Qty', 'Price', 'Total', 'Payment', 'Note'], ...data.map(s => [s.date, s.product, s.quantity, s.price, s.total, s.payment || '', s.note || ''])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sales');
    } else if (tab === 'purchases') {
        const data = DB.getPurchasesByMonth(user.id, year, mon);
        const rows = [['Date', 'Product', 'Supplier', 'Qty', 'Cost', 'Total', 'Payment'], ...data.map(p => [p.date, p.product, p.supplier || '', p.quantity, p.cost, p.total, p.payment || ''])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Purchases');
    } else if (tab === 'expenses') {
        const data = DB.getExpensesByMonth(user.id, year, mon);
        const rows = [['Date', 'Category', 'Description', 'Amount'], ...data.map(e => [e.date, e.category || '', e.description || '', e.amount])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Expenses');
    } else {
        const prefix = `${year}-${String(mon).padStart(2, '0')}`;
        const { totalSales, totalPurchases, totalExpenses, profit } = DB.calcProfit(user.id, prefix + '-01', prefix + '-31');
        const rows = [['Metric', 'Amount'], ['Total Sales', totalSales], ['Total Purchases', totalPurchases], ['Total Expenses', totalExpenses], ['Net Profit', profit]];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Profit');
    }

    XLSX.writeFile(wb, `DukanBook_${tab}_${month}.xlsx`);
    showToast('📥 Report exported!', 'success');
}
