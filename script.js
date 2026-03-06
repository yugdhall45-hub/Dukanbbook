/* =============================================
   LUXE FABRIC — B2B Fashion Supplier
   script.js — Main JavaScript
   ============================================= */

'use strict';

/* ─── UTILITY ────────────────────────────────── */
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ─── 1. PAGE TRANSITION ─────────────────────── */
(function initPageTransition() {
    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    document.body.appendChild(overlay);

    // Animate in on page load (leave state)
    overlay.classList.add('entering');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.remove('entering');
            overlay.classList.add('leaving');
            overlay.addEventListener('transitionend', () => {
                overlay.classList.remove('leaving');
            }, { once: true });
        });
    });

    // Intercept same-origin link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        // Only intercept relative/same-origin links that are .html files
        if (
            href &&
            !href.startsWith('#') &&
            !href.startsWith('http') &&
            !href.startsWith('mailto') &&
            !href.startsWith('tel') &&
            !link.hasAttribute('target')
        ) {
            e.preventDefault();
            overlay.classList.add('entering');
            overlay.addEventListener('transitionend', () => {
                window.location.href = href;
            }, { once: true });
        }
    });
})();


/* ─── 2. CUSTOM CURSOR ───────────────────────── */
(function initCursor() {
    // Only on devices that actually have a mouse
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const cursor = document.createElement('div');
    const follower = document.createElement('div');
    cursor.className = 'cursor';
    follower.className = 'cursor-follower';
    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    // Smooth follower with RAF
    function animateFollower() {
        followerX += (mouseX - followerX) * 0.10;
        followerY += (mouseY - followerY) * 0.10;
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover state on interactive elements
    const hoverTargets = 'a, button, [role="button"], .product-card, .collection-card, .filter-btn, .why-feature';
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverTargets)) {
            cursor.classList.add('hover');
            follower.classList.add('hover');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverTargets)) {
            cursor.classList.remove('hover');
            follower.classList.remove('hover');
        }
    });

    // Hide when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        follower.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        follower.style.opacity = '1';
    });
})();


/* ─── 3. NAVBAR SCROLL EFFECT ────────────────── */
(function initNav() {
    const nav = qs('.nav');
    if (!nav) return;

    let lastScroll = 0;
    let ticking = false;

    function onScroll() {
        const currentScroll = window.scrollY;
        if (!ticking) {
            requestAnimationFrame(() => {
                nav.classList.toggle('scrolled', currentScroll > 50);
                ticking = false;
            });
            ticking = true;
        }
        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile toggle
    const toggle = qs('.nav-toggle');
    const mobileMenu = qs('.nav-mobile');
    if (toggle && mobileMenu) {
        toggle.addEventListener('click', () => {
            const isOpen = toggle.classList.toggle('open');
            mobileMenu.classList.toggle('open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
        // Close on link click
        qsa('.nav-mobile a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('open');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // Highlight active page
    const currentPage = window.location.pathname.split('/').pop();
    qsa('.nav-links a, .nav-mobile a').forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
})();


/* ─── 4. SCROLL REVEAL (IntersectionObserver) ── */
(function initReveal() {
    const opts = { threshold: 0.12, rootMargin: '0px 0px -60px 0px' };
    const selectors = '.reveal, .reveal-left, .reveal-right';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, opts);

    qsa(selectors).forEach(el => observer.observe(el));
})();


/* ─── 5. PARALLAX EFFECTS ────────────────────── */
(function initParallax() {
    const parallaxEls = qsa('[data-parallax]');
    if (!parallaxEls.length) return;

    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                parallaxEls.forEach(el => {
                    const speed = parseFloat(el.dataset.parallax) || 0.3;
                    const rect = el.getBoundingClientRect();
                    const center = rect.top + rect.height / 2 - window.innerHeight / 2;
                    const offset = center * speed;
                    el.style.transform = `translateY(${offset}px)`;
                });
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial call

    // Parallax text sections
    const parallaxTexts = qsa('.parallax-text');
    parallaxTexts.forEach((el, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        el._initialX = 0;
    });

    function animateText() {
        const scrollY = window.scrollY;
        parallaxTexts.forEach((el, i) => {
            const dir = i % 2 === 0 ? 1 : -1;
            const speed = 0.08;
            const offset = scrollY * speed * dir;
            el.style.transform = `translateX(${offset}px)`;
        });
        requestAnimationFrame(animateText);
    }
    if (parallaxTexts.length) animateText();
})();


/* ─── 6. BUTTON RIPPLE ───────────────────────── */
(function initRipple() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
})();


/* ─── 7. MAGNETIC HOVER (subtle) ─────────────── */
(function initMagnetic() {
    const buttons = qsa('.btn-primary, .btn-outline:not(.filter-btn)');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
            btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
})();


/* ─── 8. HERO NUMBER COUNTER ─────────────────── */
(function initCounters() {
    const counters = qsa('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                const suffix = el.dataset.suffix || '';
                const dur = 1800;
                const start = performance.now();

                function tick(now) {
                    const elapsed = now - start;
                    const progress = clamp(elapsed / dur, 0, 1);
                    // Ease out expo
                    const eased = 1 - Math.pow(1 - progress, 4);
                    el.textContent = Math.round(eased * target) + suffix;
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
})();


/* ─── 9. PRODUCT FILTERS ─────────────────────── */
(function initFilters() {
    const filterBtns = qsa('.filter-btn');
    const productCards = qsa('.product-card');
    if (!filterBtns.length || !productCards.length) return;

    const countEl = qs('.products-count strong');

    function updateCount(visible) {
        if (countEl) countEl.textContent = visible;
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button within same group
            const group = btn.closest('.filter-group');
            if (group) {
                qsa('.filter-btn', group).forEach(b => b.classList.remove('active'));
            } else {
                // All-or-nothing: if "All" btn clicked, deactivate all
                if (btn.dataset.filter === 'all') {
                    filterBtns.forEach(b => b.classList.remove('active'));
                }
            }
            btn.classList.toggle('active', true);

            // Collect active filters
            const activeFilters = {};
            qsa('.filter-group').forEach(group => {
                const activeBtn = qs('.filter-btn.active', group);
                if (activeBtn && activeBtn.dataset.filter !== 'all') {
                    activeFilters[group.dataset.filterType] = activeBtn.dataset.filter;
                }
            });

            // Show/hide cards
            let visibleCount = 0;
            productCards.forEach((card, i) => {
                let show = true;
                Object.entries(activeFilters).forEach(([type, value]) => {
                    if (card.dataset[type] && card.dataset[type] !== value) show = false;
                });
                card.style.display = show ? '' : 'none';
                if (show) {
                    visibleCount++;
                    // Re-trigger entrance animation
                    card.style.animation = 'none';
                    card.offsetHeight; // reflow
                    card.style.animation = `card-in 0.4s ${i * 0.04}s var(--ease-out) forwards`;
                    card.style.opacity = '0';
                }
            });

            // No results message
            const noResults = qs('.no-results');
            if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
            updateCount(visibleCount);
        });
    });

    // Global "All" resets all filter groups
    const allBtns = qsa('.filter-btn[data-filter="all"]');
    allBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            productCards.forEach((card, i) => {
                card.style.display = '';
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = `card-in 0.4s ${i * 0.04}s var(--ease-out) forwards`;
                card.style.opacity = '0';
            });
            if (qs('.no-results')) qs('.no-results').style.display = 'none';
            updateCount(productCards.length);
        });
    });
})();


