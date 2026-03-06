/* ============================================================
   PURCHASES.JS
   ============================================================ */

function renderPurchases(user) {
    const today = new Date().toISOString().slice(0, 10);
    const allPurchases = DB.getAll(user.id, 'purchases').reverse();

    const page = document.getElementById('page-purchases');
    page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🛒 Purchases / <span class="hindi">खरीद</span></h1>
        <div class="subtitle">Record goods purchased from suppliers</div>
      </div>
    </div>

    <!-- Add Purchase Form -->
    <div class="form-card">
      <h2>➕ Add New Purchase / <span class="hindi">नई खरीद दर्ज करें</span></h2>
      <div class="form-row">
        <div class="form-group">
          <label>Date / तारीख</label>
          <input type="date" id="pur-date" value="${today}" />
        </div>
        <div class="form-group">
          <label>Product / Item / उत्पाद</label>
          <input type="text" id="pur-product" placeholder="e.g. Rice Sack, Chips Box" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Supplier Name / आपूर्तिकर्ता</label>
          <input type="text" id="pur-supplier" placeholder="e.g. Metro Cash, Sharma Traders" />
        </div>
        <div class="form-group">
          <label>Payment Mode / भुगतान</label>
          <select id="pur-payment">
            <option value="Cash">Cash / नकद</option>
            <option value="UPI">UPI / यूपीआई</option>
            <option value="Credit">Credit / उधार</option>
            <option value="Cheque">Cheque / चेक</option>
          </select>
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Quantity / मात्रा</label>
          <input type="number" id="pur-qty" placeholder="1" min="0.01" step="0.01" oninput="calcPurTotal()" />
        </div>
        <div class="form-group">
          <label>Cost Price / लागत मूल्य (₹)</label>
          <input type="number" id="pur-cost" placeholder="0.00" min="0" step="0.01" oninput="calcPurTotal()" />
        </div>
        <div class="form-group">
          <label>Unit / इकाई</label>
          <select id="pur-unit">
            <option>Pieces</option><option>Kg</option><option>Liters</option>
            <option>Boxes</option><option>Bags</option><option>Packets</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Note (optional) / नोट</label>
        <input type="text" id="pur-note" placeholder="Invoice number, any note..." />
      </div>
      <div class="calc-total">
        <span>Total Purchase / कुल खरीद</span>
        <strong id="pur-total-display">₹0.00</strong>
      </div>
      <button class="btn-primary" onclick="addPurchase()" style="width:100%;padding:1rem;font-size:1rem;">
        💾 Save Purchase / खरीद सेव करें
      </button>
    </div>

    <!-- Purchases Table -->
    <div class="card">
      <div class="card-title" style="justify-content:space-between">
        <span>📋 Purchase History / खरीद इतिहास</span>
        <div style="display:flex;gap:.5rem;align-items:center">
          <input type="date" id="pur-filter-date" style="padding:.4rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.8rem;background:var(--bg-card);color:var(--text)" oninput="filterPurTable()" />
          <button class="btn-secondary" onclick="exportPurchasesCSV()">⬇ Export CSV</button>
        </div>
      </div>
      <div id="pur-table-container">
        ${buildPurTable(allPurchases)}
      </div>
    </div>
  `;
}

function calcPurTotal() {
    const qty = parseFloat(document.getElementById('pur-qty')?.value) || 0;
    const cost = parseFloat(document.getElementById('pur-cost')?.value) || 0;
    const el = document.getElementById('pur-total-display');
    if (el) el.textContent = fmt(qty * cost);
}

function addPurchase() {
    const user = window._currentUser;
    const date = document.getElementById('pur-date').value;
    const product = document.getElementById('pur-product').value.trim();
    const supplier = document.getElementById('pur-supplier').value.trim();
    const qty = parseFloat(document.getElementById('pur-qty').value);
    const cost = parseFloat(document.getElementById('pur-cost').value);
    const unit = document.getElementById('pur-unit').value;
    const payment = document.getElementById('pur-payment').value;
    const note = document.getElementById('pur-note').value.trim();

    if (!date) return showToast('Please enter date', 'error');
    if (!product) return showToast('Please enter product name', 'error');
    if (!qty || qty <= 0) return showToast('Enter valid quantity', 'error');
    if (cost < 0) return showToast('Enter valid cost price', 'error');

    DB.insert(user.id, 'purchases', { date, product, supplier, quantity: qty, cost, unit, total: qty * cost, payment, note });

    // Update inventory if product found
    const inv = DB.getAll(user.id, 'inventory');
    const invItem = inv.find(i => i.name.toLowerCase() === product.toLowerCase());
    if (invItem) {
        DB.update(user.id, 'inventory', invItem.id, { quantity: invItem.quantity + qty });
    }

    showToast('✅ Purchase recorded! / खरीद दर्ज हो गई!', 'success');
    renderPurchases(user);
}

function deletePurchase(id) {
    if (!confirm('Delete this purchase?')) return;
    DB.delete(window._currentUser.id, 'purchases', id);
    showToast('Purchase deleted', 'info');
    renderPurchases(window._currentUser);
}

function filterPurTable() {
    const date = document.getElementById('pur-filter-date')?.value;
    const user = window._currentUser;
    let purchases = DB.getAll(user.id, 'purchases').reverse();
    if (date) purchases = purchases.filter(p => p.date === date);
    const container = document.getElementById('pur-table-container');
    if (container) container.innerHTML = buildPurTable(purchases);
}

function buildPurTable(purchases) {
    if (!purchases.length) return `<div class="empty-state"><div class="empty-icon">🛒</div><h3>No Purchases Found</h3><p>Add your first purchase above.</p></div>`;
    const total = DB.sumField(purchases, 'total');
    return `
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Date</th><th>Product</th><th>Supplier</th><th>Qty</th><th>Cost</th><th>Total</th><th>Payment</th><th>Action</th></tr></thead>
        <tbody>
          ${purchases.map(p => `<tr>
            <td>${formatDate(p.date)}</td>
            <td><strong>${esc(p.product)}</strong></td>
            <td style="color:var(--text-muted)">${esc(p.supplier || '—')}</td>
            <td>${p.quantity} ${esc(p.unit || '')}</td>
            <td>${fmt(p.cost)}</td>
            <td><span class="badge badge-red">${fmt(p.total)}</span></td>
            <td><span class="badge badge-blue">${esc(p.payment || 'Cash')}</span></td>
            <td><button class="btn-danger" onclick="deletePurchase('${p.id}')">🗑</button></td>
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;background:var(--bg)">
            <td colspan="5">Total / कुल</td>
            <td colspan="3" style="color:var(--danger);font-size:1.05rem">${fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function exportPurchasesCSV() {
    const user = window._currentUser;
    const purchases = DB.getAll(user.id, 'purchases');
    if (!purchases.length) return showToast('No purchases to export', 'warning');
    const wb = XLSX.utils.book_new();
    const data = [['Date', 'Product', 'Supplier', 'Quantity', 'Unit', 'Cost', 'Total', 'Payment', 'Note'],
    ...purchases.map(p => [p.date, p.product, p.supplier || '', p.quantity, p.unit || '', p.cost, p.total, p.payment || 'Cash', p.note || ''])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Purchases');
    XLSX.writeFile(wb, `DukanBook_Purchases_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📥 Purchases exported!', 'success');
}
