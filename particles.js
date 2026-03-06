/* particles.js — Starfield Background Particle System */
(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        init();
    });

    let stars = [];
    let shootingStars = [];
    let mouseX = W / 2, mouseY = H / 2;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function createStar() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.7 + 0.3,
            speed: Math.random() * 0.05 + 0.01,
            phase: Math.random() * Math.PI * 2,
            hue: Math.random() < 0.15 ? 185 : 220,
        };
    }

    function createShootingStar() {
        const angle = Math.PI / 6 + Math.random() * Math.PI / 6;
        return {
            x: Math.random() * W * 0.8,
            y: Math.random() * H * 0.5,
            len: 80 + Math.random() * 120,
            speed: 6 + Math.random() * 6,
            angle,
            alpha: 1,
            life: 1,
        };
    }

    function init() {
        stars = [];
        const count = Math.min(Math.floor(W * H / 5000), 200);
        for (let i = 0; i < count; i++) stars.push(createStar());
    }

    init();

    let t = 0;

    function loop() {
        t += 0.016;
        ctx.clearRect(0, 0, W, H);

        // Subtle vignette
        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.7);
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, 'rgba(2,4,8,0.3)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);

        // Mouse parallax offset
        const px = (mouseX / W - 0.5) * 15;
        const py = (mouseY / H - 0.5) * 15;

        // Draw stars
        for (let s of stars) {
            const tw = Math.sin(t * s.speed + s.phase) * 0.3 + 0.7;
            ctx.beginPath();
            ctx.arc(s.x + px * s.r * 0.5, s.y + py * s.r * 0.5, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue}, 80%, 80%, ${s.alpha * tw})`;
            ctx.fill();

            // Occasional cross flare
            if (s.r > 1.2) {
                ctx.strokeStyle = `hsla(${s.hue}, 80%, 80%, ${s.alpha * tw * 0.4})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(s.x + px * s.r * 0.5 - 4, s.y + py * s.r * 0.5);
                ctx.lineTo(s.x + px * s.r * 0.5 + 4, s.y + py * s.r * 0.5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(s.x + px * s.r * 0.5, s.y + py * s.r * 0.5 - 4);
                ctx.lineTo(s.x + px * s.r * 0.5, s.y + py * s.r * 0.5 + 4);
                ctx.stroke();
            }
        }

        // Occasional shooting stars
        if (Math.random() < 0.004) shootingStars.push(createShootingStar());

        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const ss = shootingStars[i];
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.life -= 0.015;
            if (ss.life <= 0) { shootingStars.splice(i, 1); continue; }

            const grad = ctx.createLinearGradient(
                ss.x, ss.y,
                ss.x - Math.cos(ss.angle) * ss.len,
                ss.y - Math.sin(ss.angle) * ss.len
            );
            grad.addColorStop(0, `rgba(200, 240, 255, ${ss.life})`);
            grad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.len, ss.y - Math.sin(ss.angle) * ss.len);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        requestAnimationFrame(loop);
    }

    loop();
})();
