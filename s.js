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
    
    // Mobile detection
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }


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
        const speed = 1.5;
        const isMobile = isMobileDevice();
        const maxSnowmen = isMobile ? 20 : 12; // More on mobile since auto-spawn
        let draggedSnowman = null;
        let dragOffsetX, dragOffsetY;
        let didDrag = false;
        let lastClickTime = 0;
        const clickCooldown = 500;
        let frameCount = 0;
        
        // Mobile auto-spawn
        let lastAutoSpawn = 0;
        const autoSpawnInterval = 5000; // 5 seconds
        
        // Monster system
        let monster = null;
        let monsterActive = false;
        const monsterTriggerCount = isMobile ? 15 : 100; // Mobile: 15, Desktop: 100 snowmen

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
                const currentTime = Date.now();
                
                // If we didn't drag, it was a click on a snowman
                if (!didDrag && currentTime - lastClickTime > clickCooldown) {
                    // Only create new snowman if under the limit and page is active
                    if (snowmen.length < maxSnowmen && !document.hidden) {
                        try {
                            snowmen.push({
                                x: Math.random() * width,
                                y: -50,
                                vx: (Math.random() - 0.5) * 2,
                                vy: 0,
                                size: 70,
                                dragging: false
                            });
                            lastClickTime = currentTime;
                        } catch (e) {
                            console.warn('Failed to create snowman:', e);
                        }
                    } else if (snowmen.length >= maxSnowmen) {
                        // Visual feedback when limit reached
                        try {
                            const card = document.querySelector('.card');
                            if (card) {
                                card.style.animation = 'none';
                                card.offsetHeight;
                                card.style.animation = 'animated-border 0.2s ease-in-out';
                            }
                        } catch (e) {
                            console.warn('Animation feedback error:', e);
                        }
                    }
                }
                
                // Reset state
                if (draggedSnowman.y >= height) { // If released on the ground
                    draggedSnowman.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
                }
                draggedSnowman.dragging = false;
                draggedSnowman = null;
            }
        };

        // Only add mouse events for desktop
        if (!isMobile) {
            canvas.addEventListener('mousedown', mouseDownHandler);
            canvas.addEventListener('mousemove', mouseMoveHandler);
            canvas.addEventListener('mouseup', mouseUpHandler);
        }

        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 3 + 1,
                speed: Math.random() * 1 + 0.5,
                drift: Math.random() * 2 - 1
            });
        }
        
        // Monster class
        class Monster {
            constructor() {
                this.x = width / 2;
                this.y = height + 100;
                this.targetY = height / 2;
                this.size = 80;
                this.phase = 'entering'; // entering, eating, leaving
                this.eatenCount = 0;
                this.animationTime = 0;
                this.mouthOpen = false;
            }
            
            update() {
                this.animationTime += 0.1;
                
                if (this.phase === 'entering') {
                    this.y -= 3;
                    if (this.y <= this.targetY) {
                        this.phase = 'eating';
                    }
                } else if (this.phase === 'eating') {
                    // Eat snowmen with suction effect
                    for (let i = snowmen.length - 1; i >= 0; i--) {
                        const snowman = snowmen[i];
                        const dx = this.x - snowman.x;
                        const dy = this.y - snowman.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Suction effect - pull snowmen towards monster
                        if (distance < this.size * 2) {
                            const pullForce = 0.05;
                            snowman.x += dx * pullForce;
                            snowman.y += dy * pullForce;
                        }
                        
                        if (distance < this.size * 0.7) {
                            snowmen.splice(i, 1);
                            this.eatenCount++;
                            
                            // Screen shake effect
                            canvas.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
                            setTimeout(() => {
                                canvas.style.transform = 'translate(0, 0)';
                            }, 100);
                        }
                    }
                    
                    // Move towards remaining snowmen or leave if all eaten
                    if (snowmen.length === 0) {
                        this.phase = 'leaving';
                    } else {
                        // Find nearest snowman
                        let nearestSnowman = snowmen[0];
                        let minDistance = Infinity;
                        
                        for (const snowman of snowmen) {
                            const dx = snowman.x - this.x;
                            const dy = snowman.y - this.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < minDistance) {
                                minDistance = distance;
                                nearestSnowman = snowman;
                            }
                        }
                        
                        const dx = nearestSnowman.x - this.x;
                        const dy = nearestSnowman.y - this.y;
                        this.x += Math.sign(dx) * 3;
                        this.y += Math.sign(dy) * 2;
                    }
                } else if (this.phase === 'leaving') {
                    this.y += 4;
                    if (this.y > height + 100) {
                        monsterActive = false;
                        monster = null;
                        return false; // Remove monster
                    }
                }
                
                this.mouthOpen = Math.sin(this.animationTime * 8) > 0;
                return true;
            }
            
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                // Monster shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(0, this.size + 10, this.size * 0.8, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Monster body (with gradient)
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                gradient.addColorStop(0, '#6a1b9a');
                gradient.addColorStop(1, '#2d0333');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Monster outline
                ctx.strokeStyle = '#4a0e4e';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Eyes with glow
                ctx.fillStyle = '#ff1744';
                ctx.shadowColor = '#ff1744';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(-25, -20, 12, 0, Math.PI * 2);
                ctx.arc(25, -20, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // Eye pupils
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-25, -20, 6, 0, Math.PI * 2);
                ctx.arc(25, -20, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Mouth
                ctx.fillStyle = '#000';
                ctx.beginPath();
                if (this.mouthOpen) {
                    ctx.arc(0, 15, 20, 0, Math.PI);
                    ctx.fill();
                    
                    // Teeth
                    ctx.fillStyle = '#fff';
                    for (let i = -15; i <= 15; i += 6) {
                        ctx.beginPath();
                        ctx.moveTo(i, 5);
                        ctx.lineTo(i + 2, 15);
                        ctx.lineTo(i - 2, 15);
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    // Tongue
                    ctx.fillStyle = '#d32f2f';
                    ctx.beginPath();
                    ctx.arc(0, 20, 8, 0, Math.PI);
                    ctx.fill();
                } else {
                    ctx.arc(0, 15, 12, 0, Math.PI);
                    ctx.fill();
                }
                
                // Horns
                ctx.fillStyle = '#424242';
                ctx.beginPath();
                ctx.moveTo(-15, -this.size);
                ctx.lineTo(-10, -this.size - 15);
                ctx.lineTo(-5, -this.size);
                ctx.closePath();
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(15, -this.size);
                ctx.lineTo(10, -this.size - 15);
                ctx.lineTo(5, -this.size);
                ctx.closePath();
                ctx.fill();
                
                // Eating particles effect
                if (this.phase === 'eating') {
                    ctx.fillStyle = '#fff';
                    for (let i = 0; i < 5; i++) {
                        const angle = this.animationTime + i;
                        const radius = 40 + Math.sin(angle) * 10;
                        const px = Math.cos(angle) * radius;
                        const py = Math.sin(angle) * radius;
                        ctx.beginPath();
                        ctx.arc(px, py, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                ctx.restore();
            }
        }

        function animate() {
            frameCount++;
            const currentTime = Date.now();
            
            // Skip heavy calculations on some frames for better performance
            const skipPhysics = frameCount % 2 === 0 && snowmen.length > 8;
            
            cardRect = card.getBoundingClientRect();
            
            // Auto-spawn snowmen on mobile
            if (isMobile && currentTime - lastAutoSpawn > autoSpawnInterval && snowmen.length < maxSnowmen && !monsterActive) {
                snowmen.push({
                    x: Math.random() * width,
                    y: -50,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 0,
                    size: 70,
                    dragging: false
                });
                lastAutoSpawn = currentTime;
            }
            
            // Check if monster should appear
            if (!monsterActive && snowmen.length >= monsterTriggerCount) {
                monster = new Monster();
                monsterActive = true;
                
                // Screen flash effect when monster appears
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(0, 0, width, height);
                
                // Vibrate on mobile (if supported)
                if (isMobile && navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            }
            
            // Clear canvas
            ctx.fillStyle = 'rgba(20, 20, 25, 1)';
            ctx.fillRect(0, 0, width, height);
            
            // Draw snowflakes (optimized)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < flakes.length; i++) {
                const f = flakes[i];
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
                f.y += f.speed;
                f.x += f.drift;
                if (f.y > height) { f.y = 0 - f.r; f.x = Math.random() * width; }
                if (f.x > width + f.r) f.x = 0 - f.r;
                if (f.x < 0 - f.r) f.x = width + f.r;
            }
            
            // Clean up out-of-bounds snowmen
            snowmen = snowmen.filter(s => s.x > -200 && s.x < width + 200 && s.y < height + 100);
            
            // Process all snowmen efficiently
            const groundSnowmen = [];
            
            // Update physics for all snowmen
            for (let i = 0; i < snowmen.length; i++) {
                const snowman = snowmen[i];
                if (snowman.dragging) continue;
                
                // Vertical movement
                snowman.vy += gravity;
                snowman.y += snowman.vy;
                
                // Ground collision
                if (snowman.y >= height) {
                    snowman.y = height;
                    snowman.vy = 0;
                    if (snowman.vx === 0) {
                        snowman.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
                    }
                    groundSnowmen.push(snowman);
                } else {
                    // Card collision for falling snowmen
                    const halfSize = snowman.size / 2;
                    if (snowman.x + halfSize > cardRect.left && snowman.x - halfSize < cardRect.right &&
                        snowman.y > cardRect.top && snowman.y - snowman.size < cardRect.bottom) {
                        
                        const prevY = snowman.y - snowman.vy;
                        if (prevY <= cardRect.top) {
                            snowman.y = cardRect.top;
                            snowman.vy = 0;
                            snowman.vx = snowman.vx || (Math.random() - 0.5) * 2;
                        } else {
                            snowman.x = snowman.x < cardRect.left + halfSize ? 
                                cardRect.left - halfSize : cardRect.right + halfSize;
                            snowman.vx *= -1;
                        }
                    }
                }
            }
            
            // Handle ground snowmen collisions (skip on alternate frames if too many)
            if (!skipPhysics) {
                for (let i = 0; i < groundSnowmen.length; i++) {
                    const snowman = groundSnowmen[i];
                    const halfSize = snowman.size / 2;
                    
                    // Wall boundaries
                    if (snowman.x <= halfSize) {
                        snowman.x = halfSize;
                        snowman.vx = Math.abs(snowman.vx);
                    }
                    if (snowman.x >= width - halfSize) {
                        snowman.x = width - halfSize;
                        snowman.vx = -Math.abs(snowman.vx);
                    }
                    
                    // Collision with other ground snowmen (limit checks)
                    let blocked = false;
                    const maxChecks = Math.min(groundSnowmen.length, 8); // Limit collision checks
                    
                    for (let j = 0; j < maxChecks; j++) {
                        if (i === j) continue;
                        const other = groundSnowmen[j];
                        const dx = other.x - snowman.x;
                        const distance = Math.abs(dx);
                        const minDistance = halfSize + other.size / 2;
                        
                        if (distance < minDistance + 5) {
                            // Simple separation
                            const pushForce = 3; // Fixed push force for performance
                            if (dx > 0) {
                                snowman.x -= pushForce;
                                other.x += pushForce;
                            } else {
                                snowman.x += pushForce;
                                other.x -= pushForce;
                            }
                            
                            if ((snowman.vx > 0 && dx > 0) || (snowman.vx < 0 && dx < 0)) {
                                blocked = true;
                            }
                        }
                    }
                    
                    // Update position
                    if (!blocked) {
                        snowman.x += snowman.vx;
                    } else {
                        snowman.vx = -snowman.vx;
                    }
                }
            } else {
                // Simple movement without collision on skip frames
                for (let i = 0; i < groundSnowmen.length; i++) {
                    const snowman = groundSnowmen[i];
                    const halfSize = snowman.size / 2;
                    
                    // Only check walls
                    if (snowman.x <= halfSize || snowman.x >= width - halfSize) {
                        snowman.vx = -snowman.vx;
                    }
                    snowman.x += snowman.vx;
                }
            }
            
            // Update and draw monster
            if (monsterActive && monster) {
                if (!monster.update()) {
                    monster = null;
                    monsterActive = false;
                }
            }
            
            // Draw all snowmen
            ctx.font = '70px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            for (let i = 0; i < snowmen.length; i++) {
                ctx.fillText('☃️', snowmen[i].x, snowmen[i].y);
            }
            
            // Draw monster on top
            if (monsterActive && monster) {
                monster.draw();
            }
            
            // Draw snowmen counter
            if (!monsterActive) {
                if (!isMobile) {
                    // Desktop version - top left
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.font = 'bold 18px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Snowmen: ${snowmen.length}/${monsterTriggerCount}`, 20, 30);
                    
                    // Progress bar
                    const barWidth = 200;
                    const barHeight = 8;
                    const progress = Math.min(snowmen.length / monsterTriggerCount, 1);
                    
                    // Background
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(20, 40, barWidth, barHeight);
                    
                    // Progress
                    const gradient = ctx.createLinearGradient(20, 40, 20 + barWidth, 40);
                    gradient.addColorStop(0, '#4CAF50');
                    gradient.addColorStop(0.7, '#FF9800');
                    gradient.addColorStop(1, '#F44336');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(20, 40, barWidth * progress, barHeight);
                    
                    // Warning text when close
                    if (snowmen.length >= monsterTriggerCount - 10 && snowmen.length < monsterTriggerCount) {
                        ctx.fillStyle = '#FF5722';
                        ctx.font = 'bold 14px Arial';
                        ctx.fillText('⚠️ Monster incoming!', 20, 65);
                    }
                } else {
                    // Mobile version - center top
                    const progress = Math.min(snowmen.length / monsterTriggerCount, 1);
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`❄️ ${snowmen.length}/${monsterTriggerCount}`, width/2, 30);
                    
                    // Circular progress
                    const centerX = width/2;
                    const centerY = 50;
                    const radius = 20;
                    
                    // Background circle
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Progress arc
                    if (progress > 0) {
                        ctx.strokeStyle = progress < 0.8 ? '#4CAF50' : '#FF5722';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, radius, -Math.PI/2, (-Math.PI/2) + (progress * Math.PI * 2));
                        ctx.stroke();
                    }
                    
                    // Warning on mobile
                    if (snowmen.length >= monsterTriggerCount - 2 && snowmen.length < monsterTriggerCount) {
                        ctx.fillStyle = '#FF5722';
                        ctx.font = 'bold 14px Arial';
                        ctx.fillText('🚨 Monster Coming!', width/2, 90);
                    }
                }
            }

            // Pause animation when tab is hidden for performance
            if (!document.hidden) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    if (!document.hidden) requestAnimationFrame(animate);
                }, 100);
            }
        }
        
        // Handle visibility change to pause/resume animation
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !animationFrameId) {
                animate();
            }
        });
        
        // Keyboard shortcut for testing (desktop only) - COMMENTED OUT
        /*
        if (!isMobile) {
            document.addEventListener('keydown', (e) => {
                // Press 'T' key to test monster
                if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.altKey) {
                    const testBtn = document.getElementById('test-btn');
                    if (testBtn && !testBtn.disabled) {
                        testBtn.click();
                    }
                }
                
                // Press 'C' key to clear all snowmen
                if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey) {
                    snowmen.length = 0;
                    if (monster) {
                        monster = null;
                        monsterActive = false;
                    }
                    
                    ctx.fillStyle = 'rgba(100, 255, 100, 0.5)';
                    ctx.fillRect(width/2 - 100, height/2 - 25, 200, 50);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('CLEARED!', width/2, height/2 + 5);
                }
            });
        }
        */
        
        // Test button functionality (desktop only) - COMMENTED OUT
        /*
        if (!isMobile) {
            const testBtn = document.getElementById('test-btn');
            if (testBtn) {
                let testInProgress = false;
                
                testBtn.addEventListener('click', () => {
                    if (testInProgress) return;
                    
                    testInProgress = true;
                    testBtn.classList.add('pulsing');
                    testBtn.textContent = '🔥 Testing...';
                    testBtn.disabled = true;
                    
                    snowmen.length = 0;
                    if (monster) {
                        monster = null;
                        monsterActive = false;
                    }
                    
                    setTimeout(() => {
                        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
                        ctx.fillRect(width/2 - 150, height/2 - 50, 300, 100);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 20px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('TEST MODE ACTIVATED!', width/2, height/2 - 10);
                        ctx.font = '16px Arial';
                        ctx.fillText('Spawning snowmen...', width/2, height/2 + 15);
                    }, 100);
                    
                    for (let i = 0; i < monsterTriggerCount + 2; i++) {
                        setTimeout(() => {
                            if (snowmen.length < maxSnowmen) {
                                snowmen.push({
                                    x: Math.random() * (width - 100) + 50,
                                    y: -50 - (i * 40),
                                    vx: (Math.random() - 0.5) * 2,
                                    vy: 0,
                                    size: 70,
                                    dragging: false
                                });
                                
                                testBtn.textContent = `🐉 Spawning... (${snowmen.length}/${monsterTriggerCount})`;
                            }
                        }, i * 300);
                    }
                    
                    setTimeout(() => {
                        testBtn.classList.remove('pulsing');
                        testBtn.textContent = '🐉 Test Monster';
                        testBtn.disabled = false;
                        testInProgress = false;
                    }, 8000);
                });
                
                setInterval(() => {
                    if (!monsterActive && snowmen.length === 0 && !testBtn.classList.contains('pulsing')) {
                        testBtn.style.animation = 'pulse 0.5s ease-in-out';
                        setTimeout(() => {
                            testBtn.style.animation = '';
                        }, 500);
                    }
                }, 3000);
            }
        }
        */
        
        // Show mobile instructions
        if (isMobile) {
            setTimeout(() => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, width, height);
                
                ctx.fillStyle = '#fff';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Snowmen will appear automatically!', width/2, height/2 - 40);
                ctx.fillText('Watch for the monster...', width/2, height/2);
                
                setTimeout(() => {
                    animate(); // Start animation after message
                }, 3000);
            }, 1000);
        } else {
            // Show desktop instructions once
            setTimeout(() => {
                if (!localStorage.getItem('snow-instructions-shown')) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(0, 0, width, height);
                    
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('❄️ Snow Theme Controls', width/2, height/2 - 60);
                    
                    ctx.font = '18px Arial';
                    ctx.fillText('• Click snowmen to create more', width/2, height/2 - 20);
                    ctx.fillText('• Drag snowmen around', width/2, height/2 + 10);
                    
                    ctx.font = '16px Arial';
                    ctx.fillStyle = '#ffa500';
                    ctx.fillText('Monster appears at 100 snowmen!', width/2, height/2 + 50);
                    
                    ctx.fillStyle = '#ccc';
                    ctx.font = '14px Arial';
                    ctx.fillText('(This message will disappear in 5 seconds)', width/2, height/2 + 120);
                    
                    setTimeout(() => {
                        localStorage.setItem('snow-instructions-shown', 'true');
                    }, 5000);
                }
            }, 1000);
            
            animate();
        }
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