/* ============================================================
   SETTINGS.JS
   ============================================================ */

function renderSettings(user) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const page = document.getElementById('page-settings');

    page.innerHTML = `
  <div class="page-header">
    <div>
      <h1>⚙️ Settings / <span class="hindi">सेटिंग</span></h1>
      <div class="subtitle">Manage your profile and preferences</div>
    </div>
  </div>

  <div class="settings-grid">

    <!-- ── Profile Card ── -->
    <div class="settings-section">
      <h3>👤 Business Profile / प्रोफाइल</h3>

      <div class="form-group" style="margin-bottom:.9rem">
        <label>Business Name / दुकान का नाम</label>
        <input type="text" id="set-business" value="${esc(user.businessName || user.name)}" placeholder="Ram General Store" />
      </div>
      <div class="form-group" style="margin-bottom:.9rem">
        <label>Owner Name / मालिक का नाम</label>
        <input type="text" id="set-name" value="${esc(user.name)}" placeholder="Your name" />
      </div>
      <div class="form-group" style="margin-bottom:.9rem">
        <label>Email / ईमेल</label>
        <input type="email" id="set-email" value="${esc(user.email)}" disabled style="opacity:.6;cursor:not-allowed" />
      </div>
      <div class="form-group" style="margin-bottom:1.25rem">
        <label>Phone / फोन (optional)</label>
        <input type="tel" id="set-phone" value="${esc(user.phone || '')}" placeholder="+91 XXXXX XXXXX" />
      </div>
      <button class="btn-primary" style="width:100%" onclick="saveProfile()">
        💾 Save Profile / प्रोफाइल सेव करें
      </button>
    </div>

    <!-- ── Preferences ── -->
    <div class="settings-section">
      <h3>🎨 Preferences / प्राथमिकताएं</h3>

      <div class="setting-row">
        <div>
          <div class="setting-label">🌙 Dark Mode / डार्क मोड</div>
          <div class="setting-desc">Switch between light and dark theme</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="dark-mode-toggle" ${isDark ? 'checked' : ''} onchange="toggleDarkMode(this.checked)" />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-row">
        <div>
          <div class="setting-label">💰 Currency / मुद्रा</div>
          <div class="setting-desc">Default currency for display</div>
        </div>
        <select id="set-currency" onchange="saveCurrency()" style="padding:.4rem .75rem;border:2px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text);font-size:.85rem;font-family:inherit">
          <option value="INR" ${(user.currency || 'INR') === 'INR' ? 'selected' : ''}>₹ INR – Indian Rupee</option>
          <option value="USD" ${user.currency === 'USD' ? 'selected' : ''}>$ USD – US Dollar</option>
          <option value="EUR" ${user.currency === 'EUR' ? 'selected' : ''}>€ EUR – Euro</option>
          <option value="GBP" ${user.currency === 'GBP' ? 'selected' : ''}>£ GBP – British Pound</option>
          <option value="AED" ${user.currency === 'AED' ? 'selected' : ''}>AED – UAE Dirham</option>
          <option value="SAR" ${user.currency === 'SAR' ? 'selected' : ''}>SAR – Saudi Riyal</option>
          <option value="BDT" ${user.currency === 'BDT' ? 'selected' : ''}>৳ BDT – Bangladeshi Taka</option>
        </select>
      </div>

      <div class="setting-row">
        <div>
          <div class="setting-label">🌐 Language / भाषा</div>
          <div class="setting-desc">Interface language</div>
        </div>
        <select id="set-lang" style="padding:.4rem .75rem;border:2px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text);font-size:.85rem;font-family:inherit">
          <option value="en" selected>English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </div>
    </div>

    <!-- ── Plan Card ── -->
    <div class="settings-section">
      <h3>🚀 Your Plan / आपका प्लान</h3>

      <div style="text-align:center;padding:1rem 0">
        <div style="font-size:3rem;margin-bottom:.5rem">🆓</div>
        <div style="font-size:1.3rem;font-weight:900;color:var(--text);margin-bottom:.25rem">Free Plan</div>
        <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:1.5rem">Basic features – no expiry</div>
      </div>

      <div style="background:var(--bg);border-radius:10px;padding:1rem;margin-bottom:1.25rem">
        <div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-muted);margin-bottom:.75rem">Free Plan Includes:</div>
        ${['✅ Sales, Purchases & Expenses', '✅ Profit calculation', '✅ Inventory management', '✅ Basic reports & charts', '✅ Data export (Excel/CSV)', '✅ Offline (localStorage)'].map(f =>
        `<div style="font-size:.85rem;color:var(--text);padding:.3rem 0;border-bottom:1px solid var(--border)">${f}</div>`
    ).join('')}
      </div>

      <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px;padding:1.25rem;color:#fff;text-align:center">
        <div style="font-size:1rem;font-weight:900;margin-bottom:.25rem">🚀 PRO Plan – Coming Soon</div>
        <div style="font-size:.78rem;opacity:.85">Cloud sync · Multi-device · GST reports · WhatsApp alerts</div>
      </div>
    </div>

    <!-- ── Data Management ── -->
    <div class="settings-section">
      <h3>📦 Data Management / डेटा प्रबंधन</h3>

      <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.5rem">
        <button class="btn-success" onclick="exportAllData()" style="text-align:left;padding:.85rem 1.25rem">
          📊 Export All Data to Excel / सभी डेटा एक्सपोर्ट करें
        </button>
        <button class="btn-secondary" onclick="exportDataJSON()" style="text-align:left;padding:.85rem 1.25rem">
          💾 Backup Data (JSON) / डेटा बैकअप
        </button>
      </div>

      <div style="background:var(--danger-light);border:2px solid var(--danger);border-radius:12px;padding:1.25rem">
        <div style="font-size:.88rem;font-weight:700;color:#991b1b;margin-bottom:.75rem">
          ⚠️ Danger Zone / खतरनाक क्षेत्र
        </div>
        <div style="font-size:.8rem;color:#991b1b;margin-bottom:1rem">
          Deleting your data is permanent and cannot be undone. / डेटा हटाना स्थायी है।
        </div>
        <button onclick="clearAllData()" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:.6rem 1.25rem;font-size:.82rem;font-weight:700;cursor:pointer;width:100%;transition:filter .2s" onmouseover="this.style.filter='brightness(.85)'" onmouseout="this.style.filter='brightness(1)'">
          🗑️ Clear All My Data / सभी डेटा हटाएं
        </button>
      </div>
    </div>

    <!-- ── About Card ── -->
    <div class="settings-section">
      <h3>ℹ️ About DukanBook</h3>
      <div style="text-align:center;padding:1rem 0">
        <div style="font-size:3rem;margin-bottom:.5rem">📒</div>
        <div style="font-size:1.5rem;font-weight:900;color:var(--primary);margin-bottom:.25rem">DukanBook</div>
        <div style="font-size:.85rem;color:var(--text-muted);margin-bottom:1.25rem">Smart Business Tracker v1.0</div>
        <div style="font-size:.8rem;color:var(--text-muted);line-height:1.8">
          Built for small shop owners, kirana stores,<br>
          street vendors & local traders.<br><br>
          <span class="hindi" style="font-size:.9rem;color:var(--primary)">
            छोटे दुकानदारों के लिए बनाया गया स्मार्ट ट्रैकर
          </span>
        </div>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:1rem">
        <div style="flex:1;background:var(--success-light);border-radius:8px;padding:.75rem;text-align:center">
          <div style="font-size:1.2rem;font-weight:900;color:#065f46">${DB.getAll(user.id, 'sales').length}</div>
          <div style="font-size:.7rem;color:#065f46;font-weight:600;text-transform:uppercase">Sales</div>
        </div>
        <div style="flex:1;background:var(--danger-light);border-radius:8px;padding:.75rem;text-align:center">
          <div style="font-size:1.2rem;font-weight:900;color:#991b1b">${DB.getAll(user.id, 'purchases').length}</div>
          <div style="font-size:.7rem;color:#991b1b;font-weight:600;text-transform:uppercase">Purchases</div>
        </div>
        <div style="flex:1;background:var(--warning-light);border-radius:8px;padding:.75rem;text-align:center">
          <div style="font-size:1.2rem;font-weight:900;color:#92400e">${DB.getAll(user.id, 'expenses').length}</div>
          <div style="font-size:.7rem;color:#92400e;font-weight:600;text-transform:uppercase">Expenses</div>
        </div>
      </div>
    </div>

  </div>`;
}

