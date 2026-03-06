/* ============================================================
   AUTH.JS – User authentication with localStorage
   ============================================================ */

const Auth = {
    USERS_KEY: 'dukanbook_users',
    SESSION_KEY: 'dukanbook_session',

    _getUsers() {
        try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; }
        catch { return []; }
    },

    _saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    _hash(str) {
        // simple hash for demo (not cryptographic)
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h * 0x01000193) >>> 0;
        }
        return h.toString(16);
    },

    signup(name, email, password) {
        if (!name || !email || !password) return { ok: false, msg: 'All fields are required.' };
        if (password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };

        const users = this._getUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { ok: false, msg: 'Email already registered. Please login.' };
        }

        const user = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name, email: email.toLowerCase(), passwordHash: this._hash(password),
            createdAt: new Date().toISOString(), currency: 'INR', lang: 'en',
            businessName: name
        };
        users.push(user);
        this._saveUsers(users);
        this._createSession(user);
        return { ok: true, user };
    },

    login(email, password) {
        // demo account
        if (email === 'demo@dukanbook.com' && password === 'demo123') {
            let users = this._getUsers();
            let demo = users.find(u => u.email === 'demo@dukanbook.com');
            if (!demo) {
                const res = this.signup('Ram General Store', 'demo@dukanbook.com', 'demo123');
                demo = res.user;
                DB.seedDemo(demo.id);
                return { ok: true, user: demo };
            }
            this._createSession(demo);
            return { ok: true, user: demo };
        }

        const users = this._getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { ok: false, msg: 'No account found with this email.' };
        if (user.passwordHash !== this._hash(password)) return { ok: false, msg: 'Incorrect password.' };

        this._createSession(user);
        return { ok: true, user };
    },

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    _createSession(user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify({ userId: user.id, loginAt: Date.now() }));
    },

    getSession() {
        try {
            const s = JSON.parse(localStorage.getItem(this.SESSION_KEY));
            if (!s) return null;
            const users = this._getUsers();
            return users.find(u => u.id === s.userId) || null;
        } catch { return null; }
    },

    updateUser(userId, changes) {
        const users = this._getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return false;
        users[idx] = { ...users[idx], ...changes };
        this._saveUsers(users);
        return true;
    }
};

// ── DOM Handlers ──────────────────────────────────────────

function showLogin() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

function showSignup() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
}

function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');

    const result = Auth.login(email, password);
    if (!result.ok) { errEl.textContent = result.msg; return; }
    errEl.textContent = '';
    initApp(result.user);
}

function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;
    const errEl = document.getElementById('signup-error');

    const result = Auth.signup(name, email, pass);
    if (!result.ok) { errEl.textContent = result.msg; return; }
    errEl.textContent = '';
    initApp(result.user);
}

function handleLogout() {
    Auth.logout();
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    showLogin();
    showToast('Logged out successfully', 'info');
}

// Allow Enter key on auth forms
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    const activeForm = document.querySelector('.auth-form.active');
    if (!activeForm) return;
    if (activeForm.id === 'login-form') handleLogin();
    else handleSignup();
});
