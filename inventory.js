/* ============================================================
   INVENTORY.JS
   ============================================================ */

function renderInventory(user) {
    const inv = DB.getAll(user.id, 'inventory');
    const lowStock = inv.filter(i => i.quantity > 0 && i.quantity <= i.minQty);
    const outStock = inv.filter(i => i.quantity === 0);

    const page = document.getElementById('page-inventory');
    page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>📦 Inventory / <span class="hindi">स्टॉक</span></h1>
        <div class="subtitle">Manage your product stock</div>
      </div>
      <button class="btn-primary" onclick="showAddProductModal()">➕ Add Product</button>
    </div>

    <!-- Alerts -->
    ${outStock.length ? `<div style="background:#fee2e2;border:2px solid #ef4444;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1rem;font-weight:600;color:#991b1b">
      🚨 OUT OF STOCK: ${outStock.map(i => esc(i.name)).join(', ')}
    </div>` : ''}
    ${lowStock.length ? `<div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1rem;font-weight:600;color:#92400e">
      ⚠️ LOW STOCK: ${lowStock.map(i => esc(i.name)).join(', ')}
    </div>` : ''}

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:1.5rem">
      <div class="stat-card blue">
        <div class="stat-label">Total Products</div>
        <div class="stat-value">${inv.length}</div>
        <div class="stat-icon">📦</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Low Stock / कम स्टॉक</div>
        <div class="stat-value">${lowStock.length}</div>
        <div class="stat-icon">⚠️</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Out of Stock / खाली</div>
        <div class="stat-value">${outStock.length}</div>
        <div class="stat-icon">🚨</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">In Stock / स्टॉक में</div>
        <div class="stat-value">${inv.filter(i => i.quantity > i.minQty).length}</div>
        <div class="stat-icon">✅</div>
      </div>
    </div>

    <!-- Search -->
    <div class="filter-bar" style="margin-bottom:1rem">
      <input type="text" id="inv-search" placeholder="🔍 Search products..." oninput="filterInventory()" style="flex:1" />
      <button class="btn-secondary" onclick="exportInventoryCSV()">⬇ Export CSV</button>
    </div>

    <!-- Inventory Grid -->
    <div class="inventory-grid" id="inv-grid">
      ${buildInventoryGrid(inv)}
    </div>

    <!-- Add/Edit Product Modal -->
    <div id="inv-modal" style="display:none"></div>
  `;
}

function buildInventoryGrid(inv) {
    if (!inv.length) return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📦</div><h3>No Products Yet</h3><p>Add your first product above.</p></div>`;
    return inv.map(item => {
        let cls = '', alertHtml = '';
        if (item.quantity === 0) {
            cls = 'out-stock';
            alertHtml = `<span class="stock-alert out">Out of Stock / खाली</span>`;
        } else if (item.quantity <= item.minQty) {
            cls = 'low-stock';
            alertHtml = `<span class="stock-alert low">Low Stock / कम</span>`;
        }
        return `
      <div class="product-card ${cls}">
        <div class="product-name">${esc(item.name)}</div>
        <div class="product-qty">${item.quantity}</div>
        <div class="product-unit">${esc(item.unit || '')}</div>
        ${alertHtml}
        <div style="margin-top:.75rem;display:flex;gap:.5rem">
          <button class="btn-secondary" style="flex:1;font-size:.75rem;padding:.4rem" onclick="editProduct('${item.id}')">✏️ Edit</button>
          <button class="btn-danger" style="font-size:.75rem;padding:.4rem .6rem" onclick="deleteProduct('${item.id}')">🗑</button>
        </div>
        <div style="margin-top:.5rem;font-size:.75rem;color:var(--text-muted)">
          Buy: ${fmt(item.costPrice || 0)} · Sell: ${fmt(item.sellPrice || 0)}
        </div>
      </div>`;
    }).join('');
}

function filterInventory() {
    const q = document.getElementById('inv-search')?.value.toLowerCase();
    const user = window._currentUser;
    let inv = DB.getAll(user.id, 'inventory');
    if (q) inv = inv.filter(i => i.name.toLowerCase().includes(q));
    const grid = document.getElementById('inv-grid');
    if (grid) grid.innerHTML = buildInventoryGrid(inv);
}