// ── Save Profile ─────────────────────────────────────────────
function saveProfile() {
    const user = window._currentUser;
    const businessName = document.getElementById('set-business').value.trim();
    const name = document.getElementById('set-name').value.trim();
    const phone = document.getElementById('set-phone').value.trim();

    if (!businessName) return showToast('Enter business name', 'error');
    if (!name) return showToast('Enter owner name', 'error');

    Auth.updateUser(user.id, { businessName, name, phone });
    window._currentUser = { ...user, businessName, name, phone };
    updateSidebarUserInfo(window._currentUser);
    showToast('✅ Profile saved! / प्रोफाइल सेव हुई!', 'success');
}

// ── Dark Mode Toggle ─────────────────────────────────────────
function toggleDarkMode(isDark) {
    applyTheme(isDark);
    // Re-render charts if on dashboard
    const activePage = document.querySelector('.page.active')?.id;
    if (activePage === 'page-dashboard') {
        renderDashboard(window._currentUser);
    }
}

// ── Save Currency ─────────────────────────────────────────────
function saveCurrency() {
    const user = window._currentUser;
    const currency = document.getElementById('set-currency').value;
    Auth.updateUser(user.id, { currency });
    window._currentUser = { ...user, currency };
    showToast(`💱 Currency set to ${currency}`, 'success');
}

