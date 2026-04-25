/**
 * Floating Particle System
 * Premium animated particle background with connections.
 */
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.animFrame = null;
        this.isUnderAttack = false;

        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Listen for attack trigger
        window.addEventListener('attack-simulation-started', () => {
            this.isUnderAttack = true;
            setTimeout(() => this.isUnderAttack = false, 2500); // 2.5s duration
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        const count = Math.min(80, Math.floor((this.canvas.width * this.canvas.height) / 15000));
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                hue: Math.random() > 0.5 ? 239 : 187  // indigo or cyan
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const speedMult = this.isUnderAttack ? 8 : 1; // 8x speed during attack
        const hueOverride = this.isUnderAttack ? 350 : null; // Red hue

        this.particles.forEach((p, i) => {
            // Move
            p.x += p.vx * speedMult;
            p.y += p.vy * speedMult;

            // Wrap
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            // Mouse repel
            if (this.mouse.x) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.mouse.radius) {
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    p.x += (dx / dist) * force * 2;
                    p.y += (dy / dist) * force * 2;
                }
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${hueOverride || p.hue}, 80%, 65%, ${p.opacity * (this.isUnderAttack ? 1.5 : 1)})`;
            this.ctx.fill();

            // Connect nearby
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `hsla(${hueOverride || 239}, 80%, 65%, ${0.08 * (1 - dist / 120)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        });

        this.animFrame = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
}
