/**
 * Canvas Charts Module
 * Animated donut, area, and sparkline charts.
 */
const Charts = {

    // ── Donut Chart ────────────────────────────────────────
    donut(canvasId, data, opts = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = opts.size || 140;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const cx = size / 2, cy = size / 2;
        const radius = size / 2 - 10;
        const lineWidth = opts.lineWidth || 14;
        const total = data.reduce((a, d) => a + d.value, 0) || 1;
        const colors = data.map(d => d.color);

        let animProgress = 0;
        const dur = 1200;
        const start = performance.now();

        function draw(now) {
            animProgress = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - animProgress, 3);
            ctx.clearRect(0, 0, size, size);

            // Background ring
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(148,163,184,0.08)';
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Data arcs
            let startAngle = -Math.PI / 2;
            data.forEach((d, i) => {
                const arc = (d.value / total) * Math.PI * 2 * eased;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, startAngle + arc);
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
                startAngle += arc;
            });

            // Center text
            ctx.fillStyle = '#f1f5f9';
            ctx.font = `800 ${size * 0.18}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(eased * total), cx, cy - 6);

            ctx.fillStyle = '#64748b';
            ctx.font = `500 ${size * 0.085}px 'Inter', sans-serif`;
            ctx.fillText(opts.label || 'TOTAL', cx, cy + 14);

            if (animProgress < 1) requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
    },

    // ── Area Chart ─────────────────────────────────────────
    area(canvasId, points, opts = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = opts.width || canvas.parentElement.clientWidth || 400;
        const h = opts.height || 160;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        const p = 30; // padding
        const max = Math.max(...points, 1) * 1.1;
        const step = (w - p * 2) / (points.length - 1 || 1);
        const color1 = opts.color || '#6366f1';
        const color2 = opts.color2 || '#06b6d4';

        let animProgress = 0;
        const dur = 1000;
        const start = performance.now();

        function draw(now) {
            animProgress = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - animProgress, 3);
            ctx.clearRect(0, 0, w, h);

            // Grid lines
            for (let i = 0; i < 5; i++) {
                const y = p + ((h - p * 2) / 4) * i;
                ctx.beginPath();
                ctx.moveTo(p, y);
                ctx.lineTo(w - p, y);
                ctx.strokeStyle = 'rgba(148,163,184,0.06)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Area fill
            const grad = ctx.createLinearGradient(0, p, 0, h - p);
            grad.addColorStop(0, `${color1}33`);
            grad.addColorStop(1, `${color1}00`);

            ctx.beginPath();
            ctx.moveTo(p, h - p);
            points.forEach((v, i) => {
                const x = p + step * i;
                const y = h - p - ((v / max) * (h - p * 2)) * eased;
                if (i === 0) ctx.lineTo(x, y);
                else {
                    const px = p + step * (i - 1);
                    const py = h - p - ((points[i - 1] / max) * (h - p * 2)) * eased;
                    const cpx = (px + x) / 2;
                    ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
                }
            });
            ctx.lineTo(p + step * (points.length - 1), h - p);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Line
            const lineGrad = ctx.createLinearGradient(p, 0, w - p, 0);
            lineGrad.addColorStop(0, color1);
            lineGrad.addColorStop(1, color2);
            ctx.beginPath();
            points.forEach((v, i) => {
                const x = p + step * i;
                const y = h - p - ((v / max) * (h - p * 2)) * eased;
                if (i === 0) ctx.moveTo(x, y);
                else {
                    const px = p + step * (i - 1);
                    const py = h - p - ((points[i - 1] / max) * (h - p * 2)) * eased;
                    const cpx = (px + x) / 2;
                    ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
                }
            });
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Dots
            points.forEach((v, i) => {
                const x = p + step * i;
                const y = h - p - ((v / max) * (h - p * 2)) * eased;
                ctx.beginPath();
                ctx.arc(x, y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#0a0e1a';
                ctx.fill();
                ctx.strokeStyle = color2;
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            if (animProgress < 1) requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
    },

    // ── Sparkline ──────────────────────────────────────────
    sparkline(canvasId, points, opts = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = opts.width || 80;
        const h = opts.height || 30;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        const max = Math.max(...points, 1);
        const min = Math.min(...points, 0);
        const range = max - min || 1;
        const step = w / (points.length - 1 || 1);
        const color = opts.color || '#6366f1';

        ctx.beginPath();
        points.forEach((v, i) => {
            const x = step * i;
            const y = h - ((v - min) / range) * (h - 4) - 2;
            if (i === 0) ctx.moveTo(x, y);
            else {
                const px = step * (i - 1);
                const py = h - ((points[i - 1] - min) / range) * (h - 4) - 2;
                const cpx = (px + x) / 2;
                ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
            }
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Gradient fill under
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, color + '30');
        grad.addColorStop(1, color + '00');
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }
};