// ── Export All Data ───────────────────────────────────────────
function exportAllData() {
    const user = window._currentUser;
    const wb = XLSX.utils.book_new();

    // Sales
    const sales = DB.getAll(user.id, 'sales');
    if (sales.length) {
        const sRows = [['Date', 'Product', 'Quantity', 'Price', 'Total', 'Payment', 'Note'],
        ...sales.map(s => [s.date, s.product, s.quantity, s.price, s.total, s.payment || 'Cash', s.note || ''])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sRows), 'Sales');
    }

    // Purchases
    const purchases = DB.getAll(user.id, 'purchases');
    if (purchases.length) {
        const pRows = [['Date', 'Product', 'Supplier', 'Quantity', 'Unit', 'Cost', 'Total', 'Payment'],
        ...purchases.map(p => [p.date, p.product, p.supplier || '', p.quantity, p.unit || '', p.cost, p.total, p.payment || 'Cash'])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pRows), 'Purchases');
    }

    // Expenses
    const expenses = DB.getAll(user.id, 'expenses');
    if (expenses.length) {
        const eRows = [['Date', 'Category', 'Description', 'Amount'],
        ...expenses.map(e => [e.date, e.category || '', e.description || '', e.amount])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(eRows), 'Expenses');
    }

    // Inventory
    const inv = DB.getAll(user.id, 'inventory');
    if (inv.length) {
        const iRows = [['Product', 'Quantity', 'Unit', 'Min Qty', 'Cost Price', 'Sell Price'],
        ...inv.map(i => [i.name, i.quantity, i.unit || '', i.minQty, i.costPrice || 0, i.sellPrice || 0])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(iRows), 'Inventory');
    }

    // Summary
    const allSales = DB.sumField(sales, 'total');
    const allPurchases = DB.sumField(purchases, 'total');
    const allExpenses = DB.sumField(expenses, 'amount');
    const sumRows = [
        ['Metric', 'Amount'],
        ['Total Sales', allSales],
        ['Total Purchases', allPurchases],
        ['Total Expenses', allExpenses],
        ['Net Profit', allSales - allPurchases - allExpenses],
        ['Total Transactions', sales.length + purchases.length + expenses.length],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumRows), 'Summary');

    XLSX.writeFile(wb, `DukanBook_FullBackup_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📥 All data exported to Excel!', 'success');
}

// ── Export JSON Backup ─────────────────────────────────────────
function exportDataJSON() {
    const user = window._currentUser;
    const data = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, name: user.name, email: user.email, businessName: user.businessName },
        sales: DB.getAll(user.id, 'sales'),
        purchases: DB.getAll(user.id, 'purchases'),
        expenses: DB.getAll(user.id, 'expenses'),
        inventory: DB.getAll(user.id, 'inventory'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DukanBook_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 JSON backup downloaded!', 'success');
}

// ── Clear All Data ─────────────────────────────────────────────
function clearAllData() {
    const user = window._currentUser;
    const conf = confirm(
        '⚠️ This will permanently delete ALL your sales, purchases, expenses, and inventory data.\n\n' +
        'क्या आप सुनिश्चित हैं?\n\nType YES to confirm / YES टाइप करें'
    );
    if (!conf) return;

    const answer = prompt('Type DELETE to confirm permanent deletion:');
    if (answer !== 'DELETE') {
        showToast('Cancelled – data not deleted', 'info');
        return;
    }

    ['sales', 'purchases', 'expenses', 'inventory'].forEach(table => {
        localStorage.removeItem(DB._key(user.id, table));
    });

    showToast('🗑️ All data cleared. Redirecting...', 'warning');
    setTimeout(() => navigate('dashboard'), 1500);
}
