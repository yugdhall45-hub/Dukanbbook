/* ============================================================
   DB.JS – localStorage persistence layer
   ============================================================ */

const DB = {
    // ── helpers ──────────────────────────────────────────────
    _key(userId, table) { return `db_${userId}_${table}`; },

    _get(userId, table) {
        try { return JSON.parse(localStorage.getItem(this._key(userId, table))) || []; }
        catch { return []; }
    },

    _set(userId, table, data) {
        localStorage.setItem(this._key(userId, table), JSON.stringify(data));
    },

    _uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    // ── generic CRUD ─────────────────────────────────────────
    insert(userId, table, record) {
        const rows = this._get(userId, table);
        const newRecord = { id: this._uid(), createdAt: new Date().toISOString(), ...record };
        rows.push(newRecord);
        this._set(userId, table, rows);
        return newRecord;
    },

    getAll(userId, table) {
        return this._get(userId, table);
    },

    getById(userId, table, id) {
        return this._get(userId, table).find(r => r.id === id) || null;
    },

    update(userId, table, id, changes) {
        const rows = this._get(userId, table);
        const idx = rows.findIndex(r => r.id === id);
        if (idx === -1) return null;
        rows[idx] = { ...rows[idx], ...changes, updatedAt: new Date().toISOString() };
        this._set(userId, table, rows);
        return rows[idx];
    },

    delete(userId, table, id) {
        const rows = this._get(userId, table).filter(r => r.id !== id);
        this._set(userId, table, rows);
    },

    // ── domain queries ────────────────────────────────────────
    getSalesByDate(userId, date) {
        return this.getAll(userId, 'sales').filter(s => s.date === date);
    },

    getSalesByMonth(userId, year, month) {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return this.getAll(userId, 'sales').filter(s => s.date.startsWith(prefix));
    },

    getPurchasesByMonth(userId, year, month) {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return this.getAll(userId, 'purchases').filter(p => p.date.startsWith(prefix));
    },

    getExpensesByMonth(userId, year, month) {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return this.getAll(userId, 'expenses').filter(e => e.date.startsWith(prefix));
    },

    sumField(records, field) {
        return records.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
    },

    // ── profit helpers ────────────────────────────────────────
    calcProfit(userId, dateStart, dateEnd) {
        const inRange = (date) => date >= dateStart && date <= dateEnd;
        const sales = this.getAll(userId, 'sales').filter(r => inRange(r.date));
        const purchases = this.getAll(userId, 'purchases').filter(r => inRange(r.date));
        const expenses = this.getAll(userId, 'expenses').filter(r => inRange(r.date));
        const totalSales = this.sumField(sales, 'total');
        const totalPurchases = this.sumField(purchases, 'total');
        const totalExpenses = this.sumField(expenses, 'amount');
        return {
            totalSales, totalPurchases, totalExpenses,
            profit: totalSales - totalPurchases - totalExpenses
        };
    },

    // ── seed demo data ────────────────────────────────────────
    seedDemo(userId) {
        if (this.getAll(userId, 'sales').length > 0) return; // already seeded

        const today = new Date();
        const fmt = (d) => d.toISOString().slice(0, 10);

        const products = ['Rice (5kg)', 'Chips', 'Soap', 'Biscuits', 'Cold Drink', 'Milk', 'Bread', 'Tea Leaves'];
        const suppliers = ['Metro Cash', 'Sharma Traders', 'Local Market', 'Wholesale Hub'];
        const expCats = ['Rent', 'Electricity', 'Labour', 'Transport', 'Misc'];

        for (let i = 30; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            const dateStr = fmt(d);

            // 2-4 sales per day
            const salesCount = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < salesCount; j++) {
                const qty = 1 + Math.floor(Math.random() * 10);
                const price = 20 + Math.floor(Math.random() * 200);
                this.insert(userId, 'sales', {
                    date: dateStr,
                    product: products[Math.floor(Math.random() * products.length)],
                    quantity: qty, price, total: qty * price, note: ''
                });
            }

            // 1-2 purchases per day
            if (Math.random() > 0.4) {
                const qty = 5 + Math.floor(Math.random() * 20);
                const cost = 15 + Math.floor(Math.random() * 150);
                this.insert(userId, 'purchases', {
                    date: dateStr,
                    product: products[Math.floor(Math.random() * products.length)],
                    supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
                    quantity: qty, cost, total: qty * cost, note: ''
                });
            }

            // Expenses 3x per week
            if (i % 3 === 0) {
                this.insert(userId, 'expenses', {
                    date: dateStr,
                    category: expCats[Math.floor(Math.random() * expCats.length)],
                    description: 'Monthly recurring',
                    amount: 100 + Math.floor(Math.random() * 900)
                });
            }
        }

        // seed inventory
        const invItems = [
            { name: 'Rice (5kg)', quantity: 25, unit: 'Bags', minQty: 5, costPrice: 200, sellPrice: 250 },
            { name: 'Chips (Pack)', quantity: 3, unit: 'Boxes', minQty: 5, costPrice: 10, sellPrice: 15 },
            { name: 'Soap', quantity: 50, unit: 'Pieces', minQty: 10, costPrice: 25, sellPrice: 35 },
            { name: 'Biscuits', quantity: 0, unit: 'Boxes', minQty: 5, costPrice: 40, sellPrice: 55 },
            { name: 'Cold Drink', quantity: 8, unit: 'Crates', minQty: 3, costPrice: 250, sellPrice: 350 },
            { name: 'Milk', quantity: 15, unit: 'Liters', minQty: 5, costPrice: 50, sellPrice: 60 },
        ];
        invItems.forEach(item => this.insert(userId, 'inventory', item));
    }
};
