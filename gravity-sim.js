/* gravity-sim.js — Interactive Gravity Simulator */
(function () {
    const canvas = document.getElementById('gravity-sim');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas to wrapper
    function resize() {
        const wrapper = canvas.parentElement;
        canvas.width = wrapper.offsetWidth;
        canvas.height = 420;
    }
    resize();
    window.addEventListener('resize', resize);

    let running = true;
    let planets = [];
    let particles = [];
    const MAX_PARTICLES = 120;
    const PARTICLE_SPEED = 1.5;

    // Default planet
    function makePlanet(x, y, mass) {
        return { x, y, mass: mass || (30 + Math.random() * 60), vx: 0, vy: 0, dragging: false };
    }

    function makeParticle() {
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy;
        if (side === 0) { x = Math.random() * canvas.width; y = 0; vx = (Math.random() - 0.5) * 2; vy = PARTICLE_SPEED; }
        else if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; vx = -PARTICLE_SPEED; vy = (Math.random() - 0.5) * 2; }
        else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height; vx = (Math.random() - 0.5) * 2; vy = -PARTICLE_SPEED; }
        else { x = 0; y = Math.random() * canvas.height; vx = PARTICLE_SPEED; vy = (Math.random() - 0.5) * 2; }
        return { x, y, vx, vy, life: 1, hue: Math.random() * 60 + 180 };
    }

    // Seed initial planets
    planets.push(makePlanet(canvas.width * 0.33, canvas.height * 0.5, 60));
    planets.push(makePlanet(canvas.width * 0.66, canvas.height * 0.5, 45));

    // Seed particles
    for (let i = 0; i < MAX_PARTICLES; i++) particles.push(makeParticle());

    function update() {
        if (!running) return;

        // Update particles
        for (let p of particles) {
            for (let planet of planets) {
                const dx = planet.x - p.x;
                const dy = planet.y - p.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                if (dist < 6) { Object.assign(p, makeParticle()); continue; }
                const force = planet.mass / (distSq + 200);
                p.vx += force * dx / dist;
                p.vy += force * dy / dist;
            }
            // Speed limit
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 6) { p.vx = p.vx / speed * 6; p.vy = p.vy / speed * 6; }
            p.x += p.vx;
            p.y += p.vy;
            // Respawn if out
            if (p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10) {
                Object.assign(p, makeParticle());
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Background
        ctx.fillStyle = 'rgba(2, 4, 8, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Draw gravity field lines
        for (let planet of planets) {
            const rings = [1, 2, 3, 4];
            for (let r of rings) {
                const radius = planet.mass * r * 1.2;
                const alpha = 0.06 / r;
                ctx.beginPath();
                ctx.arc(planet.x, planet.y, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Draw particles
        for (let p of particles) {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const alpha = Math.min(1, speed / 3) * 0.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
            ctx.fill();
            // Trail
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
            ctx.strokeStyle = `hsla(${p.hue}, 100%, 70%, ${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw planets
        for (let planet of planets) {
            // Glow
            const grad = ctx.createRadialGradient(planet.x, planet.y, 0, planet.x, planet.y, planet.mass * 1.5);
            grad.addColorStop(0, `rgba(0, 212, 255, 0.15)`);
            grad.addColorStop(1, `rgba(0, 212, 255, 0)`);
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.mass * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Core
            const grad2 = ctx.createRadialGradient(planet.x - planet.mass * 0.3, planet.y - planet.mass * 0.3, 0, planet.x, planet.y, planet.mass);
            grad2.addColorStop(0, '#4dd9ff');
            grad2.addColorStop(0.4, '#0080b0');
            grad2.addColorStop(1, '#001830');
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.mass, 0, Math.PI * 2);
            ctx.fillStyle = grad2;
            ctx.fill();

            // Ring
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.mass, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }
    loop();

    // Click to add planet
    let draggingPlanet = null;

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Check if clicking existing planet
        for (let p of planets) {
            const dx = p.x - mx, dy = p.y - my;
            if (Math.sqrt(dx * dx + dy * dy) < p.mass) {
                draggingPlanet = p;
                p.dragging = true;
                return;
            }
        }
        // Add new planet
        if (planets.length < 5) {
            const np = makePlanet(mx, my);
            planets.push(np);
            draggingPlanet = np;
            np.dragging = true;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!draggingPlanet) return;
        const rect = canvas.getBoundingClientRect();
        draggingPlanet.x = (e.clientX - rect.left) * (canvas.width / rect.width);
        draggingPlanet.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener('mouseup', () => {
        if (draggingPlanet) draggingPlanet.dragging = false;
        draggingPlanet = null;
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const mx = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const my = (touch.clientY - rect.top) * (canvas.height / rect.height);
        for (let p of planets) {
            const dx = p.x - mx, dy = p.y - my;
            if (Math.sqrt(dx * dx + dy * dy) < p.mass + 10) { draggingPlanet = p; return; }
        }
        if (planets.length < 5) { const np = makePlanet(mx, my); planets.push(np); draggingPlanet = np; }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!draggingPlanet) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        draggingPlanet.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        draggingPlanet.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    }, { passive: false });

    canvas.addEventListener('touchend', () => { draggingPlanet = null; });

    // Controls
    const resetBtn = document.getElementById('sim-reset');
    const addBtn = document.getElementById('sim-add-planet');
    const toggleBtn = document.getElementById('sim-toggle');

    if (resetBtn) resetBtn.addEventListener('click', () => {
        planets = [];
        planets.push(makePlanet(canvas.width * 0.33, canvas.height * 0.5, 60));
        planets.push(makePlanet(canvas.width * 0.66, canvas.height * 0.5, 45));
        particles = [];
        for (let i = 0; i < MAX_PARTICLES; i++) particles.push(makeParticle());
    });

    if (addBtn) addBtn.addEventListener('click', () => {
        if (planets.length < 5) {
            planets.push(makePlanet(
                canvas.width * (0.2 + Math.random() * 0.6),
                canvas.height * (0.2 + Math.random() * 0.6)
            ));
        }
    });

    if (toggleBtn) toggleBtn.addEventListener('click', () => {
        running = !running;
        toggleBtn.textContent = running ? 'Running' : 'Paused';
        toggleBtn.classList.toggle('active', running);
    });
})();
