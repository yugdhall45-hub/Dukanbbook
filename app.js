/* ============================================================
   APP.JS – Main application bootstrap & utilities
   ============================================================ */

'use strict';

// ── Globals ─────────────────────────────────────────────────
window._currentUser = null;

// ── Page Titles Map ──────────────────────────────────────────
const PAGE_TITLES = {
    dashboard: 'Dashboard / डैशबोर्ड',
    sales: 'Sales / बिक्री',
    purchases: 'Purchases / खरीद',
    expenses: 'Expenses / खर्च',
    inventory: 'Inventory / स्टॉक',
    reports: 'Reports / रिपोर्ट',
    settings: 'Settings / सेटिंग',
};

// ── Navigate ─────────────────────────────────────────────────
function navigate(pageName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageName);
    });

    // Show/hide pages
    document.querySelectorAll('.page').forEach(el => {
        el.classList.toggle('active', el.id === `page-${pageName}`);
    });

    // Update topbar title
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = PAGE_TITLES[pageName] || pageName;

    // Render the appropriate page
    const user = window._currentUser;
    if (!user) return;

    switch (pageName) {
        case 'dashboard': renderDashboard(user); break;
        case 'sales': renderSales(user); break;
        case 'purchases': renderPurchases(user); break;
        case 'expenses': renderExpenses(user); break;
        case 'inventory': renderInventory(user); break;
        case 'reports': renderReports(user); break;
        case 'settings': renderSettings(user); break;
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        closeSidebar();
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Sidebar ───────────────────────────────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        closeSidebar();
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// ── Toast Notification ────────────────────────────────────────
let _toastTimer = null;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    clearTimeout(_toastTimer);
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    _toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3400);
}

// ── Number Formatting ─────────────────────────────────────────
function fmt(num) {
    const n = parseFloat(num) || 0;
    const user = window._currentUser;
    const currency = (user && user.currency) ? user.currency : 'INR';

    if (currency === 'INR') {
        // Indian Rupee format with locale
        if (Math.abs(n) >= 1_00_00_000)
            return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
        if (Math.abs(n) >= 1_00_000)
            return `₹${(n / 1_00_000).toFixed(2)}L`;
        return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Generic international
    const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', AED: 'AED ', SAR: 'SAR ', BDT: '৳' };
    const sym = SYMBOLS[currency] || currency + ' ';
    return sym + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Date Formatting ───────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── HTML Escape ───────────────────────────────────────────────
function esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Theme Management ───────────────────────────────────────────
function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('dukanbook_theme', dark ? 'dark' : 'light');
}

function initTheme() {
    const saved = localStorage.getItem('dukanbook_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved ? saved === 'dark' : prefersDark);
}

// ── Topbar date updater ───────────────────────────────────────
function updateTopbarDate() {
    const el = document.getElementById('topbar-date');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
}

// ── Sidebar user info ─────────────────────────────────────────
function updateSidebarUserInfo(user) {
    const bNameEl = document.getElementById('sidebar-business-name');
    const avatarEl = document.getElementById('sidebar-avatar');
    const nameEl = document.getElementById('sidebar-user-name');
    const emailEl = document.getElementById('sidebar-user-email');
    const topbarAvEl = document.getElementById('topbar-user-avatar');

    const initials = (user.businessName || user.name || '?')
        .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    if (bNameEl) bNameEl.textContent = user.businessName || user.name;
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = user.name || user.email;
    if (emailEl) emailEl.textContent = user.email;
    if (topbarAvEl) topbarAvEl.textContent = initials;
}

// ── Init App (called after successful login/signup) ───────────
function initApp(user) {
    window._currentUser = user;

    // Show app, hide auth
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');

    // Update UI
    updateSidebarUserInfo(user);
    updateTopbarDate();

    // Apply saved theme
    initTheme();

    // Navigate to dashboard
    navigate('dashboard');

    // Refresh topbar date every minute
    if (window._dateInterval) clearInterval(window._dateInterval);
    window._dateInterval = setInterval(updateTopbarDate, 60_000);
}

// ── Auto-login if session exists ──────────────────────────────
(function autoLogin() {
    initTheme(); // Apply theme immediately (even on auth screen)
    const user = Auth.getSession();
    if (user) {
        initApp(user);
    }
})();

// ── Global keyboard shortcuts ─────────────────────────────────
document.addEventListener('keydown', function (e) {
    if (!window._currentUser) return;
    // Escape closes sidebar or modals
    if (e.key === 'Escape') {
        closeSidebar();
        const backdrop = document.getElementById('inv-backdrop');
        if (backdrop) backdrop.remove();
    }
});

// ── Window resize handler ─────────────────────────────────────
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});
