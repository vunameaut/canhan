document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';

    let width, height;
    let animationFrameId;
    const isMobile = () => window.innerWidth < 768;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', () => {
        resizeCanvas();
        getWeatherTheme(); // Re-init on resize
    });
    resizeCanvas();

    const mouse = { x: undefined, y: undefined, radius: 100 };
    window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
    window.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; });

    function stopCurrentAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        ctx.clearRect(0, 0, width, height);
    }

    // --- THEME: Default / Clear / Cloudy (Constellation) ---
    function initConstellationTheme(particleCount) {
        particleCount = particleCount || (isMobile() ? 40 : 150);
        stopCurrentAnimation();
        let particles = [];
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 1.5 + 0.5;
                this.hue = Math.random() * 360;
            }
            draw() {
                this.hue = (this.hue + 0.1) % 360;
                ctx.fillStyle = `hsl(${this.hue}, 70%, 60%)`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                if (mouse.x !== undefined) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    if (Math.sqrt(dx * dx + dy * dy) < mouse.radius) {
                        this.x -= dx * 0.03;
                        this.y -= dy * 0.03;
                    }
                }
                this.draw();
            }
        }
        for (let i = 0; i < particleCount; i++) particles.push(new Particle());

        function connect() {
            const radiusSq = (isMobile() ? 90 : 110) ** 2;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) {
                    const distSq = ((particles[a].x - particles[b].x) ** 2) + ((particles[a].y - particles[b].y) ** 2);
                    if (distSq < radiusSq) {
                        const opacity = 1 - (distSq / radiusSq);
                        ctx.strokeStyle = `hsla(${(particles[a].hue + particles[b].hue) / 2}, 70%, 60%, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.fillStyle = 'rgba(17, 17, 17, 0.1)';
            ctx.fillRect(0, 0, width, height);
            particles.forEach(p => p.update());
            connect();
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }

    // --- THEME: Rain ---
    function initRainTheme(heavy = false) {
        stopCurrentAnimation();
        let drops = [];
        const dropCount = isMobile() ? (heavy ? 150 : 75) : (heavy ? 500 : 250);
        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.random() * width,
                y: Math.random() * height,
                len: Math.random() * 15 + 5,
                speed: Math.random() * 4 + 2
            });
        }
        function animate() {
            ctx.fillStyle = 'rgba(10, 10, 20, 0.2)';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = 'rgba(170, 180, 230, 0.5)';
            ctx.lineWidth = 1;
            drops.forEach(d => {
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x, d.y + d.len);
                ctx.stroke();
                d.y += d.speed;
                if (d.y > height) {
                    d.y = 0 - d.len;
                    d.x = Math.random() * width;
                }
            });
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }

    // --- THEME: Snow ---
    function initSnowTheme() {
        stopCurrentAnimation();
        let flakes = [];
        const flakeCount = isMobile() ? 80 : 250;
        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2.5 + 1,
                speed: Math.random() * 1 + 0.5,
                drift: Math.random() * 2 - 1
            });
        }
        function animate() {
            ctx.fillStyle = 'rgba(20, 20, 25, 0.2)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            flakes.forEach(f => {
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
                f.y += f.speed;
                f.x += f.drift;
                if (f.y > height) { f.y = 0 - f.r; f.x = Math.random() * width; }
                if (f.x > width + f.r) f.x = 0 - f.r;
                if (f.x < 0 - f.r) f.x = width + f.r;
            });
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }

    // --- THEME: Thunderstorm ---
    function initThunderstormTheme() {
        initRainTheme(true);
        let lastFlash = 0;
        function animate(time) {
            if (time - lastFlash > Math.random() * 12000 + 4000) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
                ctx.fillRect(0, 0, width, height);
                lastFlash = time;
            }
            animationFrameId = requestAnimationFrame(animate);
        }
        animate(0);
    }

    // --- WEATHER API LOGIC ---
    function getWeatherTheme() {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported.');
            return initConstellationTheme();
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
                    .then(res => res.json())
                    .then(data => applyWeatherTheme(data.current_weather.weathercode))
                    .catch(() => initConstellationTheme());
            },
            () => initConstellationTheme() // On location permission denied
        );
    }

    function applyWeatherTheme(code) {
        console.log(`Applying theme for weather code: ${code}`);
        // WMO Weather interpretation codes
        if (code === 0) initConstellationTheme(isMobile() ? 30 : 100); // Clear
        else if (code >= 1 && code <= 3) initConstellationTheme(isMobile() ? 50 : 200); // Cloudy
        else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) initRainTheme(code > 65 || code > 80); // Rain
        else if (code >= 71 && code <= 77) initSnowTheme(); // Snow
        else if (code >= 95 && code <= 99) initThunderstormTheme(); // Thunderstorm
        else initConstellationTheme(); // Default for Fog, etc.
    }

    getWeatherTheme();
});