/* ─── 10. CONTACT FORM ───────────────────────── */
(function initContactForm() {
    const form = qs('#contactForm');
    if (!form) return;

    const successEl = qs('.form-success');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = qs('.form-submit', form);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        // Simulate async submission
        await new Promise(r => setTimeout(r, 1400));

        form.style.opacity = '0';
        form.style.transform = 'translateY(-20px)';
        form.style.transition = 'all 0.4s ease';

        setTimeout(() => {
            form.style.display = 'none';
            if (successEl) successEl.classList.add('show');
        }, 400);
    });

    // Floating label polyfill for autofill
    qsa('.form-input, .form-textarea', form).forEach(input => {
        input.setAttribute('placeholder', ' ');
    });
})();


/* ─── 11. SMOOTH HEADER HIDE ON SCROLL DOWN ──── */
(function initNavBehavior() {
    const nav = qs('.nav');
    if (!nav) return;

    let lastY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const y = window.scrollY;
                // Only hide after passing 200px
                if (y > 200) {
                    nav.style.transform = y > lastY ? 'translateY(-100%)' : 'translateY(0)';
                    nav.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1), background 0.45s ease';
                } else {
                    nav.style.transform = 'translateY(0)';
                }
                lastY = y;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();


/* ─── 12. COLLECTION CARD TILT ───────────────── */
(function initTilt() {
    const cards = qsa('.collection-card, .why-feature');
    if (!matchMedia('(hover: hover)').matches) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        });
    });
})();


/* ─── 13. MARQUEE PAUSE ON HOVER ─────────────── */
(function initMarquee() {
    const tracks = qsa('.marquee-track');
    tracks.forEach(track => {
        track.addEventListener('mouseenter', () => {
            track.style.animationPlayState = 'paused';
        });
        track.addEventListener('mouseleave', () => {
            track.style.animationPlayState = 'running';
        });
    });
})();


/* ─── 14. PAGE-SPECIFIC INIT ──────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();

    // Stagger product card entrance on products page
    if (page === 'products.html' || qs('.products-grid')) {
        qsa('.product-card').forEach((card, i) => {
            card.style.animationDelay = `${i * 0.07}s`;
        });
    }

    // Hero word scramble / reveal on index
    if (page === 'index.html' || page === '' || qs('.hero-title')) {
        // Already handled via CSS animations; trigger once loaded
        document.body.classList.add('loaded');
    }
});