function showAddProductModal(editId = null) {
    const user = window._currentUser;
    let item = editId ? DB.getById(user.id, 'inventory', editId) : null;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'inv-backdrop';
    backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${editId ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
        <button class="modal-close" onclick="closeInvModal()">✕</button>
      </div>
      <div class="form-group">
        <label>Product Name / उत्पाद नाम</label>
        <input type="text" id="inv-name" value="${item ? esc(item.name) : ''}" placeholder="Rice, Chips, Soap..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Current Stock / स्टॉक</label>
          <input type="number" id="inv-qty" value="${item ? item.quantity : ''}" placeholder="0" min="0" step="0.01" />
        </div>
        <div class="form-group">
          <label>Unit / इकाई</label>
          <select id="inv-unit">
            ${['Pieces', 'Kg', 'Liters', 'Boxes', 'Bags', 'Packets', 'Crates'].map(u =>
        `<option ${item && item.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Min Qty Alert / कम स्टॉक सीमा</label>
          <input type="number" id="inv-min" value="${item ? item.minQty : 5}" placeholder="5" min="0" />
        </div>
        <div class="form-group">
          <label>Cost Price / लागत (₹)</label>
          <input type="number" id="inv-cost" value="${item ? item.costPrice : ''}" placeholder="0" min="0" step="0.01" />
        </div>
      </div>
      <div class="form-group">
        <label>Selling Price / बिक्री मूल्य (₹)</label>
        <input type="number" id="inv-sell" value="${item ? item.sellPrice : ''}" placeholder="0" min="0" step="0.01" />
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeInvModal()">Cancel</button>
        <button class="btn-primary" onclick="saveProduct('${editId || ''}')">💾 Save</button>
      </div>
    </div>
  `;
    document.body.appendChild(backdrop);
}

function closeInvModal() {
    const el = document.getElementById('inv-backdrop');
    if (el) el.remove();
}

function saveProduct(editId) {
    const user = window._currentUser;
    const name = document.getElementById('inv-name').value.trim();
    const qty = parseFloat(document.getElementById('inv-qty').value) || 0;
    const unit = document.getElementById('inv-unit').value;
    const minQty = parseFloat(document.getElementById('inv-min').value) || 0;
    const costPrice = parseFloat(document.getElementById('inv-cost').value) || 0;
    const sellPrice = parseFloat(document.getElementById('inv-sell').value) || 0;

    if (!name) return showToast('Enter product name', 'error');

    if (editId) {
        DB.update(user.id, 'inventory', editId, { name, quantity: qty, unit, minQty, costPrice, sellPrice });
        showToast('Product updated!', 'success');
    } else {
        DB.insert(user.id, 'inventory', { name, quantity: qty, unit, minQty, costPrice, sellPrice });
        showToast('Product added!', 'success');
    }
    closeInvModal();
    renderInventory(user);
}

function editProduct(id) { showAddProductModal(id); }

function deleteProduct(id) {
    if (!confirm('Delete this product from inventory?')) return;
    DB.delete(window._currentUser.id, 'inventory', id);
    showToast('Product deleted', 'info');
    renderInventory(window._currentUser);
}

function exportInventoryCSV() {
    const user = window._currentUser;
    const inv = DB.getAll(user.id, 'inventory');
    if (!inv.length) return showToast('No inventory to export', 'warning');
    const wb = XLSX.utils.book_new();
    const data = [['Product', 'Quantity', 'Unit', 'Min Qty', 'Cost Price', 'Sell Price', 'Status'],
    ...inv.map(i => [i.name, i.quantity, i.unit || '', i.minQty, i.costPrice || 0, i.sellPrice || 0,
    i.quantity === 0 ? 'Out of Stock' : i.quantity <= i.minQty ? 'Low Stock' : 'In Stock'])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Inventory');
    XLSX.writeFile(wb, `DukanBook_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📥 Inventory exported!', 'success');
}
