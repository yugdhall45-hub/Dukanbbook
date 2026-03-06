/* main.js — AntiGravity Website Core Scripts */

// ── Navbar scroll state ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
}

// ── Mobile hamburger ─────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinks.classList.toggle('open');
    });
    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navLinks.classList.remove('open');
        });
    });
}

// ── Scroll Reveal ─────────────────────────────────────────────────
function initReveal() {
    const revealEls = document.querySelectorAll(
        '.reveal, .reveal-left, .reveal-right, .overview-card, .fact-card, .timeline-item, .info-card'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Staggered delay
                const delay = (entry.target.dataset.delay || 0);
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el, i) => {
        if (!el.dataset.delay) el.dataset.delay = (i % 6) * 80;
        observer.observe(el);
    });
}

initReveal();

// ── Number Counter Animation ──────────────────────────────────────
function animateCounter(el, target, duration) {
    const isFloat = target % 1 !== 0;
    const start = performance.now();
    const startVal = 0;

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (target - startVal) * eased;

        if (isFloat) {
            el.textContent = current.toFixed(1);
        } else {
            el.textContent = Math.floor(current).toLocaleString();
        }

        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = isFloat ? target.toFixed(1) : target.toLocaleString();
    }
    requestAnimationFrame(update);
}

function initCounters() {
    const factNumbers = document.querySelectorAll('.fact-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const textVal = el.dataset.target || el.textContent;
                const numericPart = parseFloat(textVal.replace(/[^0-9.]/g, ''));
                if (!isNaN(numericPart) && numericPart > 0) {
                    el.dataset.target = textVal;
                    animateCounter(el, numericPart, 2000);
                }
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    factNumbers.forEach(el => observer.observe(el));
}

initCounters();

// ── Newsletter form ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.borderColor = type === 'success' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(236, 72, 153, 0.3)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

document.querySelectorAll('.newsletter-form, #contact-form').forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput && emailInput.value) {
            showToast('🚀 You\'re in! Welcome to the AntiGravity community.');
            emailInput.value = '';
        }
    });
});

// ── Contact form ──────────────────────────────────────────────────
const contactForm = document.getElementById('main-contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('✅ Message sent! Our team will respond within 48 hours.');
        contactForm.reset();
    });
}

// ── Parallax on scroll ──────────────────────────────────────────
const parallaxElements = document.querySelectorAll('[data-parallax]');
if (parallaxElements.length) {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.3;
            el.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });
}

// ── Smooth active nav on scroll ──────────────────────────────────
function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) current = section.id;
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}` ||
            link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });

// ── Page transition on internal link click ───────────────────────
document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto"])').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('http') || href.startsWith('//')) return;
        e.preventDefault();
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        setTimeout(() => { window.location.href = href; }, 300);
    });
});

// Fade in on page load
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    });
});

// ── Cursor glow effect ───────────────────────────────────────────
(function () {
    const cursor = document.createElement('div');
    cursor.id = 'cursor-glow';
    cursor.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: left 0.1s ease, top 0.1s ease;
  `;
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
})();
