/* ============================================================
   SALES.JS
   ============================================================ */

function renderSales(user) {
    const today = new Date().toISOString().slice(0, 10);
    const page = document.getElementById('page-sales');
    const allSales = DB.getAll(user.id, 'sales').reverse();

    page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>💰 Sales / <span class="hindi">बिक्री</span></h1>
        <div class="subtitle">Record and manage your sales</div>
      </div>
    </div>

    <!-- Add Sale Form -->
    <div class="form-card">
      <h2>➕ Add New Sale / <span class="hindi">नई बिक्री दर्ज करें</span></h2>
      <div class="form-row">
        <div class="form-group">
          <label>Date / तारीख</label>
          <input type="date" id="sale-date" value="${today}" />
        </div>
        <div class="form-group">
          <label>Product Name / उत्पाद का नाम</label>
          <input type="text" id="sale-product" placeholder="e.g. Rice, Chips, Milk" list="product-suggestions" />
          <datalist id="product-suggestions">
            ${getProductSuggestions(user).map(p => `<option value="${esc(p)}">`).join('')}
          </datalist>
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Quantity / मात्रा</label>
          <input type="number" id="sale-qty" placeholder="1" min="0.01" step="0.01" oninput="calcSaleTotal()" />
        </div>
        <div class="form-group">
          <label>Selling Price / बिक्री मूल्य (₹)</label>
          <input type="number" id="sale-price" placeholder="0.00" min="0" step="0.01" oninput="calcSaleTotal()" />
        </div>
        <div class="form-group">
          <label>Payment Mode / भुगतान</label>
          <select id="sale-payment">
            <option value="Cash">Cash / नकद</option>
            <option value="UPI">UPI / यूपीआई</option>
            <option value="Credit">Credit / उधार</option>
            <option value="Card">Card</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Note (optional) / नोट</label>
        <input type="text" id="sale-note" placeholder="Customer name, any note..." />
      </div>
      <div class="calc-total">
        <span>Total Amount / कुल राशि</span>
        <strong id="sale-total-display">₹0.00</strong>
      </div>
      <button class="btn-primary" onclick="addSale()" style="width:100%;padding:1rem;font-size:1rem;">
        💾 Save Sale / बिक्री सेव करें
      </button>
    </div>

    <!-- Sales Table -->
    <div class="card">
      <div class="card-title" style="justify-content:space-between">
        <span>📋 Sales History / बिक्री इतिहास</span>
        <div style="display:flex;gap:.5rem;align-items:center">
          <input type="date" id="sales-filter-date" style="padding:.4rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.8rem;background:var(--bg-card);color:var(--text)" oninput="filterSalesTable()" />
          <button class="btn-secondary" onclick="exportSalesCSV()">⬇ Export CSV</button>
        </div>
      </div>
      <div id="sales-table-container">
        ${buildSalesTable(allSales)}
      </div>
    </div>
  `;
}

function calcSaleTotal() {
    const qty = parseFloat(document.getElementById('sale-qty')?.value) || 0;
    const price = parseFloat(document.getElementById('sale-price')?.value) || 0;
    const total = qty * price;
    const el = document.getElementById('sale-total-display');
    if (el) el.textContent = fmt(total);
}

function addSale() {
    const user = window._currentUser;
    const date = document.getElementById('sale-date').value;
    const product = document.getElementById('sale-product').value.trim();
    const qty = parseFloat(document.getElementById('sale-qty').value);
    const price = parseFloat(document.getElementById('sale-price').value);
    const payment = document.getElementById('sale-payment').value;
    const note = document.getElementById('sale-note').value.trim();

    if (!date) return showToast('Please enter date / तारीख डालें', 'error');
    if (!product) return showToast('Please enter product name / उत्पाद का नाम डालें', 'error');
    if (!qty || qty <= 0) return showToast('Enter valid quantity / सही मात्रा डालें', 'error');
    if (price < 0) return showToast('Enter valid price / सही मूल्य डालें', 'error');

    DB.insert(user.id, 'sales', { date, product, quantity: qty, price, total: qty * price, payment, note });

    // decrement inventory if product matches
    const inv = DB.getAll(user.id, 'inventory');
    const invItem = inv.find(i => i.name.toLowerCase() === product.toLowerCase());
    if (invItem) {
        const newQty = Math.max(0, invItem.quantity - qty);
        DB.update(user.id, 'inventory', invItem.id, { quantity: newQty });
        if (newQty <= invItem.minQty) showToast(`⚠️ Low stock alert: ${product}`, 'warning');
    }

    showToast('✅ Sale recorded! / बिक्री दर्ज हो गई!', 'success');
    renderSales(user);
}

function deleteSale(id) {
    if (!confirm('Delete this sale? / इस बिक्री को हटाएं?')) return;
    DB.delete(window._currentUser.id, 'sales', id);
    showToast('Sale deleted', 'info');
    renderSales(window._currentUser);
}

function filterSalesTable() {
    const date = document.getElementById('sales-filter-date')?.value;
    const user = window._currentUser;
    let sales = DB.getAll(user.id, 'sales').reverse();
    if (date) sales = sales.filter(s => s.date === date);
    const container = document.getElementById('sales-table-container');
    if (container) container.innerHTML = buildSalesTable(sales);
}

function buildSalesTable(sales) {
    if (!sales.length) return `<div class="empty-state"><div class="empty-icon">💰</div><h3>No Sales Found</h3><p>Add your first sale above.</p></div>`;
    const total = DB.sumField(sales, 'total');
    return `
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th>Payment</th><th>Note</th><th>Action</th></tr></thead>
        <tbody>
          ${sales.map(s => `<tr>
            <td>${formatDate(s.date)}</td>
            <td><strong>${esc(s.product)}</strong></td>
            <td>${s.quantity}</td>
            <td>${fmt(s.price)}</td>
            <td><span class="badge badge-green">${fmt(s.total)}</span></td>
            <td><span class="badge badge-blue">${esc(s.payment || 'Cash')}</span></td>
            <td style="color:var(--text-muted);font-size:.8rem">${esc(s.note || '—')}</td>
            <td><button class="btn-danger" onclick="deleteSale('${s.id}')">🗑</button></td>
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;background:var(--bg)">
            <td colspan="4">Total / कुल</td>
            <td colspan="4" style="color:var(--success);font-size:1.05rem">${fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function exportSalesCSV() {
    const user = window._currentUser;
    const sales = DB.getAll(user.id, 'sales');
    if (!sales.length) return showToast('No sales to export', 'warning');
    const wb = XLSX.utils.book_new();
    const data = [['Date', 'Product', 'Quantity', 'Price', 'Total', 'Payment', 'Note'],
    ...sales.map(s => [s.date, s.product, s.quantity, s.price, s.total, s.payment || 'Cash', s.note || ''])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Sales');
    XLSX.writeFile(wb, `DukanBook_Sales_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📥 Sales exported!', 'success');
}

function getProductSuggestions(user) {
    const sales = DB.getAll(user.id, 'sales');
    return [...new Set(sales.map(s => s.product))].slice(0, 20);
}
