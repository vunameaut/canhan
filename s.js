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
    let canvasClickHandler = null;
    let mouseDownHandler = null;
    let mouseMoveHandler = null;
    let mouseUpHandler = null;


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
        if (canvasClickHandler) {
            canvas.removeEventListener('click', canvasClickHandler);
            canvasClickHandler = null;
        }
        if (mouseDownHandler) {
            canvas.removeEventListener('mousedown', mouseDownHandler);
            canvas.removeEventListener('mousemove', mouseMoveHandler);
            canvas.removeEventListener('mouseup', mouseUpHandler);
            mouseDownHandler = null;
            mouseMoveHandler = null;
            mouseUpHandler = null;
        }
        ctx.clearRect(0, 0, width, height);
    }

    // --- THEME: Default / Clear / Cloudy (Constellation) ---
    function initConstellationTheme(particleCount = 150) {
        stopCurrentAnimation();
        let particles = [];
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
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
            const radiusSq = 110 * 110;
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
        const dropCount = heavy ? 500 : 250;
        const umbrella = { radius: 120 };

        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.random() * width,
                y: Math.random() * height,
                len: Math.random() * 20 + 10,
                speed: Math.random() * 5 + 2
            });
        }

        function animate() {
            ctx.fillStyle = 'rgba(10, 10, 20, 1)'; // Solid background to prevent trails
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = 'rgba(170, 180, 230, 0.5)';
            ctx.lineWidth = 1;
            drops.forEach(d => {
                if (mouse.x !== undefined) {
                    const dx = d.x - mouse.x;
                    const dy = d.y - mouse.y;
                    if (dx * dx + dy * dy < umbrella.radius * umbrella.radius) {
                        // Skip drawing and reset if under umbrella
                        d.y = 0 - d.len;
                        d.x = Math.random() * width;
                        return;
                    } 
                }

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

            // Draw Umbrella Emoji on top
            if (mouse.x !== undefined) {
                ctx.font = '240px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('☂️', mouse.x, mouse.y);
            }

            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }

    // --- THEME: Snow ---
    function initSnowTheme() {
        stopCurrentAnimation();
        const card = document.querySelector('.card');
        let cardRect = card.getBoundingClientRect();

        let flakes = [];
        const flakeCount = 250;
        let snowmen = [{
            x: width / 2,
            y: 50,
            vx: (Math.random() - 0.5) * 2,
            vy: 0,
            size: 70,
            dragging: false
        }];

        const gravity = 0.1;
        const speed = 1.5; // Constant horizontal speed
        let draggedSnowman = null;
        let dragOffsetX, dragOffsetY;
        let didDrag = false; // Flag to distinguish click from drag

        mouseDownHandler = (e) => {
            didDrag = false; // Reset flag on new mouse press
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Find the topmost snowman clicked
            for (let i = snowmen.length - 1; i >= 0; i--) {
                const snowman = snowmen[i];
                const size = snowman.size;
                if (clickX > snowman.x - size / 2 && clickX < snowman.x + size / 2 &&
                    clickY > snowman.y - size && clickY < snowman.y + size / 4) {
                    
                    draggedSnowman = snowman; // Mark as potential drag/click target
                    dragOffsetX = clickX - snowman.x;
                    dragOffsetY = clickY - snowman.y;
                    break; 
                }
            }
        };

        mouseMoveHandler = (e) => {
            if (draggedSnowman) {
                didDrag = true; // If mouse moves, it's a drag
                draggedSnowman.dragging = true;
                draggedSnowman.vx = 0; 
                draggedSnowman.vy = 0;

                const rect = canvas.getBoundingClientRect();
                draggedSnowman.x = e.clientX - rect.left - dragOffsetX;
                draggedSnowman.y = e.clientY - rect.top - dragOffsetY;
            }
        };

        mouseUpHandler = () => {
            if (draggedSnowman) {
                // If we didn't drag, it was a click on a snowman
                if (!didDrag) {
                    snowmen.push({
                        x: Math.random() * width,
                        y: -50,
                        vx: (Math.random() - 0.5) * 2,
                        vy: 0,
                        size: 70,
                        dragging: false
                    });
                }
                
                // Reset state
                if (draggedSnowman.y >= height) { // If released on the ground
                    draggedSnowman.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
                }
                draggedSnowman.dragging = false;
                draggedSnowman = null;
            }
        };

        canvas.addEventListener('mousedown', mouseDownHandler);
        canvas.addEventListener('mousemove', mouseMoveHandler);
        canvas.addEventListener('mouseup', mouseUpHandler);

        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 3 + 1,
                speed: Math.random() * 1 + 0.5,
                drift: Math.random() * 2 - 1
            });
        }

        function animate() {
            cardRect = card.getBoundingClientRect();
            ctx.fillStyle = 'rgba(20, 20, 25, 1)';
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

            // First, resolve overlaps between all snowmen on the ground to prevent them from sinking into each other
            snowmen.forEach((snowman, i) => {
                if (snowman.y < height) return; // Only process snowmen on the ground
                for (let j = i + 1; j < snowmen.length; j++) {
                    const other = snowmen[j];
                    if (other.y < height) continue; // Only process other snowmen on the ground

                    const dx = other.x - snowman.x;
                    const distance = Math.abs(dx);
                    const minDistance = snowman.size / 2 + other.size / 2;

                    if (distance < minDistance) {
                        const overlap = minDistance - distance;
                        // Push them apart equally
                        snowman.x -= dx > 0 ? overlap / 2 : -overlap / 2;
                        other.x += dx > 0 ? overlap / 2 : -overlap / 2;
                    }
                }
            });

            snowmen.forEach((snowman, i) => {
                if (!snowman.dragging) {
                    // --- Vertical Movement ---
                    snowman.vy += gravity;
                    snowman.y += snowman.vy;

                    // Ground landing
                    if (snowman.y > height) {
                        snowman.y = height;
                        snowman.vy = 0;
                        // If it just landed and isn't moving, give it a direction.
                        if (snowman.vx === 0) {
                            snowman.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
                        }
                    }

                    // --- Horizontal Movement & Collision (applies only to snowmen on the ground) ---
                    if (snowman.y === height) {
                        let isBlockedOnLeft = false;
                        let isBlockedOnRight = false;
                        const halfSize = snowman.size / 2;

                        // a) Check for wall blocks
                        if (snowman.x - halfSize <= 0) isBlockedOnLeft = true;
                        if (snowman.x + halfSize >= width) isBlockedOnRight = true;

                        // b) Check for other snowmen blocks
                        for (let j = 0; j < snowmen.length; j++) {
                            if (i === j) continue;
                            const other = snowmen[j];
                            if (other.y < height) continue; // Skip any that aren't on the ground

                            const dx = other.x - snowman.x;
                            const distance = Math.abs(dx);
                            const minDistance = halfSize + other.size / 2;

                            // Check if the other snowman is close enough to be a blocker
                            if (distance < minDistance + 1) { // Use a 1px buffer to be safe
                                if (dx > 0) { // The other snowman is to the right
                                    isBlockedOnRight = true;
                                } else { // The other snowman is to the left
                                    isBlockedOnLeft = true;
                                }
                            }
                        }

                        // c) Decide movement based on blocks
                        if (isBlockedOnLeft && isBlockedOnRight) {
                            snowman.vx = 0; // Trapped, so stop.
                        } else if (isBlockedOnRight && snowman.vx > 0) {
                            snowman.vx = -speed; // Moving right, but blocked right -> turn around.
                        } else if (isBlockedOnLeft && snowman.vx < 0) {
                            snowman.vx = speed; // Moving left, but blocked left -> turn around.
                        } else if (snowman.vx === 0 && (!isBlockedOnLeft || !isBlockedOnRight)) {
                            // Was trapped, but now a path is clear. Pick a direction.
                            snowman.vx = isBlockedOnLeft ? speed : -speed;
                        }
                    }
                    
                    // d) Final position update
                    snowman.x += snowman.vx;

                    // --- Falling Collision (Card) ---
                    // This logic only applies to snowmen that are NOT on the ground.
                    if (snowman.y < height) {
                        const size = snowman.size;
                        const halfSize = size/2;
                        if (snowman.x + halfSize > cardRect.left && snowman.x - halfSize < cardRect.right &&
                            snowman.y > cardRect.top && snowman.y - size < cardRect.bottom) {
                            
                            const prevY = snowman.y - snowman.vy;
                            // Hit the top of the card
                            if (prevY <= cardRect.top) {
                                snowman.y = cardRect.top;
                                snowman.vy = 0;
                                snowman.vx = (snowman.vx || (Math.random() - 0.5) * 2);
                            } 
                            // Hit the side of the card while falling
                            else if (prevY > cardRect.top) {
                                if(snowman.x < cardRect.left + halfSize) { 
                                    snowman.x = cardRect.left - halfSize;
                                } else { 
                                    snowman.x = cardRect.right + halfSize;
                                }
                                snowman.vx *= -1;
                            }
                        }
                    }
                }

                // --- Drawing ---
                ctx.font = `${snowman.size}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('☃️', snowman.x, snowman.y);
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
        if (code === 0) initConstellationTheme(300); // Clear
        else if (code >= 1 && code <= 3) initConstellationTheme(200); // Cloudy
        else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) initRainTheme(code > 65 || code > 80); // Rain
        else if (code >= 71 && code <= 77) initSnowTheme(); // Snow
        else if (code >= 95 && code <= 99) initThunderstormTheme(); // Thunderstorm
        else initConstellationTheme(); // Default for Fog, etc.
    }

    // --- GYROSCOPE TILT EFFECT ---
    function handleOrientation(event) {
        const card = document.querySelector('.card');
        if (!card) return;

        const { beta, gamma } = event;

        // Clamp values for a subtle effect
        const tiltX = Math.min(20, Math.max(-20, beta)); // Front-back tilt
        const tiltY = Math.min(20, Math.max(-20, gamma)); // Left-right tilt

        card.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg) scale3d(1, 1, 1)`;
    }

    if (window.DeviceOrientationEvent && 'ontouchstart' in window) {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    // --- THEME SWITCHER ---
    function addThemeSwitcher() {
        const styles = `
            #theme-switcher {
                position: fixed;
                bottom: 10px;
                left: 10px;
                z-index: 1000;
                display: flex;
                gap: 5px;
                background: rgba(0,0,0,0.3);
                padding: 5px;
                border-radius: 10px;
            }
            #theme-switcher button {
                font-family: 'Montserrat', sans-serif;
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.2);
                padding: 12px 15px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.3s;
            }
            #theme-switcher button:hover {
                background: rgba(255,255,255,0.3);
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const switcher = document.createElement('div');
        switcher.id = 'theme-switcher';
        switcher.innerHTML = `
            <button data-theme="constellation">Clear</button>
            <button data-theme="rain">Rain</button>
            <button data-theme="snow">Snow</button>
            <button data-theme="thunder">Storm</button>
        `;
        document.body.appendChild(switcher);

        switcher.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const theme = e.target.dataset.theme;
            if (theme === 'constellation') initConstellationTheme(150);
            else if (theme === 'rain') initRainTheme();
            else if (theme === 'snow') initSnowTheme();
            else if (theme === 'thunder') initThunderstormTheme();
        });
    }

    // --- MUSIC PLAYER ---
    const audioPlayer = document.getElementById('audio-player');
    const songTitleEl = document.getElementById('song-title');
    const volumeControl = document.getElementById('volume-control');
    const playlistEl = document.getElementById('playlist');
    const playlistOverlay = document.getElementById('playlist-overlay');
    const songTitleContainer = document.getElementById('song-title-container');
    const avatar = document.querySelector('.avatar');
    const playlistItems = document.querySelectorAll('#playlist li');

    let currentSongIndex = 0;
    audioPlayer.volume = 0.5;

    function loadSong(index) {
        const item = playlistItems[index];
        audioPlayer.src = item.dataset.src;
        songTitleEl.textContent = item.textContent;
        currentSongIndex = index;

        const startTime = parseFloat(item.dataset.starttime || 0);
        audioPlayer.addEventListener('canplay', () => {
            audioPlayer.currentTime = startTime;
        }, { once: true });
    }

    function playSong() {
        audioPlayer.play().catch(e => console.log("Audio play failed: " + e));
        avatar.classList.add('spinning');
    }

    function pauseSong() {
        audioPlayer.pause();
        avatar.classList.remove('spinning');
    }

    volumeControl.addEventListener('click', () => {
        if (audioPlayer.muted) {
            audioPlayer.muted = false;
            volumeControl.innerHTML = '<i class="fas fa-volume-up"></i>';
            if (audioPlayer.paused) {
                playSong();
            }
        } else {
            audioPlayer.muted = true;
            volumeControl.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    });

    avatar.addEventListener('click', () => {
        if (audioPlayer.paused) {
            playSong();
        } else {
            pauseSong();
        }
    });

    audioPlayer.addEventListener('play', () => avatar.classList.add('spinning'));
    audioPlayer.addEventListener('pause', () => avatar.classList.remove('spinning'));
    audioPlayer.addEventListener('ended', () => {
        currentSongIndex = (currentSongIndex + 1) % playlistItems.length;
        loadSong(currentSongIndex);
        playSong();
    });

    function togglePlaylist() {
        playlistEl.classList.toggle('show');
        playlistOverlay.classList.toggle('show');
    }

    songTitleContainer.addEventListener('click', togglePlaylist);
    playlistOverlay.addEventListener('click', togglePlaylist);

    playlistItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            loadSong(index);
            if(!audioPlayer.muted){
                playSong();
            }
            togglePlaylist();
        });
    });

    // Load initial song
    loadSong(0);

    getWeatherTheme();
    addThemeSwitcher();
});